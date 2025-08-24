import { PartialType } from '@nestjs/mapped-types';
import { CreateGpDto } from './create-gp.dto';

export class UpdateGpDto extends PartialType(CreateGpDto) {}
