import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GpsModule } from './gps/gps.module';
import { DriverModule } from './driver/driver.module';
import { RequestModule } from './request/request.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatSocketModule } from './chat-socket/chat-socket.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService disponible globalmente
      envFilePath: '.env', // opcional si usás otro archivo
    }),
    CacheModule.registerAsync({
      isGlobal: true,
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


    UsersModule,
    AuthModule,
    DatabaseModule,
    VehiclesModule,
    GpsModule,
    DriverModule,
    RequestModule,
    ChatSocketModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
