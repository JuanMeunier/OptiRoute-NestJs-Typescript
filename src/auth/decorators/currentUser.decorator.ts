import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
    (data: keyof User | undefined, context: ExecutionContext): User | any => {
        // Paso 1: Obtener el request del contexto HTTP
        const request = context.switchToHttp().getRequest();

        // Paso 2: Extraer el usuario del request (lo setea tu JwtAuthGuard)
        const user: User = request.user;

        // Paso 3: Validar que el usuario exista
        if (!user) {
            return null;
        }

        // Paso 4: Retornar propiedad específica o usuario completo
        return data ? user[data] : user;
    },
);