import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DriverController } from 'src/driver/controllers/driver.controller';
import { DriverService } from 'src/driver/services/driver.service';
import { Driver } from 'src/driver/entities/driver.entity';
import { CreateDriverDto } from 'src/driver/dto/create-driver.dto';
import { UpdateDriverDto } from 'src/driver/dto/update-driver.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

describe('DriverController', () => {
  let controller: DriverController;
  let service: DriverService;

  // Mock data para usar en los tests
  const mockDriver: Driver = {
    id: 1,
    name: 'John Doe',
    licenseNumber: 'LIC123456',
    vehicle: null,
  };

  const mockCurrentUser: Driver = {
    id: 2,
    name: 'Current User',
    licenseNumber: 'CUR789012',
    vehicle: null,
  };

  // Mock del service con todos los métodos
  const mockDriverService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Mock del JWT service
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [
        {
          provide: DriverService,
          useValue: mockDriverService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      // Deshabilitamos los guards para los tests
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DriverController>(DriverController);
    service = module.get<DriverService>(DriverService);
  });

  afterEach(() => {
    // Limpiar todos los mocks después de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDriverDto: CreateDriverDto = {
      name: 'John Doe',
      licenseNumber: 'LIC123456',
    };

    it('debería crear un driver exitosamente', async () => {
      // Arrange
      mockDriverService.create.mockResolvedValue(mockDriver);

      // Act
      const result = await controller.create(createDriverDto);

      // Assert
      expect(mockDriverService.create).toHaveBeenCalledWith(createDriverDto);
      expect(result).toEqual(mockDriver);
    });

    it('debería manejar error cuando el service falla', async () => {
      // Arrange
      mockDriverService.create.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.create(createDriverDto))
        .rejects.toThrow('Service error');
    });

    it('debería manejar error de validación', async () => {
      // Arrange
      const invalidDto = { name: '', licenseNumber: '' };
      mockDriverService.create.mockRejectedValue(
        new BadRequestException('Validation failed')
      );

      // Act & Assert
      await expect(controller.create(invalidDto as CreateDriverDto))
        .rejects.toThrow(BadRequestException);
    });

    it('debería manejar error interno del servidor', async () => {
      // Arrange
      mockDriverService.create.mockRejectedValue(
        new InternalServerErrorException('Database error')
      );

      // Act & Assert
      await expect(controller.create(createDriverDto))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('debería retornar lista de drivers', async () => {
      // Arrange
      const drivers = [mockDriver];
      mockDriverService.findAll.mockResolvedValue(drivers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockDriverService.findAll).toHaveBeenCalled();
      expect(result).toEqual(drivers);
    });

    it('debería retornar array vacío cuando no hay drivers', async () => {
      // Arrange
      mockDriverService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('debería manejar error del service', async () => {
      // Arrange
      mockDriverService.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Database error');
    });

    it('debería manejar error interno del servidor', async () => {
      // Arrange
      mockDriverService.findAll.mockRejectedValue(
        new InternalServerErrorException('Failed to fetch drivers')
      );

      // Act & Assert
      await expect(controller.findAll())
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    it('debería retornar un driver por ID', async () => {
      // Arrange
      mockDriverService.findOne.mockResolvedValue(mockDriver);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(mockDriverService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDriver);
    });

    it('debería manejar NotFoundException', async () => {
      // Arrange
      mockDriverService.findOne.mockRejectedValue(
        new NotFoundException('Driver with ID 999 not found')
      );

      // Act & Assert
      await expect(controller.findOne(999))
        .rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999))
        .rejects.toThrow('Driver with ID 999 not found');
    });

    it('debería manejar ID inválido', async () => {
      // Arrange
      mockDriverService.findOne.mockRejectedValue(
        new BadRequestException('Invalid ID format')
      );

      // Act & Assert
      await expect(controller.findOne(-1))
        .rejects.toThrow(BadRequestException);
    });

    it('debería manejar error interno del servidor', async () => {
      // Arrange
      mockDriverService.findOne.mockRejectedValue(
        new InternalServerErrorException('Failed to fetch driver')
      );

      // Act & Assert
      await expect(controller.findOne(1))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const updateDriverDto: UpdateDriverDto = {
      name: 'John Updated',
    };

    it('debería actualizar un driver exitosamente', async () => {
      // Arrange
      const updatedDriver = { ...mockDriver, name: 'John Updated' };
      mockDriverService.update.mockResolvedValue(updatedDriver);

      // Act
      const result = await controller.update(1, updateDriverDto, mockCurrentUser);

      // Assert
      expect(mockDriverService.update).toHaveBeenCalledWith(1, updateDriverDto, mockCurrentUser);
      expect(result).toEqual(updatedDriver);
    });

    it('debería manejar NotFoundException', async () => {
      // Arrange
      mockDriverService.update.mockRejectedValue(
        new NotFoundException('Driver with ID 999 not found')
      );

      // Act & Assert
      await expect(controller.update(999, updateDriverDto, mockCurrentUser))
        .rejects.toThrow(NotFoundException);
    });


    it('debería manejar error interno del servidor', async () => {
      // Arrange
      mockDriverService.update.mockRejectedValue(
        new InternalServerErrorException('Failed to update driver')
      );

      // Act & Assert
      await expect(controller.update(1, updateDriverDto, mockCurrentUser))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('debería pasar el usuario actual correctamente', async () => {
      // Arrange
      const updatedDriver = { ...mockDriver, name: 'John Updated' };
      mockDriverService.update.mockResolvedValue(updatedDriver);

      // Act
      await controller.update(1, updateDriverDto, mockCurrentUser);

      // Assert
      expect(mockDriverService.update).toHaveBeenCalledWith(
        1,
        updateDriverDto,
        mockCurrentUser
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar un driver exitosamente', async () => {
      // Arrange
      mockDriverService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(mockCurrentUser, 1);

      // Assert
      expect(mockDriverService.remove).toHaveBeenCalledWith(1, mockCurrentUser);
      expect(result).toBeUndefined();
    });

    it('debería manejar NotFoundException', async () => {
      // Arrange
      mockDriverService.remove.mockRejectedValue(
        new NotFoundException('Driver with ID 999 not found')
      );

      // Act & Assert
      await expect(controller.remove(mockCurrentUser, 999))
        .rejects.toThrow(NotFoundException);
    });

    it('debería manejar ID inválido', async () => {
      // Arrange
      mockDriverService.remove.mockRejectedValue(
        new BadRequestException('Invalid ID format')
      );

      // Act & Assert
      await expect(controller.remove(mockCurrentUser, -1))
        .rejects.toThrow(BadRequestException);
    });

    it('debería manejar error interno del servidor', async () => {
      // Arrange
      mockDriverService.remove.mockRejectedValue(
        new InternalServerErrorException('Failed to delete driver')
      );

      // Act & Assert
      await expect(controller.remove(mockCurrentUser, 1))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('debería pasar el usuario actual correctamente', async () => {
      // Arrange
      mockDriverService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockCurrentUser, 1);

      // Assert
      expect(mockDriverService.remove).toHaveBeenCalledWith(1, mockCurrentUser);
    });
  });

  describe('casos especiales de validación', () => {
    it('debería manejar datos vacíos en create', async () => {
      // Arrange
      const emptyDto: CreateDriverDto = {
        name: '',
        licenseNumber: '',
      };
      mockDriverService.create.mockRejectedValue(
        new BadRequestException('Name and license number are required')
      );

      // Act & Assert
      await expect(controller.create(emptyDto))
        .rejects.toThrow(BadRequestException);
    });

    it('debería manejar actualización con datos vacíos', async () => {
      // Arrange
      const emptyUpdateDto: UpdateDriverDto = {};
      mockDriverService.update.mockResolvedValue(mockDriver);

      // Act
      const result = await controller.update(1, emptyUpdateDto, mockCurrentUser);

      // Assert
      expect(mockDriverService.update).toHaveBeenCalledWith(1, emptyUpdateDto, mockCurrentUser);
      expect(result).toEqual(mockDriver);
    });

    it('debería manejar múltiples requests concurrentes', async () => {
      // Arrange
      mockDriverService.findAll.mockResolvedValue([mockDriver]);

      // Act
      const promises = [
        controller.findAll(),
        controller.findAll(),
        controller.findAll(),
      ];
      const results = await Promise.all(promises);

      // Assert
      expect(mockDriverService.findAll).toHaveBeenCalledTimes(3);
      results.forEach(result => {
        expect(result).toEqual([mockDriver]);
      });
    });
  });
});