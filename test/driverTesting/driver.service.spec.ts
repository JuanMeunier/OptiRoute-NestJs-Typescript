import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DriverService } from 'src/driver/services/driver.service';
import { Driver } from 'src/driver/entities/driver.entity';
import { CreateDriverDto } from 'src/driver/dto/create-driver.dto';
import { UpdateDriverDto } from 'src/driver/dto/update-driver.dto';

describe('DriverService', () => {
  let service: DriverService;
  let repository: Repository<Driver>;

  // Mock data que usaremos en los tests
  const mockDriver: Driver = {
    id: 1,
    name: 'John Doe',
    licenseNumber: 'LIC123456',
    vehicle: null,
  };

  const mockCurrentUser: Driver = {
    id: 1,
    name: 'Current User',
    licenseNumber: 'CUR789',
    vehicle: null,
  };

  // Mock del repositorio con todos los métodos que necesitamos
  const mockDriverRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
        },
      ],
    }).compile();

    service = module.get<DriverService>(DriverService);
    repository = module.get<Repository<Driver>>(getRepositoryToken(Driver));
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDriverDto: CreateDriverDto = {
      name: 'John Doe',
      licenseNumber: 'LIC123456',
    };

    it('debería crear un driver exitosamente', async () => {
      // Arrange - preparar los datos
      mockDriverRepository.create.mockReturnValue(mockDriver);
      mockDriverRepository.save.mockResolvedValue(mockDriver);

      // Act - ejecutar el método
      const result = await service.create(createDriverDto);

      // Assert - verificar resultados
      expect(mockDriverRepository.create).toHaveBeenCalledWith(createDriverDto);
      expect(mockDriverRepository.save).toHaveBeenCalledWith(mockDriver);
      expect(result).toEqual(mockDriver);
    });

    it('debería lanzar error cuando create retorna null', async () => {
      // Arrange
      mockDriverRepository.create.mockReturnValue(null);

      // Act & Assert
      await expect(service.create(createDriverDto)).rejects.toThrow('Failed to create driver');
      expect(mockDriverRepository.create).toHaveBeenCalledWith(createDriverDto);
    });

    it('debería manejar errores de la base de datos en save', async () => {
      // Arrange
      mockDriverRepository.create.mockReturnValue(mockDriver);
      mockDriverRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.create(createDriverDto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('debería retornar array de drivers', async () => {
      // Arrange
      const drivers = [mockDriver];
      mockDriverRepository.find.mockResolvedValue(drivers);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockDriverRepository.find).toHaveBeenCalled();
      expect(result).toEqual(drivers);
    });

    it('debería retornar array vacío cuando no hay drivers', async () => {
      // Arrange
      mockDriverRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('debería manejar errores de base de datos', async () => {
      // Arrange
      mockDriverRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('debería retornar un driver por ID', async () => {
      // Arrange
      mockDriverRepository.findOne.mockResolvedValue(mockDriver);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(mockDriverRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDriver);
    });

    it('debería lanzar NotFoundException cuando driver no existe', async () => {
      // Arrange
      mockDriverRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Driver with ID 999 not found');
    });

    it('debería manejar errores de base de datos', async () => {
      // Arrange
      mockDriverRepository.findOne.mockRejectedValue(new Error('Connection timeout'));

      // Act & Assert
      await expect(service.findOne(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('update', () => {
    const updateDriverDto: UpdateDriverDto = {
      name: 'John Updated',
    };

    it('debería actualizar un driver exitosamente', async () => {
      // Arrange
      const updatedDriver = { ...mockDriver, name: 'John Updated' };
      mockDriverRepository.preload.mockResolvedValue(updatedDriver);
      mockDriverRepository.save.mockResolvedValue(updatedDriver);

      // Act
      const result = await service.update(1, updateDriverDto, mockCurrentUser);

      // Assert
      expect(mockDriverRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...updateDriverDto,
      });
      expect(mockDriverRepository.save).toHaveBeenCalledWith(updatedDriver);
      expect(result).toEqual(updatedDriver);
    });

    it('debería lanzar NotFoundException cuando driver no existe', async () => {
      // Arrange
      mockDriverRepository.preload.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateDriverDto, mockCurrentUser))
        .rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDriverDto, mockCurrentUser))
        .rejects.toThrow('Driver with ID 999 not found');
    });

    it('debería manejar errores de preload', async () => {
      // Arrange
      mockDriverRepository.preload.mockRejectedValue(new Error('Preload failed'));

      // Act & Assert
      await expect(service.update(1, updateDriverDto, mockCurrentUser))
        .rejects.toThrow('Preload failed');
    });

    it('debería manejar errores de save', async () => {
      // Arrange
      const updatedDriver = { ...mockDriver, name: 'John Updated' };
      mockDriverRepository.preload.mockResolvedValue(updatedDriver);
      mockDriverRepository.save.mockRejectedValue(new Error('Save failed'));

      // Act & Assert
      await expect(service.update(1, updateDriverDto, mockCurrentUser))
        .rejects.toThrow('Save failed');
    });
  });

  describe('remove', () => {
    it('debería eliminar un driver exitosamente', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDriver);
      mockDriverRepository.remove.mockResolvedValue(mockDriver);

      // Act
      await service.remove(1, mockCurrentUser);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(mockDriverRepository.remove).toHaveBeenCalledWith(mockDriver);
    });

    it('debería lanzar NotFoundException cuando driver no existe', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockRejectedValue(
        new NotFoundException('Driver with ID 999 not found')
      );

      // Act & Assert
      await expect(service.remove(999, mockCurrentUser))
        .rejects.toThrow(NotFoundException);
      await expect(service.remove(999, mockCurrentUser))
        .rejects.toThrow('Driver with ID 999 not found');
    });

    it('debería manejar errores durante remove', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDriver);
      mockDriverRepository.remove.mockRejectedValue(new Error('Remove failed'));

      // Act & Assert
      await expect(service.remove(1, mockCurrentUser))
        .rejects.toThrow('Remove failed');
    });
  });
});