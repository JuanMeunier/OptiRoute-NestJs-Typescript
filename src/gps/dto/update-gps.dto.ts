import { PartialType } from '@nestjs/mapped-types';
import { CreateGpsDto } from './create-gp.dto';

export class UpdateGpDto extends PartialType(CreateGpsDto) { }
