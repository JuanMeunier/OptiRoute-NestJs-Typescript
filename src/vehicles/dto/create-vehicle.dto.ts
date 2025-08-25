import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
    @ApiProperty({ example: 'ABC123' })
    @IsString()
    licensePlate: string;

    @ApiProperty({ example: 'Ford' })
    @IsString()
    brand: string;

    @ApiProperty({ example: 'Transit' })
    @IsString()
    model: string;

    @ApiProperty({ example: 1000 })
    @IsNumber()
    @Min(0)
    capacity: number;
}