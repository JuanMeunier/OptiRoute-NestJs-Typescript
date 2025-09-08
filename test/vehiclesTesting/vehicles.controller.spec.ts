import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehiclesController } from 'src/vehicles/controllers/vehicles.controller';
import { VehiclesService } from 'src/vehicles/services/vehicles.service';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { CreateVehicleDto } from 'src/vehicles/dto/create-vehicle.dto';
import { UpdateVehicleDto } from 'src/vehicles/dto/update-vehicle.dto';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

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

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByLicensePlate: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
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
      mockVehiclesService.create.mockResolvedValue(mockVehicle);

      const result = await controller.create(createVehicleDto);

      expect(service.create).toHaveBeenCalledWith(createVehicleDto);
      expect(result).toEqual(mockVehicle);
    });

    it('should throw error when service fails', async () => {
      mockVehiclesService.create.mockRejectedValue(new Error('License plate already exists'));

      await expect(controller.create(createVehicleDto)).rejects.toThrow('License plate already exists');
      expect(service.create).toHaveBeenCalledWith(createVehicleDto);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      const vehicles = [mockVehicle];
      mockVehiclesService.findAll.mockResolvedValue(vehicles);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(vehicles);
    });

    it('should return empty array when no vehicles exist', async () => {
      mockVehiclesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockVehiclesService.findOne.mockRejectedValue(new NotFoundException('Vehicle with ID 999 not found'));

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('findByLicensePlate', () => {
    it('should return a vehicle by license plate', async () => {
      mockVehiclesService.findByLicensePlate.mockResolvedValue(mockVehicle);

      const result = await controller.findByLicensePlate('ABC123');

      expect(service.findByLicensePlate).toHaveBeenCalledWith('ABC123');
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when vehicle not found by license plate', async () => {
      mockVehiclesService.findByLicensePlate.mockRejectedValue(
        new NotFoundException('Vehicle with license plate XYZ999 not found')
      );

      await expect(controller.findByLicensePlate('XYZ999')).rejects.toThrow(NotFoundException);
      expect(service.findByLicensePlate).toHaveBeenCalledWith('XYZ999');
    });
  });

  describe('update', () => {
    const updateVehicleDto: UpdateVehicleDto = {
      brand: 'Toyota',
      model: 'Hiace',
    };

    it('should update a vehicle successfully', async () => {
      const updatedVehicle = { ...mockVehicle, ...updateVehicleDto };
      mockVehiclesService.update.mockResolvedValue(updatedVehicle);

      const result = await controller.update('1', updateVehicleDto);

      expect(service.update).toHaveBeenCalledWith(1, updateVehicleDto);
      expect(result).toEqual(updatedVehicle);
    });

    it('should throw NotFoundException when vehicle not found for update', async () => {
      mockVehiclesService.update.mockRejectedValue(
        new NotFoundException('Vehicle with ID 999 not found')
      );

      await expect(controller.update('999', updateVehicleDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(999, updateVehicleDto);
    });
  });

  describe('remove', () => {
    it('should remove a vehicle successfully', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when vehicle not found for removal', async () => {
      mockVehiclesService.remove.mockRejectedValue(
        new NotFoundException('Vehicle with ID 999 not found')
      );

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});