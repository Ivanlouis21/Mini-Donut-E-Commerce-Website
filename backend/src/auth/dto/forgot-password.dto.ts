import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address to send password reset link' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
