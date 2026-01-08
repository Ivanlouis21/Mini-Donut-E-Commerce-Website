import { Controller, Post, Body, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto, UpdateProfilePictureDto } from './dto/update-profile.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with email, password, first name, and last name' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered', schema: { example: { token: 'jwt_token_here', user: { id: 1, email: 'user@example.com', firstName: 'John', lastName: 'Doe' } } } })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticate user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in', schema: { example: { token: 'jwt_token_here', user: { id: 1, email: 'user@example.com', firstName: 'John', lastName: 'Doe' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset', description: 'Send password reset email to user' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if email exists)', schema: { example: { message: 'If the email exists, a password reset link has been sent.' } } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password', description: 'Reset user password using reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully reset', schema: { example: { message: 'Password has been reset successfully' } } })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password', description: 'Change user password (requires authentication)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password successfully changed', schema: { example: { message: 'Password changed successfully' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token or incorrect current password' })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: Request) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      // Decode JWT token to get user ID
      const payload = this.jwtService.verify(token, { secret: 'your-secret-key-change-this-in-production' });
      const userId = payload.sub;

      return this.authService.changePassword(userId, changePasswordDto);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post('update-profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile', description: 'Update user profile information (requires authentication)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile successfully updated', schema: { example: { user: { id: 1, email: 'user@example.com', firstName: 'John', lastName: 'Doe' }, message: 'Profile updated successfully' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Req() req: Request) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      // Decode JWT token to get user ID
      const payload = this.jwtService.verify(token, { secret: 'your-secret-key-change-this-in-production' });
      const userId = payload.sub;

      return this.authService.updateProfile(userId, updateProfileDto);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post('update-profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile picture', description: 'Update user profile picture (requires authentication)' })
  @ApiBody({ type: UpdateProfilePictureDto })
  @ApiResponse({ status: 200, description: 'Profile picture successfully updated', schema: { example: { message: 'Profile picture updated successfully', profilePicture: 'data:image/png;base64,...' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  async updateProfilePicture(@Body() updateProfilePictureDto: UpdateProfilePictureDto, @Req() req: Request) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      // Decode JWT token to get user ID
      const payload = this.jwtService.verify(token, { secret: 'your-secret-key-change-this-in-production' });
      const userId = payload.sub;

      return this.authService.updateProfilePicture(userId, updateProfilePictureDto);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post('promote-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote user to admin', description: 'Promote a user to admin role by email (for initial setup)' })
  @ApiBody({ type: PromoteAdminDto })
  @ApiResponse({ status: 200, description: 'User promoted to admin successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async promoteToAdmin(@Body() promoteAdminDto: PromoteAdminDto) {
    return this.authService.promoteToAdmin(promoteAdminDto.email);
  }
}
