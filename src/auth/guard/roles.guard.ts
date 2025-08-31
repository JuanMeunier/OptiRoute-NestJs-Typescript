import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Obtenemos los roles requeridos desde el decorador @Roles()
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si no se especifican roles, la ruta es pública para este guard
        if (!requiredRoles) {
            return true;
        }

        // Obtenemos el usuario que fue adjuntado en el AuthGuard
        const { user } = context.switchToHttp().getRequest();

        // Verificamos si el rol del usuario está incluido en los roles requeridos
        return requiredRoles.some((role) => user.role?.includes(role));
    }
}