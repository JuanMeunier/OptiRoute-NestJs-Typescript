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
import { CustomRedisModule } from './redis/redis.module';
import { CustomThrottlerModule } from './throttler/rate-limiter.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService disponible globalmente
      envFilePath: '.env', // opcional si usás otro archivo
    }),
    CustomRedisModule,
    CustomThrottlerModule,
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
