import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from 'src/v1/dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import {
  handleResponse,
  AuthHelper,
  signToken,
  verifyToken,
  signTempToken,
} from 'src/utils';
import { Status } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authHelper: AuthHelper,
    private readonly configService: ConfigService,
  ) {}

  //create user
  async create(createUserDto: CreateUserDto) {
    //check if email exists
    const emailExists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Email already exists');
    }

    //check if password and confirm password match
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'Passwords do not match',
      );
    }

    //hash password
    const hashedPassword = await this.authHelper.hashData(
      createUserDto.password,
    );

    //generate otp and otp expiration date
    const otp = await this.authHelper.generateOtp();
    const otpExpiration = await this.authHelper.generateOtpExpiration();

    //hash the otp
    const hashedOtp = await this.authHelper.hashData(otp.toString());

    //create user
    const newUser = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpiry: otpExpiration,
      },
    });

    //send otp to user email
    await this.authHelper.sendEmail(
      newUser.firstName, //firstName
      newUser.lastName, //lastName
      newUser.email, //email
      'activateAccount', //template
      'Activate Account', //subject
      otp.toString(), //value
      'otpCode', //valueKey
    );

    //sanitixze user data
    const sanitizedUser = this.authHelper.sanitizeUser(newUser);

    return new handleResponse(
      HttpStatus.CREATED,
      'User Created Successfully',
      sanitizedUser,
    ).getResponse();
  }

  //resend otp
  async resendOtp(email: string) {
    const user = await this.authHelper.validateUserAccount({ email });

    //generate otp and otp expiration date
    const otp = await this.authHelper.generateOtp();
    const otpExpiration = await this.authHelper.generateOtpExpiration();

    //hash the otp
    const hashedOtp = await this.authHelper.hashData(otp.toString());

    //update user account
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        otp: hashedOtp,
        otpExpiry: otpExpiration,
      },
    });

    //send otp to email
    await this.authHelper.sendEmail(
      user.firstName, //firstName
      user.lastName, //lastName
      email, //email
      'resend', //template
      'OTP Request', //subject
      otp.toString(), //value
      'otpCode', //valueKey
    );

    return new handleResponse(
      HttpStatus.OK,
      'OTP resent successfully',
    ).getResponse();
  }

  //verify otp
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.authHelper.validateUserAccount({
      email: verifyOtpDto.email,
    });

    //check if OTP exists
    if (!user.otp) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'No existing OTP saved for this account',
      );
    }

    //verify hashed otp
    const isRightOtp = await this.authHelper.verifyHashedData(
      user.otp,
      verifyOtpDto.otp,
    );

    if (!isRightOtp) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Wrong OTP');
    }

    //check if otp is expired
    const isOtpExpired =
      user.otp && user.otpExpiry && user.otpExpiry < new Date();

    if (isOtpExpired) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'OTP expired, please request for a new OTP',
      );
    }

    //create random refcode
    const referralCode = await this.authHelper.generateRefCode();

    //update user account status
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        ...(user.accountStatus === Status.PENDING && {
          isActive: true,
          accountStatus: Status.ACTIVE,
        }),
        otp: null,
        otpExpiry: null,
        referralCode,
      },
    });

    //get the update user details
    const updatedUser = await this.authHelper.validateUserAccount({
      email: user.email,
    });

    const tokens = await signToken(user.userId, user.email, this.configService);

    //update user with refresh token
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    //sanitixze user data
    const sanitizedUser = this.authHelper.sanitizeUser(updatedUser);

    return new handleResponse(HttpStatus.OK, 'OTP verified successfully', {
      ...sanitizedUser,
      tokens,
    }).getResponse();
  }

  //login
  async login(loginDto: LoginDto) {
    const user = await this.authHelper.validateUserAccount({
      email: loginDto.email,
    });

    if (!user) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Account not found');
    }

    //check if password is correct
    const isPasswordCorrect = await this.authHelper.verifyHashedData(
      user.password,
      loginDto.password,
    );

    if (!isPasswordCorrect) {
      throw new handleResponse(HttpStatus.FORBIDDEN, 'Password incorrect');
    }

    //check if user is verified
    if (user.accountStatus === Status.PENDING) {
      //resend otp for user to verify account
      return await this.resendOtp(user.email);
    }

    const tokens = await signToken(user.userId, user.email, this.configService);

    //update user with refresh token
    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        refreshToken: tokens.refreshToken,
        isActive: true,
      },
    });

    //sanitixze user data
    const sanitizedUser = this.authHelper.sanitizeUser(updatedUser);

    return new handleResponse(HttpStatus.OK, 'Login successful', {
      ...sanitizedUser,
      tokens,
    }).getResponse();
  }

  //logout
  async logout(userId: string) {
    //validate user
    await this.authHelper.validateUserAccount({ userId });

    //update db with token and active status
    await this.prisma.user.update({
      where: { userId },
      data: {
        refreshToken: null,
        isActive: false,
        token: null,
      },
    });

    return new handleResponse(HttpStatus.OK, 'Logout successful').getResponse();
  }

  //forgot password
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authHelper.validateUserAccount({
      email: forgotPasswordDto.email,
    });

    //generate reset token and expiration date
    const resetToken = await this.authHelper.generateOtp();
    const resetTokenExpiration = await this.authHelper.generateOtpExpiration();

    //hash the reset token
    const hashedResetToken = await this.authHelper.hashData(
      resetToken.toString(),
    );

    //update user account with reset token
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        resetOtp: hashedResetToken,
        resetOtpExpiry: resetTokenExpiration,
      },
    });

    //send reset token to user email
    await this.authHelper.sendEmail(
      user.firstName, //firstName
      user.lastName, //lastName
      user.email, //email
      'forgotPassword', //template
      'Forgot Password Request', //subject
      resetToken.toString(), //value
      'otpCode', //valueKey
    );

    return new handleResponse(
      HttpStatus.OK,
      'Password reset instructions sent to your email',
    ).getResponse();
  }

  //reset password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.authHelper.validateUserAccount({
      email: resetPasswordDto.email,
    });

    //check if reset OTP exists
    if (!user.resetOtp) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'No password reset request found for this account',
      );
    }

    //verify hashed reset otp
    const isRightResetOtp = await this.authHelper.verifyHashedData(
      user.resetOtp,
      resetPasswordDto.resetOtp,
    );

    if (!isRightResetOtp) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Invalid reset OTP');
    }

    //check if reset otp is expired
    const isResetOtpExpired =
      user.resetOtp && user.resetOtpExpiry && user.resetOtpExpiry < new Date();

    if (isResetOtpExpired) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'Reset OTP expired, please request a new password reset',
      );
    }

    //check if new password and confirm password match
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'New passwords do not match',
      );
    }

    //hash new password
    const hashedNewPassword = await this.authHelper.hashData(
      resetPasswordDto.newPassword,
    );

    //update user password and clear reset otp fields
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: hashedNewPassword,
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });

    //send password reset confirmation email
    await this.authHelper.sendEmail(
      user.firstName, //firstName
      user.lastName, //lastName
      user.email, //email
      'resetPasswordConfirmation', //template
      'Password Reset Successful', //subject
      '', //value
      '', //valueKey
    );

    return new handleResponse(
      HttpStatus.OK,
      'Password reset successfully',
    ).getResponse();
  }

  //refresh token
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      //verify refresh token
      const payload = await verifyToken(
        refreshTokenDto.refreshToken,
        this.configService,
      );

      if (!payload || !payload.sub) {
        throw new handleResponse(
          HttpStatus.UNAUTHORIZED,
          'Invalid refresh token',
        );
      }

      //get user and validate refresh token
      const user = await this.authHelper.validateUserAccount({
        userId: payload.sub,
      });

      //check if refresh token matches stored token
      if (user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new handleResponse(
          HttpStatus.UNAUTHORIZED,
          'Invalid refresh token',
        );
      }

      //check if user account is active
      if (user.accountStatus !== Status.ACTIVE) {
        throw new handleResponse(HttpStatus.FORBIDDEN, 'Account is not active');
      }

      //generate new tokens
      const newToken = await signToken(
        user.userId,
        user.email,
        this.configService,
      );

      //update user with new refresh token
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: {
          refreshToken: newToken.refreshToken,
        },
      });

      //sanitize user data
      const sanitizedUser = this.authHelper.sanitizeUser(user);

      return new handleResponse(HttpStatus.OK, 'Token refreshed successfully', {
        ...sanitizedUser,
        token: newToken,
      }).getResponse();
    } catch (error) {
      if (error instanceof handleResponse) {
        throw error;
      }

      throw new handleResponse(
        HttpStatus.UNAUTHORIZED,
        'Invalid or expired refresh token',
      );
    }
  }
}
