import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Req, UnauthorizedException, UseGuards, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create payment intent', description: 'Create a PayMongo payment intent for checkout with pre-filled user information' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto, @Req() req: Request) {
    // Get userId from JWT token (set by JwtAuthGuard)
    const userId = (req.user as any).sub;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.paymentService.createPaymentIntent(
      createPaymentIntentDto.amount,
      createPaymentIntentDto.description,
      createPaymentIntentDto.returnUrl,
      userId,
      createPaymentIntentDto.lineItems,
      createPaymentIntentDto.metadata,
    );
  }

  @Get('public-key')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get public key', description: 'Get PayMongo public key for client-side integration' })
  @ApiResponse({ status: 200, description: 'Public key retrieved successfully' })
  getPublicKey(@Req() req: Request) {
    // Validate authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    return {
      publicKey: this.paymentService.getPublicKey(),
    };
  }

  @Get('intent/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment intent', description: 'Retrieve payment intent status' })
  @ApiParam({ name: 'id', description: 'Payment Intent ID' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getPaymentIntent(@Param('id') id: string, @Req() req: Request) {
    // Validate authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    return this.paymentService.retrievePaymentIntent(id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'PayMongo webhook endpoint', description: 'Receives PayMongo webhook events for payment status updates. No authentication required.' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string | string[]>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Log all request headers to debug signature header name
    console.log('📋 All incoming request headers:', {
      headerNames: Object.keys(req.headers),
      headers: req.headers,
    });
    
    // Try multiple header name variations as PayMongo might use different casing
    // HTTP headers are case-insensitive, but some frameworks normalize them differently
    const signatureValue = 
      headers['paymongo-signature'] as string || 
      headers['Paymongo-Signature'] as string ||
      headers['PAYMONGO-SIGNATURE'] as string ||
      req.headers['paymongo-signature'] as string ||
      req.headers['paymongosignature'] as string ||
      '';
    
    // Handle array case (shouldn't happen, but just in case)
    const signature = Array.isArray(signatureValue) ? signatureValue[0] : signatureValue;
    
    console.log('🔐 Extracted signature:', {
      signature: signature ? signature.substring(0, 50) + '...' : 'NOT FOUND',
      signatureLength: signature ? signature.length : 0,
      allSignatureVariations: {
        'paymongo-signature': headers['paymongo-signature'],
        'Paymongo-Signature': headers['Paymongo-Signature'],
        'PAYMONGO-SIGNATURE': headers['PAYMONGO-SIGNATURE'],
        fromReq: req.headers['paymongo-signature'],
      },
    });
    
    if (!signature) {
      console.error('❌ No signature found in any header variation!');
      console.error('Available headers:', Object.keys(req.headers).join(', '));
    }
    
    // Get raw body for signature verification
    // NestJS with rawBody: true stores it in req.rawBody
    const rawBody = (req as any).rawBody || (req as any).raw || req.body;
    
    console.log('📦 Raw body info:', {
      hasRawBody: !!rawBody,
      rawBodyType: typeof rawBody,
      isBuffer: Buffer.isBuffer(rawBody),
      rawBodyLength: rawBody ? (Buffer.isBuffer(rawBody) ? rawBody.length : (typeof rawBody === 'string' ? rawBody.length : 'unknown')) : 0,
    });
    
    return this.paymentService.handleWebhook(body, signature || '', rawBody);
  }
}
