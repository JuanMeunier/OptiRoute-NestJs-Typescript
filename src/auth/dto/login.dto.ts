import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({ example: 'nombre@gmail.com' })
    @IsString()
    email: string;


    @ApiProperty({ example: 'securePassword123' })
    @IsString()
    @MinLength(6)
    password: string;
}