import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehiclesService } from '../services/vehicles.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
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
import { Vehicle } from '../entities/vehicle.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle has been successfully created.',
    type: Vehicle,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['licensePlate must be a string', 'model must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'License plate already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'License plate already exists',
        error: 'Conflict',
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
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }




  @Get()
  @ApiOperation({ summary: 'Retrieve all vehicles' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles retrieved successfully.',
    type: [Vehicle],
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
  findAll() {
    return this.vehiclesService.findAll();
  }




  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Vehicle ID' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle retrieved successfully.',
    type: Vehicle,
  })
  @ApiNotFoundResponse({
    description: 'Vehicle not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vehicle with ID 1 not found',
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
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(+id);
  }




  @Get('license-plate/:licensePlate')
  @ApiOperation({ summary: 'Get a vehicle by license plate' })
  @ApiParam({ name: 'licensePlate', type: String, description: 'Vehicle license plate' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle retrieved successfully.',
    type: Vehicle,
  })
  @ApiNotFoundResponse({
    description: 'Vehicle not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vehicle with license plate ABC123 not found',
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
  findByLicensePlate(@Param('licensePlate') licensePlate: string) {
    return this.vehiclesService.findByLicensePlate(licensePlate);
  }




  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle by ID' })
  @ApiParam({
    name: 'id', type: Number, description: 'Vehicle ID to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully.',
    type: Vehicle,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['licensePlate must be a string', 'model must be a string'],
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Vehicle not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vehicle with ID 1 not found',
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
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(+id, updateVehicleDto);
  }




  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vehicle by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Vehicle ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle deleted successfully.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Vehicle deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Vehicle not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vehicle with ID 1 not found',
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
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(+id);
  }


}
