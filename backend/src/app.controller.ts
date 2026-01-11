import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Root', description: 'Get API information and available endpoints' })
  @ApiResponse({ status: 200, description: 'API information' })
  getRoot() {
    return {
      message: 'Mini Donut E-Commerce API',
      version: '1.0',
      documentation: '/api-docs',
      endpoints: {
        auth: '/auth',
        products: '/products',
        cart: '/cart',
        orders: '/orders',
        payment: '/payment',
        contact: '/contact',
      },
    };
  }
}
