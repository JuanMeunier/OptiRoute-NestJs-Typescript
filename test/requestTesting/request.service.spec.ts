import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { RequestService } from 'src/request/services/request.service';
import { Request, RequestStatus } from 'src/request/entities/request.entity';
import { CreateRequestDto } from 'src/request/dto/create-request.dto';
import { UpdateRequestDto } from 'src/request/dto/update-request.dto';
import { User, UserRole } from 'src/users/entities/user.entity';

describe('RequestService', () => {
  let service: RequestService;
  let requestRepository: jest.Mocked<Repository<Request>>;
  let cacheManager: jest.Mocked<Cache>;

  // Datos de prueba
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'password',
    role: UserRole.CLIENT,
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

  const mockCreateRequestDto: CreateRequestDto = {
    originAddress: 'Av. Corrientes 1234, Buenos Aires',
    destinationAddress: 'Av. Rivadavia 4567, Buenos Aires'
  };

  const mockUpdateRequestDto: UpdateRequestDto = {
    status: RequestStatus.IN_PROGRESS,
    driverId: 2
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: getRepositoryToken(Request),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    requestRepository = module.get(getRepositoryToken(Request));
    cacheManager = module.get<Cache>(CACHE_MANAGER) as jest.Mocked<Cache>;
  });

  describe('create', () => {
    it('should create a request successfully', async () => {
      // Arrange
      const expectedRequest = { ...mockRequest, id: 2 };
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(expectedRequest);

      // Act
      const result = await service.create(mockCreateRequestDto);

      // Assert
      expect(requestRepository.create).toHaveBeenCalledWith(mockCreateRequestDto);
      expect(requestRepository.save).toHaveBeenCalledWith(mockRequest);
      expect(cacheManager.del).toHaveBeenCalledWith('requests:all');
      expect(cacheManager.del).toHaveBeenCalledWith('requests:pending');
      expect(result).toEqual(expectedRequest);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.create(mockCreateRequestDto)).rejects.toThrow('Failed to create request');
      expect(requestRepository.create).toHaveBeenCalledWith(mockCreateRequestDto);
    });

    it('should invalidate correct cache keys after successful creation', async () => {
      // Arrange
      const requestWithUserId = { ...mockRequest, userId: 5 };
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(requestWithUserId);

      // Act
      await service.create(mockCreateRequestDto);

      // Assert
      expect(cacheManager.del).toHaveBeenCalledWith('requests:all');
      expect(cacheManager.del).toHaveBeenCalledWith('requests:pending');
      expect(cacheManager.del).toHaveBeenCalledWith('requests:user:5');
    });
  });

  describe('findAll', () => {
    it('should return requests from cache if available', async () => {
      // Arrange
      const mockRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(mockRequests);

      // Act
      const result = await service.findAll();

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('requests:all');
      expect(requestRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(mockRequests);
    });

    it('should fetch requests from database when not in cache', async () => {
      // Arrange
      const mockRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockResolvedValue(mockRequests);

      // Act
      const result = await service.findAll();

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('requests:all');
      expect(requestRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'vehicle'],
        order: { createdAt: 'DESC' }
      });
      expect(cacheManager.set).toHaveBeenCalledWith('requests:all', mockRequests, 120);
      expect(result).toEqual(mockRequests);
    });

    it('should handle database errors when fetching requests', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockRejectedValue(new Error('Database connection error'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Failed to fetch requests');
    });
  });

  describe('findOne', () => {
    it('should return request from cache if available', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(mockRequest);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('requests:id:1');
      expect(requestRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockRequest);
    });

    it('should fetch request from database when not in cache', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      requestRepository.findOne.mockResolvedValue(mockRequest);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(requestRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'vehicle']
      });
      expect(cacheManager.set).toHaveBeenCalledWith('requests:id:1', mockRequest, 300);
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      requestRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(requestRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['user', 'vehicle']
      });
    });
  });

  describe('findPendingRequests', () => {
    it('should return pending requests from cache if available', async () => {
      // Arrange
      const pendingRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(pendingRequests);

      // Act
      const result = await service.findPendingRequests();

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('requests:pending');
      expect(requestRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(pendingRequests);
    });

    it('should fetch pending requests from database when not in cache', async () => {
      // Arrange
      const pendingRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockResolvedValue(pendingRequests);

      // Act
      const result = await service.findPendingRequests();

      // Assert
      expect(requestRepository.find).toHaveBeenCalledWith({
        where: { status: RequestStatus.PENDING },
        relations: ['user'],
        order: { createdAt: 'ASC' }
      });
      expect(cacheManager.set).toHaveBeenCalledWith('requests:pending', pendingRequests, 60);
      expect(result).toEqual(pendingRequests);
    });

    it('should handle database errors when fetching pending requests', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findPendingRequests()).rejects.toThrow('Failed to fetch pending requests');
    });
  });

  describe('findByUserId', () => {
    it('should return user requests from cache if available', async () => {
      // Arrange
      const userRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(userRequests);

      // Act
      const result = await service.findByUserId(1);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('requests:user:1');
      expect(requestRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(userRequests);
    });

    it('should fetch user requests from database when not in cache', async () => {
      // Arrange
      const userRequests = [mockRequest];
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockResolvedValue(userRequests);

      // Act
      const result = await service.findByUserId(1);

      // Assert
      expect(requestRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['vehicle'],
        order: { createdAt: 'DESC' }
      });
      expect(cacheManager.set).toHaveBeenCalledWith('requests:user:1', userRequests, 180);
      expect(result).toEqual(userRequests);
    });

    it('should handle database errors when fetching user requests', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      requestRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findByUserId(1)).rejects.toThrow('Failed to fetch user requests');
    });
  });

  describe('update', () => {
    it('should update request successfully when user is owner', async () => {
      // Arrange
      const currentUser = mockUser;
      const updatedRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);
      requestRepository.preload.mockResolvedValue(updatedRequest);
      requestRepository.save.mockResolvedValue(updatedRequest);

      // Act
      const result = await service.update(1, mockUpdateRequestDto, currentUser);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(requestRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...mockUpdateRequestDto,
      });
      expect(requestRepository.save).toHaveBeenCalledWith(updatedRequest);
      expect(result).toEqual(updatedRequest);
    });

    it('should allow staff/admin to update any request', async () => {
      // Arrange
      const staffUser = { ...mockUser, id: 2, role: UserRole.STAFF };
      const updatedRequest = { ...mockRequest, status: RequestStatus.IN_PROGRESS };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);
      requestRepository.preload.mockResolvedValue(updatedRequest);
      requestRepository.save.mockResolvedValue(updatedRequest);

      // Act
      const result = await service.update(1, mockUpdateRequestDto, staffUser);

      // Assert
      expect(requestRepository.save).toHaveBeenCalledWith(updatedRequest);
      expect(result).toEqual(updatedRequest);
    });
  });

  it('should throw ForbiddenException when user is not owner or staff/admin', async () => {
    // Arrange
    const otherUser = { ...mockUser, id: 3, role: UserRole.CLIENT };
    jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);

    // Act & Assert
    await expect(service.update(1, mockUpdateRequestDto, otherUser)).rejects.toThrow(ForbiddenException);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(requestRepository.preload).not.toHaveBeenCalled();
    expect(requestRepository.save).not.toHaveBeenCalled();
  }
  )
  describe('remove', () => {
    it('should remove request successfully when user is owner', async () => {
      // Arrange
      const currentUser = mockUser;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);
      requestRepository.remove.mockResolvedValue(mockRequest);
      // Act
      const result = await service.remove(1, currentUser);
      // Assert
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
      expect(cacheManager.del).toHaveBeenCalledWith('requests:all');
      expect(cacheManager.del).toHaveBeenCalledWith('requests:pending');
      expect(cacheManager.del).toHaveBeenCalledWith('requests:user:1');
      expect(result).toEqual(mockRequest);
    });
    it('should allow staff/admin to remove any request', async () => {
      // Arrange
      const staffUser = { ...mockUser, id: 2, role: UserRole.STAFF };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);
      requestRepository.remove.mockResolvedValue(mockRequest);
      // Act
      const result = await service.remove(1, staffUser);
      // Assert
      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockRequest);
    });
    it('should throw ForbiddenException when user is not owner or staff/admin', async () => {
      // Arrange
      const otherUser = { ...mockUser, id: 3, role: UserRole.CLIENT };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRequest);
      // Act & Assert
      await expect(service.remove(1, otherUser)).rejects.toThrow(ForbiddenException);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(requestRepository.remove).not.toHaveBeenCalled();
    })
  })


});
