import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) { }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle> {
    this.logger.log(`Finding vehicle with license plate: ${licensePlate}`);
    const vehicle = await this.vehicleRepository.findOne({ where: { licensePlate } });
    if (!vehicle) {
      this.logger.warn(`Vehicle with license plate ${licensePlate} not found`);
      throw new NotFoundException(`Vehicle with license plate ${licensePlate} not found`);
    }
    return vehicle;
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    this.logger.log(`Creating new vehicle with license plate: ${createVehicleDto.licensePlate}`);
    const { licensePlate } = createVehicleDto;

    const existingVehicle = await this.vehicleRepository.findOne({ where: { licensePlate } });
    if (existingVehicle) {
      this.logger.warn(`Attempt to create vehicle with existing license plate: ${licensePlate}`);
      throw new Error('License plate already exists');
    }
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);

  }

  async findAll(): Promise<Vehicle[]> {
    this.logger.log('Retrieving all vehicles');
    return this.vehicleRepository.find();
  }

  async findOne(id: number): Promise<Vehicle> {
    this.logger.log(`Finding vehicle with ID: ${id}`);
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      this.logger.warn(`Vehicle with ID ${id} not found`);
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }


  async update(id: number, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    this.logger.log(`Updating vehicle with ID: ${id}`);
    const vehicle = await this.vehicleRepository.preload({
      id: id,
      ...updateVehicleDto,
    });
    if (!vehicle) {
      this.logger.warn(`Vehicle with ID ${id} not found for update`);
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Removing vehicle with ID: ${id}`);
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      this.logger.warn(`Vehicle with ID ${id} not found for removal`);
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    await this.vehicleRepository.remove(vehicle);
  }

}
