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

import { DriverService } from '../services/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { UpdateDriverDto } from '../dto/update-driver.dto';
import { Driver } from '../entities/driver.entity';

@ApiTags('Driver')
@Controller('driver')
export class DriverController {
  private readonly logger = new Logger(DriverController.name);
  constructor(private readonly driverService: DriverService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Driver has been successfully created.',
    type: Driver,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['name must be a string', 'licenseNumber must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to create driver',
        error: 'Internal Server Error',
      },
    },
  })
  async create(@Body() createDriverDto: CreateDriverDto): Promise<Driver> {
    return this.driverService.create(createDriverDto);
  }


  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all drivers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all drivers.',
    type: [Driver],
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to fetch drivers',
        error: 'Internal Server Error',
      },
    },
  })
  async findAll(): Promise<Driver[]> {
    return this.driverService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a driver by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the driver',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver found.',
    type: Driver,
  })
  @ApiNotFoundResponse({
    description: 'Driver not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Driver with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid driver ID.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to fetch driver',
        error: 'Internal Server Error',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Driver> {
    return this.driverService.findOne(id);
  }


  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a driver by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the driver',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Driver has been successfully updated.',
    type: Driver,
  })
  @ApiNotFoundResponse({
    description: 'Driver not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Driver with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,

        message: ['name must be a string', 'licenseNumber must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to update driver',
        error: 'Internal Server Error',
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    return this.driverService.update(id, updateDriverDto);
  }



  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a driver by ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the driver',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Driver has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Driver not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Driver with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid driver ID.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to delete driver',
        error: 'Internal Server Error',
      },
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.driverService.remove(id);
  }


}
