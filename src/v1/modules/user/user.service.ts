import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { handleResponse, AuthHelper } from 'src/utils';
import { UpdateUserDto } from 'src/v1/dto';
import { CloudinaryService } from 'src/lib/cloudinary/cloudinary.service';
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authHelper: AuthHelper,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        Referral: true,
      },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'User not found');
    }

    //sanitize the user data
    const sanitizedUser = this.authHelper.sanitizeUser(user);

    return new handleResponse(
      HttpStatus.OK,
      'User found',
      sanitizedUser,
    ).getResponse();
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    profilePictureBase64?: string,
  ) {
    // Validate user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'User not found');
    }

    let profilePictureData: {
      profilePictureUrl?: string;
      profilePicturePublicId?: string;
    } = {};

    // Handle profile picture upload
    if (profilePictureBase64) {
      try {
        // Validate base64 format
        if (!(await this.authHelper.isValidBase64(profilePictureBase64))) {
          throw new Error('Invalid base64 format');
        }

        // Delete old profile picture if it exists
        if (existingUser?.profilePicturePublicId) {
          await this.cloudinaryService.deleteMedia(
            existingUser.profilePicturePublicId,
            'image',
          );
        }

        // Convert base64 to buffer
        const base64Data = profilePictureBase64.replace(
          /^data:image\/[a-z]+;base64,/,
          '',
        );
        const imageBuffer = Buffer.from(base64Data, 'base64');

        if (!imageBuffer) {
          throw new Error('Failed to convert base64 to buffer');
        }

        // Upload new profile picture
        const uploadResult = await this.cloudinaryService.uploadImage(
          imageBuffer,
          'profile-pictures',
        );

        profilePictureData = {
          profilePictureUrl: uploadResult.secure_url,
          profilePicturePublicId: uploadResult.public_id,
        };
      } catch (error) {
        throw new handleResponse(
          HttpStatus.BAD_REQUEST,
          `Failed to upload profile picture: ${error.message}`,
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      ...profilePictureData,
    };

    // Add optional fields if provided
    if (updateUserDto.bio !== undefined) {
      updateData.bio = updateUserDto.bio;
    }

    if (updateUserDto.dob !== undefined) {
      updateData.dob = new Date(updateUserDto.dob);
    }

    if (updateUserDto.telephoneNumber !== undefined) {
      // Check if phone number is already taken by another user
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          telephoneNumber: updateUserDto.telephoneNumber,
          userId: { not: userId },
        },
      });

      if (phoneExists) {
        throw new handleResponse(
          HttpStatus.BAD_REQUEST,
          'Phone number is already in use',
        );
      }

      updateData.telephoneNumber = updateUserDto.telephoneNumber;
    }

    // Update user in database
    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data: updateData,
      include: {
        Referral: true,
      },
    });

    // Sanitize user data
    const sanitizedUser = this.authHelper.sanitizeUser(updatedUser);

    return new handleResponse(
      HttpStatus.OK,
      'User updated successfully',
      sanitizedUser,
    ).getResponse();
  }
}
