import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, UseGuards } from '@nestjs/common';
import { GpsService } from '../services/gps.service';
import { CreateGpsDto } from '../dto/create-gp.dto';
import { UpdateGpDto } from '../dto/update-gps.dto';
import { GPS } from '../entities/gps.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBadRequestResponse, ApiNotFoundResponse, ApiConflictResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('GPS')
@Roles(UserRole.ADMIN) // ⬅️ Para toda la clase
@UseGuards(JwtAuthGuard, RolesGuard) // ⬅️ Para toda la clase
@Controller('gps')
export class GpsController {
  private readonly logger = new Logger(GpsController.name);
  constructor(private readonly gpsService: GpsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new GPS entry' })
  @ApiResponse({
    status: 201,
    description: 'GPS entry has been successfully created.',
    type: GPS,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['latitude must be a number', 'longitude must be a number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict occurred while creating GPS entry.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Conflict occurred while creating GPS entry',
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
  create(@Body() createGpsDto: CreateGpsDto) {
    this.logger.log(`Received request to create GPS entry: ${JSON.stringify(createGpsDto)}`);
    return this.gpsService.create(createGpsDto);
  }





  @Get()
  @ApiOperation({ summary: 'Retrieve all GPS entries' })
  @ApiResponse({
    status: 200,
    description: 'List of all GPS entries.',
    type: [GPS],
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
    this.logger.log('Received request to fetch all GPS entries');
    return this.gpsService.findAll();
  }




  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a GPS entry by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the GPS entry to retrieve',
    example: 1,
    type: 'integer',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'The GPS entry with the specified ID.',
    type: GPS,
  })
  @ApiNotFoundResponse({
    description: 'GPS entry not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'GPS with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID parameter.',
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
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  findOne(@Param('id') id: string) {
    this.logger.log(`Received request to fetch GPS entry with ID: ${id}`);
    return this.gpsService.findOne(+id);
  }





  @Patch(':id')
  @ApiOperation({ summary: 'Update a GPS entry by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the GPS entry to update',
    example: 1,
    type: 'integer',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'The updated GPS entry.',
    type: GPS,
  })
  @ApiNotFoundResponse({
    description: 'GPS entry not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'GPS with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or ID parameter.',
    schema: {
      example: {
        statusCode: 400,
        message: ['latitude must be a number', 'longitude must be a number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict occurred while updating GPS entry.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Conflict occurred while updating GPS entry',
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
  update(@Param('id') id: string, @Body() updateGpsDto: UpdateGpDto) {
    this.logger.log(`Received request to update GPS entry with ID: ${id}, Data: ${JSON.stringify(updateGpsDto)}`);
    return this.gpsService.update(+id, updateGpsDto);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete a GPS entry by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the GPS entry to delete',
    example: 1,
    type: 'integer',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'GPS entry successfully deleted.',
    schema: {
      example: {
        statusCode: 200,
        message: 'GPS entry successfully deleted',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'GPS entry not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'GPS with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid ID parameter.',
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
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    },
  })
  remove(@Param('id') id: string) {
    this.logger.log(`Received request to delete GPS entry with ID: ${id}`);
    return this.gpsService.remove(+id);
  }
}
