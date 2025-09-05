import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { UsersController } from 'src/users/controllers/users.controller';
import { UsersService } from 'src/users/services/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  // Datos de prueba
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.CLIENT,
    requests: []
  };

  const mockUsers: User[] = [
    mockUser,
    {
      id: 2,
      name: 'Another User',
      email: 'another@example.com',
      password: 'hashedPassword456',
      role: UserRole.ADMIN,
      requests: []
    }
  ];

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
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const expectedUser = { ...mockUser, ...mockCreateUserDto, id: 2 };
      usersService.create.mockResolvedValue(expectedUser);

      // Act
      const result = await controller.create(mockCreateUserDto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      usersService.create.mockRejectedValue(new ConflictException('Email already exists'));

      // Act & Assert
      await expect(controller.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      const invalidDto: CreateUserDto = {
        name: '',
        email: 'invalid-email',
        password: '123', // Too short
        role: UserRole.CLIENT
      };
      usersService.create.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow();
      expect(usersService.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle database errors during user creation', async () => {
      // Arrange
      usersService.create.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.create(mockCreateUserDto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      usersService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors when fetching all users', async () => {
      // Arrange
      usersService.findAll.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle service exceptions gracefully', async () => {
      // Arrange
      usersService.findAll.mockRejectedValue(new Error('Failed to fetch users'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('findOne', () => {
    it('should return a user by id successfully', async () => {
      // Arrange
      usersService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      usersService.findOne.mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(usersService.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle invalid ID parameter', async () => {
      // Arrange
      const invalidId = 'not-a-number' as any;
      // Nota: ParseIntPipe manejaría esto en runtime, pero lo simulamos aquí

      // Act & Assert - En un escenario real, ParseIntPipe lanzaría BadRequestException
      // Aquí simulamos que el servicio recibe un NaN
      usersService.findOne.mockRejectedValue(new Error('Invalid ID'));
      await expect(controller.findOne(invalidId)).rejects.toThrow();
    });

    it('should handle database errors when fetching user', async () => {
      // Arrange
      usersService.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.findOne(1)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update user successfully when current user is the owner', async () => {
      // Arrange
      const currentUser = mockUser;
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      usersService.update.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(1, mockUpdateUserDto, currentUser);

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(1, mockUpdateUserDto, currentUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when user tries to update another user', async () => {
      // Arrange
      const currentUser = mockUser;
      const differentUserId = 2;
      usersService.update.mockRejectedValue(new ForbiddenException('You can only update your own account'));

      // Act & Assert
      await expect(controller.update(differentUserId, mockUpdateUserDto, currentUser))
        .rejects.toThrow(ForbiddenException);
      expect(usersService.update).toHaveBeenCalledWith(differentUserId, mockUpdateUserDto, currentUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.update.mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(controller.update(999, mockUpdateUserDto, currentUser))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const currentUser = mockUser;
      const updateWithExistingEmail = { email: 'existing@example.com' };
      usersService.update.mockRejectedValue(new ConflictException('Email already exists'));

      // Act & Assert
      await expect(controller.update(1, updateWithExistingEmail, currentUser))
        .rejects.toThrow(ConflictException);
    });

    it('should handle partial updates successfully', async () => {
      // Arrange
      const currentUser = mockUser;
      const partialUpdate = { name: 'Only Name Updated' };
      const updatedUser = { ...mockUser, name: 'Only Name Updated' };
      usersService.update.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(1, partialUpdate, currentUser);

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(1, partialUpdate, currentUser);
      expect(result).toEqual(updatedUser);
      expect(result.name).toBe('Only Name Updated');
      expect(result.email).toBe(mockUser.email); // Should remain unchanged
    });

    it('should handle password updates', async () => {
      // Arrange
      const currentUser = mockUser;
      const passwordUpdate = { password: 'newPassword123' };
      const updatedUser = { ...mockUser };
      usersService.update.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(1, passwordUpdate, currentUser);

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(1, passwordUpdate, currentUser);
      expect(result).toEqual(updatedUser);
      // Note: El password no debería estar visible en la respuesta
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.update.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.update(1, mockUpdateUserDto, currentUser))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('remove', () => {
    it('should remove user successfully when current user is the owner', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.remove.mockResolvedValue();

      // Act
      await controller.remove(1, currentUser);

      // Assert
      expect(usersService.remove).toHaveBeenCalledWith(1, currentUser);
    });

    it('should throw ForbiddenException when user tries to delete another user', async () => {
      // Arrange
      const currentUser = mockUser;
      const differentUserId = 2;
      usersService.remove.mockRejectedValue(new ForbiddenException('You can only delete your own account'));

      // Act & Assert
      await expect(controller.remove(differentUserId, currentUser))
        .rejects.toThrow(ForbiddenException);
      expect(usersService.remove).toHaveBeenCalledWith(differentUserId, currentUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      // Act & Assert
      await expect(controller.remove(999, currentUser))
        .rejects.toThrow(NotFoundException);
      expect(usersService.remove).toHaveBeenCalledWith(999, currentUser);
    });

    it('should handle database errors during removal', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.remove.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.remove(1, currentUser))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle invalid ID parameter for removal', async () => {
      // Arrange
      const currentUser = mockUser;
      const invalidId = 'not-a-number' as any;

      // Act & Assert
      usersService.remove.mockRejectedValue(new Error('Invalid ID'));
      await expect(controller.remove(invalidId, currentUser)).rejects.toThrow();
    });

    it('should not return any content on successful deletion', async () => {
      // Arrange
      const currentUser = mockUser;
      usersService.remove.mockResolvedValue();

      // Act
      const result = await controller.remove(1, currentUser);

      // Assert
      expect(result).toBeUndefined(); // Should return void/undefined
      expect(usersService.remove).toHaveBeenCalledWith(1, currentUser);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Service timeout');
      timeoutError.name = 'TimeoutError';
      usersService.findAll.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Service timeout');
    });

    it('should handle concurrent update conflicts', async () => {
      // Arrange
      const currentUser = mockUser;
      const concurrencyError = new Error('Concurrent modification detected');
      usersService.update.mockRejectedValue(concurrencyError);

      // Act & Assert
      await expect(controller.update(1, mockUpdateUserDto, currentUser))
        .rejects.toThrow('Concurrent modification detected');
    });

    it('should handle malformed request data', async () => {
      // Arrange
      const malformedDto = {} as CreateUserDto; // Empty DTO
      usersService.create.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.create(malformedDto)).rejects.toThrow('Validation failed');
    });

    it('should handle null/undefined current user scenarios', async () => {
      // Arrange
      const nullUser = null as any;
      usersService.update.mockRejectedValue(new Error('Current user is required'));

      // Act & Assert
      await expect(controller.update(1, mockUpdateUserDto, nullUser))
        .rejects.toThrow('Current user is required');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});