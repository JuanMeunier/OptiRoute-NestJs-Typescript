import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GPS } from '../entities/gps.entity';
import { CreateGpsDto } from '../dto/create-gp.dto';
import { UpdateGpDto } from '../dto/update-gps.dto';

@Injectable()
export class GpsService {
  private readonly logger = new Logger(GpsService.name);

  constructor(
    @InjectRepository(GPS)
    private readonly gpsRepository: Repository<GPS>,
  ) { }
  async create(createGpsDto: CreateGpsDto): Promise<GPS> {
    this.logger.log(`Creating new GPS entry with data: ${JSON.stringify(createGpsDto)}`);
    const gps = this.gpsRepository.create(createGpsDto);
    return this.gpsRepository.save(gps);
  }

  async findAll(): Promise<GPS[]> {
    this.logger.log('Retrieving all GPS entries');
    return this.gpsRepository.find();
  }

  async findOne(id: number): Promise<GPS> {
    this.logger.log(`Retrieving GPS entry with ID: ${id}`);
    const gps = await this.gpsRepository.findOne({ where: { id } });
    if (!gps) {
      throw new NotFoundException(`GPS with ID ${id} not found`);
    }
    return gps;
  }

  async update(id: number, updateGpsDto: UpdateGpDto): Promise<GPS> {
    this.logger.log(`Updating GPS entry with ID: ${id} using data: ${JSON.stringify(updateGpsDto)}`);
    const gps = await this.gpsRepository.preload({
      id: id,
      ...updateGpsDto,
    });
    if (!gps) {
      throw new NotFoundException(`GPS with ID ${id} not found`);
    }
    return this.gpsRepository.save(gps);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Removing GPS entry with ID: ${id}`);
    const gps = await this.findOne(id);
    await this.gpsRepository.remove(gps);
  }
}
