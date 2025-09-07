import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from 'src/vehicles/services/vehicles.service';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { CreateVehicleDto } from 'src/vehicles/dto/create-vehicle.dto';
import { UpdateVehicleDto } from 'src/vehicles/dto/update-vehicle.dto';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: Repository<Vehicle>;

  const mockVehicle: Vehicle = {
    id: 1,
    licensePlate: 'ABC123',
    brand: 'Ford',
    model: 'Transit',
    capacity: 1000,
    gps: null,
    drivers: [],
    requests: [],
  };

  const mockRepository = {
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
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repository = module.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createVehicleDto: CreateVehicleDto = {
      licensePlate: 'ABC123',
      brand: 'Ford',
      model: 'Transit',
      capacity: 1000,
    };

    it('should create a vehicle successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockVehicle);
      mockRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(createVehicleDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { licensePlate: 'ABC123' } });
      expect(mockRepository.create).toHaveBeenCalledWith(createVehicleDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockVehicle);
      expect(result).toEqual(mockVehicle);
    });

    it('should throw error when license plate already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);

      await expect(service.create(createVehicleDto)).rejects.toThrow('License plate already exists');
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { licensePlate: 'ABC123' } });
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      const vehicles = [mockVehicle];
      mockRepository.find.mockResolvedValue(vehicles);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(vehicles);
    });

    it('should return empty array when no vehicles exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findByLicensePlate', () => {
    it('should return a vehicle by license plate', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findByLicensePlate('ABC123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { licensePlate: 'ABC123' } });
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found by license plate', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByLicensePlate('XYZ999')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { licensePlate: 'XYZ999' } });
    });
  });

  describe('update', () => {
    const updateVehicleDto: UpdateVehicleDto = {
      brand: 'Toyota',
      model: 'Hiace',
    };

    it('should update a vehicle successfully', async () => {
      const updatedVehicle = { ...mockVehicle, ...updateVehicleDto };
      mockRepository.preload.mockResolvedValue(updatedVehicle);
      mockRepository.save.mockResolvedValue(updatedVehicle);

      const result = await service.update(1, updateVehicleDto);

      expect(mockRepository.preload).toHaveBeenCalledWith({ id: 1, ...updateVehicleDto });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedVehicle);
      expect(result).toEqual(updatedVehicle);
    });

    it('should throw NotFoundException when vehicle not found for update', async () => {
      mockRepository.preload.mockResolvedValue(null);

      await expect(service.update(999, updateVehicleDto)).rejects.toThrow(NotFoundException);
      expect(mockRepository.preload).toHaveBeenCalledWith({ id: 999, ...updateVehicleDto });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a vehicle successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);
      mockRepository.remove.mockResolvedValue(mockVehicle);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found for removal', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});