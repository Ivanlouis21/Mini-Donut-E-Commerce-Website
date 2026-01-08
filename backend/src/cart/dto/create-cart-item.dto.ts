import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemDto {
  @ApiProperty({ example: 1, description: 'Product ID to add to cart', type: 'number' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity of the product', minimum: 1, type: 'number' })
  @IsNumber()
  @Min(1)
  quantity: number;
}
