import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User bio/description',
    example: 'Passionate traveler and food enthusiast',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date of birth must be a valid date string (YYYY-MM-DD)' },
  )
  dob?: string;

  @ApiProperty({
    description: 'Phone number with country code',
    example: '+2348123456789',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  telephoneNumber?: string;

  @ApiProperty({
    description: 'Profile picture as base64 data URL',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/, {
    message: 'Profile picture must be a valid base64 data URL for images',
  })
  profilePicture?: string;
}
