import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status for the order',
    enum: ['pending', 'ready_for_pickup', 'completed'],
    example: 'ready_for_pickup',
  })
  @IsString()
  @IsIn(['pending', 'ready_for_pickup', 'completed'])
  status: string;
}
