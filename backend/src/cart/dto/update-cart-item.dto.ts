import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiPropertyOptional({ example: 3, description: 'Updated quantity of the cart item', minimum: 1, type: 'number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
