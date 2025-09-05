import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from 'src/users/services/users.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

// Mock de bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheManager: jest.Mocked<Cache>;

  // Datos de prueba
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.CLIENT,
    requests: []
  };

  const mockCreateUserDto: CreateUserDto = {
    name: 'New User',
    email: 'new@example.com',
    password: 'password123',
    role: UserRole.CLIENT
  };

  const mockUpdateUserDto: UpdateUserDto = {
    name: 'Updated User',
    email: 'updated@example.com'
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    cacheManager = module.get<Cache>(CACHE_MANAGER) as jest.Mocked<Cache>;
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.findOne.mockResolvedValue(null); // No existe usuario con ese email
      userRepository.create.mockReturnValue({ ...mockUser, ...mockCreateUserDto });
      userRepository.save.mockResolvedValue({ ...mockUser, ...mockCreateUserDto, id: 2 });

      // Act
      const result = await service.create(mockCreateUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 12);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith('users:all');
      expect(result.password).toBeUndefined(); // Password no debe estar en la respuesta
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser); // Usuario ya existe

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email }
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow('Failed to create user');
    });
  });

  describe('findAll', () => {
    it('should return all users from cache if available', async () => {
      // Arrange
      const mockUsers = [mockUser];
      cacheManager.get.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('users:all');
      expect(userRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should fetch users from database when not in cache', async () => {
      // Arrange
      const mockUsers = [mockUser];
      cacheManager.get.mockResolvedValue(null);
      userRepository.find.mockResolvedValue(mockUsers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('users:all');
      expect(userRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'email', 'role'],
        relations: ['requests']
      });
      expect(cacheManager.set).toHaveBeenCalledWith('users:all', mockUsers, 300);
      expect(result).toEqual(mockUsers);
    });

    it('should handle database errors when fetching users', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('findOne', () => {
    it('should return user from cache if available', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('users:id:1');
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch user from database when not in cache', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('users:id:1');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'name', 'email', 'role'],
        relations: ['requests']
      });
      expect(cacheManager.set).toHaveBeenCalledWith('users:id:1', mockUser, 600);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        select: ['id', 'name', 'email', 'role'],
        relations: ['requests']
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user by email from cache if available', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('users:email:test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should fetch user by email from database when not in cache', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(cacheManager.set).toHaveBeenCalledWith('users:email:test@example.com', mockUser, 600);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('notfound@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const currentUser = { ...mockUser };
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.findOne.mockResolvedValue(null); // No existe otro usuario con el nuevo email
      userRepository.update.mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser).mockResolvedValueOnce(updatedUser);

      // Act
      const result = await service.update(1, mockUpdateUserDto, currentUser);

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(1, mockUpdateUserDto);
      expect(cacheManager.del).toHaveBeenCalledWith('users:id:1');
      expect(cacheManager.del).toHaveBeenCalledWith('users:all');
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when user tries to update another user', async () => {
      // Arrange
      const differentUser = { ...mockUser, id: 2 };

      // Act & Assert
      await expect(service.update(1, mockUpdateUserDto, differentUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const currentUser = { ...mockUser };
      const existingUser = { ...mockUser, id: 2 };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.findOne.mockResolvedValue(existingUser); // Otro usuario con el email ya existe

      // Act & Assert
      await expect(service.update(1, { email: 'existing@example.com' }, currentUser))
        .rejects.toThrow(ConflictException);
    });

    it('should hash password when updating password', async () => {
      // Arrange
      const currentUser = { ...mockUser };
      const updateWithPassword = { password: 'newPassword123' };
      const hashedPassword = 'newHashedPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockUser);

      // Act
      await service.update(1, updateWithPassword, currentUser);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(userRepository.update).toHaveBeenCalledWith(1, { password: hashedPassword });
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      const currentUser = { ...mockUser };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      // Act
      await service.remove(1, currentUser);

      // Assert
      expect(userRepository.delete).toHaveBeenCalledWith(1);
      expect(cacheManager.del).toHaveBeenCalledWith('users:id:1');
      expect(cacheManager.del).toHaveBeenCalledWith('users:email:test@example.com');
      expect(cacheManager.del).toHaveBeenCalledWith('users:all');
    });

    it('should throw ForbiddenException when user tries to delete another user', async () => {
      // Arrange
      const differentUser = { ...mockUser, id: 2 };

      // Act & Assert
      await expect(service.remove(1, differentUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when no user was deleted', async () => {
      // Arrange
      const currentUser = { ...mockUser };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      // Act & Assert
      await expect(service.remove(1, currentUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validatePassword('plainPassword', 'hashedPassword');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validatePassword('wrongPassword', 'hashedPassword');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when bcrypt throws error', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      // Act
      const result = await service.validatePassword('password', 'hashedPassword');

      // Assert
      expect(result).toBe(false);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});