import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const token = request.headers.authorization?.split(" ")[1];

        if (!token) {
            return false; // No token provided
        }

        try {
            const payload = this.jwtService.verify(token);
            request.user = payload; // Attach user info to request
            return true; // Token is valid
        } catch (error) {
            return false; // Token is invalid or expired
        }
    }
}
