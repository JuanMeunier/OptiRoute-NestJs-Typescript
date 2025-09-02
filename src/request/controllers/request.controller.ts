import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Logger,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { ChatSocketGateway } from '../../chat-socket/chat-socket.gateway';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { RequestService } from '../services/request.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { Request } from '../entities/request.entity';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';

@ApiTags('Requests')
@Roles(UserRole.CLIENT)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('request')
export class RequestController {
  private readonly logger = new Logger(RequestController.name);
  constructor(
    private readonly requestService: RequestService,
    private readonly chatGateway: ChatSocketGateway,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Request has been successfully created.',
    type: Request,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['originAddress should not be empty', 'destinationAddress should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async create(@Body() createRequestDto: CreateRequestDto, @CurrentUser() user: any): Promise<Request> {
    this.logger.log('Received request to create a new request');
    // Asociar el usuario actual al request
    const requestWithUser = {
      ...createRequestDto,
      user: user.userId, // o user.id según tu entidad
    };
    return this.requestService.create(requestWithUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all requests.',
    type: [Request],
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async findAll(): Promise<Request[]> {
    this.logger.log('Received request to retrieve all requests');
    return this.requestService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The request with the specified ID.',
    type: Request,
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID format.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Request not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Request with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Request> {
    this.logger.log(`Received request to retrieve request with ID: ${id}`);
    return this.requestService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The updated request.',
    type: Request,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or ID format.',
    schema: {
      example: {
        statusCode: 400,
        message: ['originAddress should not be empty', 'destinationAddress should not be empty'],
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Request not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Request with ID 1 not found',
        error: 'Not Found',
      },
    },
  })

  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestDto: UpdateRequestDto,
    @CurrentUser() driver: any,
  ): Promise<Request> {
    // Si el status cambia a "in_progress", asignar driver
    if (updateRequestDto.status === 'in_progress') {
      updateRequestDto.driverId = driver.userId; // ⬅️ Asignar driver
    }

    const updatedRequest = await this.requestService.update(id, updateRequestDto, driver);

    // Crear chat automáticamente
    if (updateRequestDto.status === 'in_progress') {
      await this.chatGateway.createChatForRequest(
        id,
        updatedRequest.userId, // Cliente
        driver.userId          // Driver
      );
    }

    return updatedRequest;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a request by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Request ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Request has been successfully deleted.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID format.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Request not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Request with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    this.logger.log(`Received request to delete request with ID: ${id}`);
    return this.requestService.remove(id, user);
  }


}
