import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGpsDto {
    @ApiProperty({ example: -34.6037 })
    @IsNumber()
    latitude: number;

    @ApiProperty({ example: -58.3816 })
    @IsNumber()
    longitude: number;
}