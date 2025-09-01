import { Module } from '@nestjs/common';
import { RequestService } from './services/request.service';
import { RequestController } from './controllers/request.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), AuthModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule { }
