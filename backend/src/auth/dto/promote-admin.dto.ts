import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromoteAdminDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Email of the user to promote to admin' })
  @IsEmail()
  email: string;
}
