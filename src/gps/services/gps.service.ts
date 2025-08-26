import { Injectable } from '@nestjs/common';
import { CreateGpsDto } from '../dto/create-gp.dto';
import { UpdateGpDto } from '../dto/update-gps.dto';

@Injectable()
export class GpsService {
  create(createGpDto: CreateGpsDto) {
    return 'This action adds a new gp';
  }

  findAll() {
    return `This action returns all gps`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gp`;
  }

  update(id: number, updateGpDto: UpdateGpDto) {
    return `This action updates a #${id} gp`;
  }

  remove(id: number) {
    return `This action removes a #${id} gp`;
  }
}
