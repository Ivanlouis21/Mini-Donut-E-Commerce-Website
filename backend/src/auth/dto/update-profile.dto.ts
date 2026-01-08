import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class UpdateProfilePictureDto {
  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgo...', description: 'Base64 encoded image data' })
  @IsString()
  @IsNotEmpty()
  profilePicture: string;
}
