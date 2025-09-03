import { Injectable, NotFoundException, Logger, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { Request, RequestStatus } from '../entities/request.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log('Creating new request');

    try {
      const request = this.requestRepository.create(createRequestDto);
      const savedRequest = await this.requestRepository.save(request);

      // Invalidar cache relacionado
      await this.cacheManager.del('requests:all');
      await this.cacheManager.del('requests:pending');
      await this.cacheManager.del(`requests:user:${savedRequest.userId}`);

      this.logger.log(`Request created successfully with ID: ${savedRequest.id}`);
      return savedRequest;

    } catch (error) {
      this.logger.error(`Error creating request: ${error.message}`, error.stack);
      throw new Error('Failed to create request');
    }
  }

  async findAll(): Promise<Request[]> {
    this.logger.log('Retrieving all requests');

    try {
      // Verificar cache primero
      const cacheKey = 'requests:all';
      const cachedRequests = await this.cacheManager.get<Request[]>(cacheKey);

      if (cachedRequests) {
        this.logger.log(`Found ${cachedRequests.length} requests in cache`);
        return cachedRequests;
      }

      const requests = await this.requestRepository.find({
        relations: ['user', 'vehicle'],
        order: { createdAt: 'DESC' }
      });

      // Guardar en cache por 2 minutos (120 segundos) - más corto porque cambian frecuentemente
      await this.cacheManager.set(cacheKey, requests, 120);

      this.logger.log(`Found ${requests.length} requests and cached them`);
      return requests;

    } catch (error) {
      this.logger.error(`Error fetching requests: ${error.message}`, error.stack);
      throw new Error('Failed to fetch requests');
    }
  }

  async findOne(id: number): Promise<Request> {
    this.logger.log(`Finding request with ID: ${id}`);

    try {
      // Verificar cache primero
      const cacheKey = `requests:id:${id}`;
      const cachedRequest = await this.cacheManager.get<Request>(cacheKey);

      if (cachedRequest) {
        this.logger.log(`Found request ${id} in cache`);
        return cachedRequest;
      }

      const request = await this.requestRepository.findOne({
        where: { id },
        relations: ['user', 'vehicle']
      });

      if (!request) {
        this.logger.warn(`Request with ID ${id} not found`);
        throw new NotFoundException(`Request with ID ${id} not found`);
      }

      // Guardar en cache por 5 minutos (300 segundos)
      await this.cacheManager.set(cacheKey, request, 300);

      this.logger.log(`Request found and cached: ${id}`);
      return request;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching request ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to fetch request');
    }
  }

  // Método adicional para obtener requests pendientes (muy útil para drivers)
  async findPendingRequests(): Promise<Request[]> {
    this.logger.log('Retrieving pending requests');

    try {
      // Verificar cache primero
      const cacheKey = 'requests:pending';
      const cachedRequests = await this.cacheManager.get<Request[]>(cacheKey);

      if (cachedRequests) {
        this.logger.log(`Found ${cachedRequests.length} pending requests in cache`);
        return cachedRequests;
      }

      const requests = await this.requestRepository.find({
        where: { status: RequestStatus.PENDING },
        relations: ['user'],
        order: { createdAt: 'ASC' }
      });

      // Cache más corto para pending requests (1 minuto)
      await this.cacheManager.set(cacheKey, requests, 60);

      this.logger.log(`Found ${requests.length} pending requests and cached them`);
      return requests;

    } catch (error) {
      this.logger.error(`Error fetching pending requests: ${error.message}`, error.stack);
      throw new Error('Failed to fetch pending requests');
    }
  }

  // Método para obtener requests de un usuario específico
  async findByUserId(userId: number): Promise<Request[]> {
    this.logger.log(`Retrieving requests for user ${userId}`);

    try {
      // Verificar cache primero
      const cacheKey = `requests:user:${userId}`;
      const cachedRequests = await this.cacheManager.get<Request[]>(cacheKey);

      if (cachedRequests) {
        this.logger.log(`Found ${cachedRequests.length} requests for user ${userId} in cache`);
        return cachedRequests;
      }

      const requests = await this.requestRepository.find({
        where: { userId },
        relations: ['vehicle'],
        order: { createdAt: 'DESC' }
      });

      // Guardar en cache por 3 minutos (180 segundos)
      await this.cacheManager.set(cacheKey, requests, 180);

      this.logger.log(`Found ${requests.length} requests for user ${userId} and cached them`);
      return requests;

    } catch (error) {
      this.logger.error(`Error fetching requests for user ${userId}: ${error.message}`, error.stack);
      throw new Error('Failed to fetch user requests');
    }
  }

  async update(id: number, updateRequestDto: UpdateRequestDto, currentUser: User): Promise<Request> {
    this.logger.log(`Updating request with ID: ${id}`);

    try {
      // Buscar primero la request
      const existingRequest = await this.findOne(id);

      if (!existingRequest) {
        this.logger.warn(`Request with ID ${id} not found for update`);
        throw new NotFoundException(`Request with ID ${id} not found`);
      }

      // Validar que el currentUser sea el dueño (para clientes) o tenga permisos (para drivers/staff)
      if (existingRequest.user.id !== currentUser.id && currentUser.role !== 'staff' && currentUser.role !== 'admin') {
        this.logger.warn(`User ${currentUser.id} tried to update request ${id}`);
        throw new ForbiddenException('You can only update your own requests');
      }

      // Preload con los cambios
      const request = await this.requestRepository.preload({
        id: id,
        ...updateRequestDto,
      });

      if (!request) {
        this.logger.warn(`Request with ID ${id} not found after preload`);
        throw new NotFoundException(`Request with ID ${id} not found`);
      }

      const updatedRequest = await this.requestRepository.save(request);

      // Invalidar caches relacionados
      await this.cacheManager.del(`requests:id:${id}`);
      await this.cacheManager.del('requests:all');
      await this.cacheManager.del('requests:pending');
      await this.cacheManager.del(`requests:user:${existingRequest.userId}`);

      // Si se asignó un driver, invalidar su cache también
      if (updateRequestDto.driverId) {
        await this.cacheManager.del(`requests:driver:${updateRequestDto.driverId}`);
      }

      this.logger.log(`Request ${id} updated successfully`);
      return updatedRequest;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error updating request ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to update request');
    }
  }

  async remove(id: number, currentUser: User): Promise<void> {
    this.logger.log(`Removing request with ID: ${id}`);

    try {
      const request = await this.findOne(id);

      if (!request) {
        this.logger.warn(`Request with ID ${id} not found for removal`);
        throw new NotFoundException(`Request with ID ${id} not found`);
      }

      // Validar que el currentUser sea el dueño
      if (request.user.id !== currentUser.id) {
        this.logger.warn(`User ${currentUser.id} tried to delete request ${id}`);
        throw new ForbiddenException('You can only delete your own requests');
      }

      await this.requestRepository.remove(request);

      // Invalidar caches relacionados
      await this.cacheManager.del(`requests:id:${id}`);
      await this.cacheManager.del('requests:all');
      await this.cacheManager.del('requests:pending');
      await this.cacheManager.del(`requests:user:${request.userId}`);

      if (request.driverId) {
        await this.cacheManager.del(`requests:driver:${request.driverId}`);
      }

      this.logger.log(`Request ${id} deleted successfully`);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error deleting request ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to delete request');
    }
  }
}