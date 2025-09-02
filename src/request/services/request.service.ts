import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { Request } from '../entities/request.entity';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';
import { Driver } from 'src/driver/entities/driver.entity';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
  ) { }

  async create(createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log('Creating new request');
    const request = this.requestRepository.create(createRequestDto);
    return this.requestRepository.save(request);
  }

  async findAll(): Promise<Request[]> {
    this.logger.log('Retrieving all requests');
    return this.requestRepository.find();
  }

  async findOne(id: number): Promise<Request> {
    this.logger.log(`Finding request with ID: ${id}`);
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) {
      this.logger.warn(`Request with ID ${id} not found`);
      throw new NotFoundException(`Request with ID ${id} not found`);
    }
    return request;
  }

  async update(id: number, updateRequestDto: UpdateRequestDto, currentUser: User): Promise<Request> {
    this.logger.log(`Updating request with ID: ${id}`);

    // Buscar primero la request
    const existingRequest = await this.findOne(id);

    if (!existingRequest) {
      this.logger.warn(`Request with ID ${id} not found for update`);
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    // Validar que el currentUser sea el dueño
    if (existingRequest.user.id !== currentUser.id) {
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

    return this.requestRepository.save(request);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    this.logger.log(`Removing request with ID: ${id}`);

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
  }
}
