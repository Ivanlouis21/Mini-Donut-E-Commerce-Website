import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async create(createCartItemDto: CreateCartItemDto, userId: number): Promise<CartItem> {
    // Validate product exists and has enough stock
    const product = await this.productsService.findOne(createCartItemDto.productId);
    
    // Check if item already exists in cart for this user
    const existingItem = await this.cartItemRepository.findOne({
      where: { productId: createCartItemDto.productId, userId },
    });

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + createCartItemDto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException('Not enough stock available');
      }
      existingItem.quantity = newQuantity;
      return await this.cartItemRepository.save(existingItem);
    }

    // Validate stock
    if (createCartItemDto.quantity > product.stock) {
      throw new BadRequestException('Not enough stock available');
    }

    const cartItem = this.cartItemRepository.create({
      ...createCartItemDto,
      userId,
    });
    return await this.cartItemRepository.save(cartItem);
  }

  async findAll(userId: number): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
    });
  }

  async findOne(id: number, userId: number): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id, userId },
      relations: ['product'],
    });
    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }
    return cartItem;
  }

  async update(id: number, updateCartItemDto: UpdateCartItemDto, userId: number): Promise<CartItem> {
    const cartItem = await this.findOne(id, userId);
    
    if (updateCartItemDto.quantity !== undefined) {
      // Validate stock
      const product = await this.productsService.findOne(cartItem.productId);
      if (updateCartItemDto.quantity > product.stock) {
        throw new BadRequestException('Not enough stock available');
      }
      cartItem.quantity = updateCartItemDto.quantity;
    }

    return await this.cartItemRepository.save(cartItem);
  }

  async remove(id: number, userId: number): Promise<void> {
    const cartItem = await this.findOne(id, userId);
    await this.cartItemRepository.remove(cartItem);
  }

  async clear(userId: number): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }
}
