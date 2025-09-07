import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { RequestController } from 'src/request/controllers/request.controller';
import { RequestService } from 'src/request/services/request.service';
import { ChatSocketGateway } from 'src/chat-socket/chat-socket.gateway';
import { CreateRequestDto } from 'src/request/dto/create-request.dto';
import { UpdateRequestDto } from 'src/request/dto/update-request.dto';
import { Request, RequestStatus } from 'src/request/entities/request.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

describe('RequestController', () => {
  let controller: RequestController;
  let requestService: jest.Mocked<RequestService>;
  let chatGateway: jest.Mocked<ChatSocketGateway>;

  // Datos de prueba
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.CLIENT,
    requests: []
  };

  const mockDriver: User = {
    id: 2,
    name: 'Test Driver',
    email: 'driver@example.com',
    password: 'hashedPassword456',
    role: UserRole.STAFF,
    requests: []
  };

  const mockRequest: Request = {
    id: 1,
    originAddress: 'Av. Corrientes 1234, Buenos Aires',
    destinationAddress: 'Av. Rivadavia 4567, Buenos Aires',
    createdAt: new Date('2024-01-01'),
    status: RequestStatus.PENDING,
    driverId: null,
    userId: 1,
    user: mockUser,
    vehicle: null
  };

  const mockRequests: Request[] = [
    mockRequest,
    {
      id: 2,
      originAddress: 'Av. Santa Fe 9876, Buenos Aires',
      destinationAddress: 'Av. Cabildo 5432, Buenos Aires',
      createdAt: new Date('2024-01-02'),
      status: RequestStatus.IN_PROGRESS,
      driverId: 2,
      userId: 1,
      user: mockUser,
      vehicle: null as any // TypeScript fix para nullable relation
    }
  ];

  const mockCreateRequestDto: CreateRequestDto = {
    originAddress: 'Av. Corrientes 1234, Buenos Aires',
    destinationAddress: 'Av. Rivadavia 4567, Buenos Aires'
  };

  const mockUpdateRequestDto: UpdateRequestDto = {
    status: RequestStatus.IN_PROGRESS
  };

  beforeEach(async () => {
    const mockRequestService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockChatGateway = {
      createChatForRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [
        {
          provide: RequestService,
          useValue: mockRequestService,
        },
        {
          provide: ChatSocketGateway,
          useValue: mockChatGateway,
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

    controller = module.get<RequestController>(RequestController);
    requestService = module.get<RequestService>(RequestService) as jest.Mocked<RequestService>;
    chatGateway = module.get<ChatSocketGateway>(ChatSocketGateway) as jest.Mocked<ChatSocketGateway>;
  });

  describe('create', () => {
    it('should create a request successfully', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      const expectedRequestData = { ...mockCreateRequestDto, user: 1 };
      const expectedRequest = { ...mockRequest, id: 2 };
      requestService.create.mockResolvedValue(expectedRequest);

      // Act
      const result = await controller.create(mockCreateRequestDto, currentUser);

      // Assert
      expect(requestService.create).toHaveBeenCalledWith(expectedRequestData);
      expect(result).toEqual(expectedRequest);
    });

    it('should handle user authentication data correctly', async () => {
      // Arrange
      const currentUser = { userId: 5, role: UserRole.CLIENT, email: 'test@example.com' };
      const expectedRequestData = { ...mockCreateRequestDto, user: 5 };
      requestService.create.mockResolvedValue(mockRequest);

      // Act
      await controller.create(mockCreateRequestDto, currentUser);

      // Assert
      expect(requestService.create).toHaveBeenCalledWith(expectedRequestData);
    });

    it('should handle service errors during creation', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      requestService.create.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.create(mockCreateRequestDto, currentUser))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors for create DTO', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      const invalidDto: CreateRequestDto = {
        originAddress: '',
        destinationAddress: ''
      };
      requestService.create.mockRejectedValue(new Error('Validation failed'));

      // Act & Assert
      await expect(controller.create(invalidDto, currentUser))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('findAll', () => {
    it('should return all requests successfully', async () => {
      // Arrange
      requestService.findAll.mockResolvedValue(mockRequests);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(requestService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no requests exist', async () => {
      // Arrange
      requestService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(requestService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle service errors when fetching all requests', async () => {
      // Arrange
      requestService.findAll.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Database connection failed');
    });
  });

  describe('findOne', () => {
    it('should return a request by id successfully', async () => {
      // Arrange
      requestService.findOne.mockResolvedValue(mockRequest);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(requestService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      requestService.findOne.mockRejectedValue(new NotFoundException('Request with ID 999 not found'));

      // Act & Assert
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(requestService.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle invalid ID parameter', async () => {
      // Arrange
      const invalidId = 'not-a-number' as any;
      // Nota: ParseIntPipe manejaría esto en runtime

      // Act & Assert
      requestService.findOne.mockRejectedValue(new Error('Invalid ID'));
      await expect(controller.findOne(invalidId)).rejects.toThrow();
    });

    it('should handle service errors when fetching request', async () => {
      // Arrange
      requestService.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.findOne(1)).rejects.toThrow('Database connection failed');
    });
  });

  describe('update', () => {
    it('should update request successfully without status change', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      const updateDto = { originAddress: 'New Address' };
      const updatedRequest = { ...mockRequest, originAddress: 'New Address' };
      requestService.update.mockResolvedValue(updatedRequest);

      // Act
      const result = await controller.update(1, updateDto, currentUser);

      // Assert
      expect(requestService.update).toHaveBeenCalledWith(1, updateDto, currentUser);
      expect(result).toEqual(updatedRequest);
      expect(chatGateway.createChatForRequest).not.toHaveBeenCalled();
    });

    it('should update request to in_progress and create chat', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      const updateDto = { status: RequestStatus.IN_PROGRESS };
      const expectedUpdateDto = { status: RequestStatus.IN_PROGRESS, driverId: 2 };
      const updatedRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS, driverId: 2, userId: 1 };

      requestService.update.mockResolvedValue(updatedRequest);
      chatGateway.createChatForRequest.mockResolvedValue();

      // Act
      const result = await controller.update(1, updateDto, currentUser);

      // Assert
      expect(requestService.update).toHaveBeenCalledWith(1, expectedUpdateDto, currentUser);
      expect(chatGateway.createChatForRequest).toHaveBeenCalledWith(1, 1, 2); // requestId, clientId, driverId
      expect(result).toEqual(updatedRequest);
    });

    it('should handle driver assignment correctly', async () => {
      // Arrange
      const driverUser = { userId: 5, role: UserRole.STAFF };
      const updateDto = { status: RequestStatus.IN_PROGRESS };
      const expectedUpdateDto = { status: RequestStatus.IN_PROGRESS, driverId: 5 };
      const updatedRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS, driverId: 5 };

      requestService.update.mockResolvedValue(updatedRequest);
      chatGateway.createChatForRequest.mockResolvedValue();

      // Act
      await controller.update(1, updateDto, driverUser);

      // Assert
      expect(requestService.update).toHaveBeenCalledWith(1, expectedUpdateDto, driverUser);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      requestService.update.mockRejectedValue(new NotFoundException('Request with ID 999 not found'));

      // Act & Assert
      await expect(controller.update(999, mockUpdateRequestDto, currentUser))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot update request', async () => {
      // Arrange
      const currentUser = { userId: 3, role: UserRole.CLIENT };
      requestService.update.mockRejectedValue(new ForbiddenException('You can only update your own requests'));

      // Act & Assert
      await expect(controller.update(1, mockUpdateRequestDto, currentUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should handle chat creation errors gracefully', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      const updateDto = { status: RequestStatus.IN_PROGRESS };
      const expectedUpdateDto = { status: RequestStatus.IN_PROGRESS, driverId: 2 };
      const updatedRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS, driverId: 2, userId: 1 };

      requestService.update.mockResolvedValue(updatedRequest);
      chatGateway.createChatForRequest.mockRejectedValue(new Error('Chat creation failed'));

      // Act & Assert - El controller debería manejar el error del chat sin afectar el update
      await expect(controller.update(1, updateDto, currentUser)).rejects.toThrow('Chat creation failed');
    });

    it('should handle service errors during update', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      requestService.update.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.update(1, mockUpdateRequestDto, currentUser))
        .rejects.toThrow('Database connection failed');
    });

    it('should not create chat for status changes other than in_progress', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.STAFF };
      const updateDto = { status: RequestStatus.COMPLETED };
      const updatedRequest = { ...mockRequest, status: RequestStatus.COMPLETED };

      requestService.update.mockResolvedValue(updatedRequest);

      // Act
      await controller.update(1, updateDto, currentUser);

      // Assert
      expect(chatGateway.createChatForRequest).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove request successfully', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      requestService.remove.mockResolvedValue();

      // Act
      await controller.remove(1, currentUser);

      // Assert
      expect(requestService.remove).toHaveBeenCalledWith(1, currentUser);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      requestService.remove.mockRejectedValue(new NotFoundException('Request with ID 999 not found'));

      // Act & Assert
      await expect(controller.remove(999, currentUser))
        .rejects.toThrow(NotFoundException);
      expect(requestService.remove).toHaveBeenCalledWith(999, currentUser);
    });

    it('should throw ForbiddenException when user cannot delete request', async () => {
      // Arrange
      const currentUser = { userId: 2, role: UserRole.CLIENT };
      requestService.remove.mockRejectedValue(new ForbiddenException('You can only delete your own requests'));

      // Act & Assert
      await expect(controller.remove(1, currentUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should handle service errors during removal', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      requestService.remove.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.remove(1, currentUser))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle invalid ID parameter for removal', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      const invalidId = 'not-a-number' as any;

      // Act & Assert
      requestService.remove.mockRejectedValue(new Error('Invalid ID'));
      await expect(controller.remove(invalidId, currentUser)).rejects.toThrow();
    });

    it('should not return any content on successful deletion', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      requestService.remove.mockResolvedValue();

      // Act
      const result = await controller.remove(1, currentUser);

      // Assert
      expect(result).toBeUndefined(); // Should return void/undefined
      expect(requestService.remove).toHaveBeenCalledWith(1, currentUser);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const currentUser1 = { userId: 1, role: UserRole.CLIENT };
      const currentUser2 = { userId: 2, role: UserRole.CLIENT };

      requestService.create.mockResolvedValueOnce({ ...mockRequest, id: 10 });
      requestService.create.mockResolvedValueOnce({ ...mockRequest, id: 11 });

      // Act
      const promises = [
        controller.create(mockCreateRequestDto, currentUser1),
        controller.create(mockCreateRequestDto, currentUser2)
      ];
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(10);
      expect(results[1].id).toBe(11);
    });

    it('should handle malformed user data', async () => {
      // Arrange
      const malformedUser = { userId: null, role: null } as any;
      requestService.create.mockRejectedValue(new Error('Invalid user data'));

      // Act & Assert
      await expect(controller.create(mockCreateRequestDto, malformedUser))
        .rejects.toThrow('Invalid user data');
    });

    it('should handle service timeout scenarios', async () => {
      // Arrange
      const timeoutError = new Error('Service timeout');
      timeoutError.name = 'TimeoutError';
      requestService.findAll.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Service timeout');
    });

    it('should handle null/undefined request data scenarios', async () => {
      // Arrange
      const currentUser = { userId: 1, role: UserRole.CLIENT };
      const nullDto = null as any;
      requestService.create.mockRejectedValue(new Error('Request data is required'));

      // Act & Assert
      await expect(controller.create(nullDto, currentUser))
        .rejects.toThrow('Request data is required');
    });

    it('should validate business logic for driver assignment', async () => {
      // Arrange - Cliente intenta asignarse como driver
      const clientUser = { userId: 1, role: UserRole.CLIENT };
      const updateDto = { status: RequestStatus.IN_PROGRESS, driverId: 1 };
      requestService.update.mockRejectedValue(new ForbiddenException('Clients cannot assign themselves as drivers'));

      // Act & Assert
      await expect(controller.update(1, updateDto, clientUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});