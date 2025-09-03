import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);

    try {
      // Verificar si el email ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        this.logger.warn(`Attempt to create user with existing email: ${createUserDto.email}`);
        throw new ConflictException('Email already exists');
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(createUserDto.password, this.saltRounds);

      // Crear el usuario
      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      // Invalidar cache relacionado
      await this.cacheManager.del('users:all');
      await this.cacheManager.del(`users:email:${createUserDto.email}`);

      this.logger.log(`User created successfully with ID: ${savedUser.id}`);

      // Eliminar la contraseña del objeto de respuesta
      const { password, ...userResponse } = savedUser;
      return userResponse as User;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw new Error('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');

    try {
      // Verificar cache primero
      const cacheKey = 'users:all';
      const cachedUsers = await this.cacheManager.get<User[]>(cacheKey);

      if (cachedUsers) {
        this.logger.log(`Found ${cachedUsers.length} users in cache`);
        return cachedUsers;
      }

      const users = await this.userRepository.find({
        select: ['id', 'name', 'email', 'role'], // Excluir password
        relations: ['requests'],
      });

      // Guardar en cache por 5 minutos (300 segundos)
      await this.cacheManager.set(cacheKey, users, 300);

      this.logger.log(`Found ${users.length} users and cached them`);
      return users;

    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`, error.stack);
      throw new Error('Failed to fetch users');
    }
  }

  async findOne(id: number): Promise<User> {
    this.logger.log(`Fetching user with ID: ${id}`);

    try {
      // Verificar cache primero
      const cacheKey = `users:id:${id}`;
      const cachedUser = await this.cacheManager.get<User>(cacheKey);

      if (cachedUser) {
        this.logger.log(`Found user ${id} in cache: ${cachedUser.email}`);
        return cachedUser;
      }

      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'name', 'email', 'role'],
        relations: ['requests'],
      });

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException('User not found');
      }

      // Guardar en cache por 10 minutos (600 segundos)
      await this.cacheManager.set(cacheKey, user, 600);

      this.logger.log(`User found and cached: ${user.email}`);
      return user;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching user ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Fetching user by email: ${email}`);

    try {
      // Verificar cache primero
      const cacheKey = `users:email:${email}`;
      const cachedUser = await this.cacheManager.get<User>(cacheKey);

      if (cachedUser) {
        this.logger.log(`Found user by email in cache: ${email}`);
        return cachedUser;
      }

      const user = await this.userRepository.findOne({
        where: { email },
        // Incluir password para autenticación
      });

      if (user) {
        // Guardar en cache por 10 minutos (600 segundos)
        await this.cacheManager.set(cacheKey, user, 600);
        this.logger.log(`User found by email and cached: ${email}`);
      } else {
        this.logger.log(`No user found with email: ${email}`);
      }

      return user;

    } catch (error) {
      this.logger.error(`Error fetching user by email ${email}: ${error.message}`, error.stack);
      throw new Error('Failed to fetch user by email');
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      // Verificar que el usuario autenticado es el dueño
      if (currentUser.id !== id) {
        this.logger.warn(`User ${currentUser.id} tried to update user ${id}`);
        throw new ForbiddenException('You can only update your own account');
      }

      const user = await this.findOne(id);

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          this.logger.warn(`Attempt to update to existing email: ${updateUserDto.email}`);
          throw new ConflictException('Email already exists');
        }
      }

      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, this.saltRounds);
        this.logger.log(`Password updated for user ID: ${id}`);
      }

      await this.userRepository.update(id, updateUserDto);

      // Invalidar caches relacionados
      await this.cacheManager.del(`users:id:${id}`);
      await this.cacheManager.del(`users:email:${user.email}`);
      await this.cacheManager.del('users:all');

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        await this.cacheManager.del(`users:email:${updateUserDto.email}`);
      }

      const updatedUser = await this.findOne(id);
      this.logger.log(`User updated successfully: ${updatedUser.email}`);

      return updatedUser;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error updating user ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to update user');
    }
  }

  async remove(id: number, currentUser: User): Promise<void> {
    this.logger.log(`Removing user with ID: ${id}`);

    try {
      // Verificar que el usuario autenticado es el dueño
      if (currentUser.id !== id) {
        this.logger.warn(`User ${currentUser.id} tried to delete user ${id}`);
        throw new ForbiddenException('You can only delete your own account');
      }

      const user = await this.findOne(id);

      const result = await this.userRepository.delete(id);

      if (result.affected === 0) {
        this.logger.warn(`No user was deleted with ID: ${id}`);
        throw new NotFoundException('User not found');
      }

      // Invalidar caches relacionados
      await this.cacheManager.del(`users:id:${id}`);
      await this.cacheManager.del(`users:email:${user.email}`);
      await this.cacheManager.del('users:all');

      this.logger.log(`User deleted successfully: ${user.email}`);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error deleting user ${id}: ${error.message}`, error.stack);
      throw new Error('Failed to delete user');
    }
  }

  // Método utilitario para validar contraseñas (útil para autenticación)
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error(`Error validating password: ${error.message}`);
      return false;
    }
  }

}