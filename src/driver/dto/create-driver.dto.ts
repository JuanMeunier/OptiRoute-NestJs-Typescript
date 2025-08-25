import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
    @ApiProperty({ example: 'Pedro Perez' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'LIC123456' })
    @IsString()
    licenseNumber: string;
}