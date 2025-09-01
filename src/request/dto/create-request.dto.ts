import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';



export class CreateRequestDto {
    @ApiProperty({ example: 'Av. Corrientes 1234, Buenos Aires' })
    @IsString()
    originAddress: string;

    @ApiProperty({ example: 'Av. Rivadavia 4567, Buenos Aires' })
    @IsString()
    destinationAddress: string;


}