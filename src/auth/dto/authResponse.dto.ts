import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";


export class AuthResponseDto {
    @ApiProperty({ type: User })
    user: User;

    @ApiProperty({ example: 'jwt.token.here' })
    token: string;
}