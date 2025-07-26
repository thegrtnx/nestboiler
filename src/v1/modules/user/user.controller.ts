import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from 'src/v1/dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { GetUser, Roles, JwtGuard, RolesGuard } from 'src/utils';
import { Role, User } from '@prisma/client';

@ApiTags('User')
@Controller({ path: 'user', version: '1' })
@ApiBearerAuth('Authorization')
@UseGuards(JwtGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.USER)
  @ApiOperation({ summary: 'User Profile' })
  @ApiResponse({
    status: 200,
    description: 'User Profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get()
  getMe(@GetUser() user: User) {
    return this.userService.getMe(user.userId);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'Update user profile data',
    schema: {
      type: 'object',
      properties: {
        bio: {
          type: 'string',
          description: 'User bio/description',
          maxLength: 500,
        },
        dob: {
          type: 'string',
          format: 'date',
          description: 'Date of birth (YYYY-MM-DD)',
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number with country code',
        },
        profilePicture: {
          type: 'string',
          description:
            'Profile picture as base64 data URL (data:image/[type];base64,[data])',
          example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or base64 format',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @HttpCode(HttpStatus.OK)
  @Put('update')
  updateUser(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(
      user.userId,
      updateUserDto,
      updateUserDto.profilePicture,
    );
  }
}
