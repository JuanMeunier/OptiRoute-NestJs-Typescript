// src/request/dto/update-request.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { RequestStatus } from '../entities/request.entity';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
    @IsOptional()
    @IsEnum(RequestStatus)
    status?: RequestStatus;

    @IsOptional()
    @IsNumber()
    driverId?: number;

    @IsOptional()
    @IsNumber()
    userId?: number;
}