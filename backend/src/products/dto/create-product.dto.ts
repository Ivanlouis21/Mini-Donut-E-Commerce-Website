import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Chocolate Donut', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Delicious chocolate-glazed donut', description: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 5.99, description: 'Product price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, description: 'Product stock quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Product image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Classic', description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;
}
