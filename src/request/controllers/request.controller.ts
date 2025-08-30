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
import { RequestService } from '../services/request.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { Request } from '../entities/request.entity';

@ApiTags('Requests')
@Controller('request')
export class RequestController {
  private readonly logger = new Logger(RequestController.name);
  constructor(private readonly requestService: RequestService) { }

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
  async create(@Body() createRequestDto: CreateRequestDto): Promise<Request> {
    this.logger.log('Received request to create a new request');
    return this.requestService.create(createRequestDto);
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
  ): Promise<Request> {
    this.logger.log(`Received request to update request with ID: ${id}`);
    return this.requestService.update(id, updateRequestDto);
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
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Received request to delete request with ID: ${id}`);
    return this.requestService.remove(id);
  }


}
