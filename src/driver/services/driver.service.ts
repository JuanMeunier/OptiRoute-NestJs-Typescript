import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { Driver } from '../entities/driver.entity';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) { }

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    this.logger.log(`Creating new driver with name: ${createDriverDto.name}`);
    const driver = this.driverRepository.create(createDriverDto);
    if (!driver) {
      this.logger.error('Failed to create driver entity');
      throw new Error('Failed to create driver');
    }

    return this.driverRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    this.logger.log('Fetching all drivers');
    return this.driverRepository.find();
  }

  async findOne(id: number): Promise<Driver> {
    this.logger.log(`Fetching driver with ID: ${id}`);
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) {
      this.logger.warn(`Driver with ID ${id} not found`);
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto, CurrentUser: Driver): Promise<Driver> {
    this.logger.log(`Updating driver with ID: ${id}`);
    const driver = await this.driverRepository.preload({
      id,
      ...updateDriverDto,
    });

    if (!driver) {
      this.logger.warn(`Driver with ID ${id} not found for update`);
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return this.driverRepository.save(driver);
  }

  async remove(id: number, CurrentUser: Driver): Promise<void> {
    this.logger.log(`Removing driver with ID: ${id}`);
    const driver = await this.findOne(id);
    await this.driverRepository.remove(driver);
  }


}
