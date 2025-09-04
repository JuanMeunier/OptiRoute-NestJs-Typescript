import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true, // 👈 queda global, no hace falta importarlo en todos lados
            useFactory: async () => ({
                store: await redisStore({
                    socket: {
                        host: 'localhost',
                        port: 6379,
                    },
                }),
                ttl: 10, // tiempo de vida en segundos
            }),
        }),
    ],
    exports: [CacheModule],
})
export class CustomRedisModule { }