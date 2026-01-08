import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart', description: 'Add a product to the order cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  create(@Body() createCartItemDto: CreateCartItemDto, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.create(createCartItemDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cart items', description: 'Retrieve all items in the current user\'s cart' })
  @ApiResponse({ status: 200, description: 'Cart items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  findAll(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cart item by ID', description: 'Retrieve a specific cart item by its ID' })
  @ApiParam({ name: 'id', description: 'Cart item ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cart item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.findOne(+id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cart item', description: 'Update quantity or other properties of a cart item' })
  @ApiParam({ name: 'id', description: 'Cart item ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  update(@Param('id') id: string, @Body() updateCartItemDto: UpdateCartItemDto, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.update(+id, updateCartItemDto, userId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear cart', description: 'Remove all items from the current user\'s cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  clear(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.clear(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove cart item', description: 'Remove a specific item from the cart' })
  @ApiParam({ name: 'id', description: 'Cart item ID', type: 'number' })
  @ApiResponse({ status: 204, description: 'Cart item removed successfully' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.cartService.remove(+id, userId);
  }
}
