import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productsService: ProductsService,
    private cartService: CartService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    let total = 0;
    const orderItems: OrderItem[] = [];

    // Validate stock and calculate total
    for (const item of createOrderDto.items) {
      // Ensure numeric types
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (isNaN(productId) || isNaN(quantity) || isNaN(price)) {
        throw new BadRequestException('Invalid item data: productId, quantity, and price must be valid numbers');
      }

      const product = await this.productsService.findOne(productId);
      // findOne throws NotFoundException if product not found, so no need to check

      // Convert product price to number if it's a string (from decimal database type)
      const productPrice = Number(product.price);
      const productStock = Number(product.stock);

      // Validate stock
      if (quantity > productStock) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}. Available: ${productStock}, Requested: ${quantity}`,
        );
      }

      // Validate price (allow small floating point differences)
      const priceDifference = Math.abs(price - productPrice);
      if (priceDifference > 0.01) {
        throw new BadRequestException(
          `Price mismatch for product ${product.name}. Expected: ${productPrice}, Received: ${price}`,
        );
      }

      // Update product stock
      product.stock -= quantity;
      await this.productsService.update(productId, { stock: product.stock });

      // Calculate total
      total += price * quantity;

      // Create order item
      const orderItem = this.orderItemRepository.create({
        productId: productId,
        quantity: quantity,
        price: price,
      });
      orderItems.push(orderItem);
    }

    // Create order
    const order = this.orderRepository.create({
      userId,
      total,
      status: 'pending',
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Clear cart after successful order
    await this.cartService.clear(userId);

    return await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product'],
    });
  }

  async findAll(userId: number): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new BadRequestException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findAllAdmin(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new BadRequestException(`Order with ID ${id} not found`);
    }

    // Validate status transition
    const validStatuses = ['pending', 'ready_for_pickup', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    order.status = status;
    await this.orderRepository.save(order);

    return await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });
  }
}
