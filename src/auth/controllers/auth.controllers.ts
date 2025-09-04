import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "../services/auth.services";
import { LoginDto } from "../dto/login.dto";
import { RegisterUserDto } from "../dto/register.dto";
import { AuthResponseDto } from "../dto/authResponse.dto";
import { Throttle } from "@nestjs/throttler";


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post('register')
    @Throttle({ medium: { limit: 5, ttl: 10000 } })
    async register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }

    @Post('login')
    @Throttle({ short: { limit: 3, ttl: 1000 } })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }
}