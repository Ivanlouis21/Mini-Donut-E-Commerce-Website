import { IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID', type: 'number' })
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity of the product', minimum: 1, type: 'number' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 5.99, description: 'Price per unit', minimum: 0, type: 'number' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ 
    type: [OrderItemDto], 
    description: 'Array of order items',
    example: [
      { productId: 1, quantity: 2, price: 5.99 },
      { productId: 2, quantity: 1, price: 3.99 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
