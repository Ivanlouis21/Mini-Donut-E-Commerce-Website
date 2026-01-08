import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order', description: 'Create an order from the current user\'s cart items' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or cart is empty' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders', description: 'Retrieve all orders for the current user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  findAll(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.ordersService.findAll(userId);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all orders (Admin)', description: 'Retrieve all orders from all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'All orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAllAdmin() {
    return this.ordersService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID', description: 'Retrieve a specific order by its ID' })
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.ordersService.findOne(+id, userId);
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (Admin)', description: 'Update the status of an order (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(+id, updateOrderStatusDto.status);
  }
}
