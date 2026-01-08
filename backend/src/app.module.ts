import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { ContactModule } from './contact/contact.module';
import { Product } from './products/entities/product.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { User } from './auth/entities/user.entity';
import { ContactMessage } from './contact/entities/contact-message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'ecommerce.db',
      entities: [Product, CartItem, Order, OrderItem, User, ContactMessage],
      synchronize: true, // Auto-create tables (use migrations in production)
    }),
    ProductsModule,
    CartModule,
    OrdersModule,
    AuthModule,
    PaymentModule,
    ContactModule,
  ],
})
export class AppModule {}
