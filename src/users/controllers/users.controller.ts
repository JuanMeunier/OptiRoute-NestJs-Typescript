import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully created.',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be longer than or equal to 6 characters'],
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`POST /users - Creating user with email: ${createUserDto.email}`);

    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.log(`POST /users - User created with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`POST /users - Error: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.ADMIN) // ⬅️ Para toda la clase
  @UseGuards(JwtAuthGuard, RolesGuard) // ⬅️ Para toda la clase
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all users.',
    type: [User],
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
  })
  async findAll(): Promise<User[]> {
    this.logger.log('GET /users - Fetching all users');

    try {
      const users = await this.usersService.findAll();
      this.logger.log(`GET /users - Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`GET /users - Error: ${error.message}`);
      throw error;
    }
  }


  @Get(':id')
  @Roles(UserRole.ADMIN) // ⬅️ Para toda la clase
  @UseGuards(JwtAuthGuard, RolesGuard) // ⬅️ Para toda la clase
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found.',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    this.logger.log(`GET /users/${id} - Fetching user`);

    try {
      const user = await this.usersService.findOne(id);
      this.logger.log(`GET /users/${id} - User found: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`GET /users/${id} - Error: ${error.message}`);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // ⬅️ Para toda la clase
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully updated.',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Email already exists.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    this.logger.log(`PATCH /users/${id} - Updating user`);

    try {

      const user = await this.usersService.update(id, updateUserDto, currentUser);
      this.logger.log(`PATCH /users/${id} - User updated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`PATCH /users/${id} - Error: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    this.logger.log(`DELETE /users/${id} - Deleting user`);



    try {
      await this.usersService.remove(id, currentUser);
      this.logger.log(`DELETE /users/${id} - User deleted successfully`);
    } catch (error) {
      this.logger.error(`DELETE /users/${id} - Error: ${error.message}`);
      throw error;
    }
  }
}