import { Controller, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.services";
import { LoginDto } from "../dto/login.dto";
import { RegisterUserDto } from "../dto/register.dto";
import { AuthResponseDto } from "../dto/authResponse.dto";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
    @Post('register')
    async register(registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }

    @Post('login')
    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }
}