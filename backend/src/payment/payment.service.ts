import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { User } from '../auth/entities/user.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private paymongoApi: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private cartService: CartService,
  ) {
    // PayMongo API keys - should be in environment variables
    this.secretKey = process.env.PAYMONGO_SECRET_KEY || 'sk_test_your_secret_key';
    this.publicKey = process.env.PAYMONGO_PUBLIC_KEY || 'pk_test_your_public_key';
    
    this.paymongoApi = axios.create({
      baseURL: 'https://api.paymongo.com/v1',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Flatten metadata object to ensure PayMongo compatibility
   * PayMongo only accepts flat objects with string values (no nested objects)
   */
  private flattenMetadata(metadata: any): Record<string, string> {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }

    const flattened: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Skip nested objects - PayMongo doesn't support them
      if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
        // For nested objects, we'll skip them or convert to JSON string
        // But PayMongo prefers flat structure, so we'll just skip nested objects
        continue;
      }
      
      // Convert all primitive values to strings
      flattened[key] = String(value);
    }

    return flattened;
  }

  async createPaymentIntent(amount: number, description: string, returnUrl: string, userId: number, lineItems?: any[], metadata?: any) {
    try {
      // Validate API keys
      if (this.secretKey === 'sk_test_your_secret_key' || this.publicKey === 'pk_test_your_public_key') {
        throw new BadRequestException('PayMongo API keys not configured. Please set PAYMONGO_SECRET_KEY and PAYMONGO_PUBLIC_KEY in environment variables.');
      }

      // Validate amount
      if (!amount || amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Get user information to pre-fill billing form
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Prepare billing information for PayMongo Checkout Session
      // This will pre-fill the email and name fields in the billing form
      const billingName = `${user.firstName} ${user.lastName}`.trim();

      // Prepare line items for itemized display (newest PayMongo Checkout Sessions API)
      // If line items are provided, use them; otherwise create a single line item
      let lineItemsArray: any[] = [];
      
      if (lineItems && lineItems.length > 0) {
        // Use provided line items for itemized breakdown
        lineItemsArray = lineItems.map(item => ({
          name: item.name || 'Item',
          quantity: item.quantity || 1,
          amount: Math.round((item.price || 0) * 100), // Convert to centavos
          currency: 'PHP',
        }));
      } else {
        // Fallback: create a single line item from total amount
        lineItemsArray = [{
          name: description || 'Order',
          quantity: 1,
          amount: Math.round(amount * 100), // Convert to centavos
          currency: 'PHP',
        }];
      }

      // Validate line items
      if (lineItemsArray.length === 0) {
        throw new BadRequestException('At least one line item is required');
      }

      // Flatten metadata to ensure PayMongo compatibility
      const flattenedMetadata = this.flattenMetadata(metadata);

      // Create Checkout Session using the NEWEST PayMongo API (Checkout Sessions)
      // This provides the modern UI shown in the image with:
      // - Itemized line items display
      // - "You are paying" header with user name
      // - Two-panel layout (payment details on left, payment method on right)
      // - Pre-filled billing information
      const response = await this.paymongoApi.post('/checkout_sessions', {
        data: {
          attributes: {
            line_items: lineItemsArray,
            payment_method_types: ['card', 'gcash', 'grab_pay'],
            // Billing information to pre-fill the form
            billing: {
              name: billingName,
              email: user.email,
            },
            // Enable automatic email receipt - PayMongo will send receipt to billing email
            send_email_receipt: true,
            // Success and cancel URLs
            success_url: returnUrl,
            // Extract base URL from returnUrl for cancel URL
            cancel_url: returnUrl.split('?')[0] || returnUrl.replace('?payment=success', ''),
            // Simple description - line items already show the detailed breakdown
            // Description appears in "Payment for" section, so keep it short
            description: description || 'Order',
            metadata: {
              ...flattenedMetadata,
              user_id: String(userId),
            },
          },
        },
      });

      if (!response.data?.data?.id) {
        throw new BadRequestException('Invalid response from PayMongo API');
      }

      const checkoutSessionId = response.data.data.id;
      // PayMongo Checkout Sessions return checkout_url in attributes
      // This URL shows the modern UI with itemized breakdown
      const checkoutUrl = response.data.data.attributes.checkout_url;

      if (!checkoutUrl) {
        console.error('PayMongo Checkout Session response:', JSON.stringify(response.data, null, 2));
        throw new BadRequestException('Checkout URL not provided by PayMongo');
      }

      // Log for debugging
      console.log('PayMongo Checkout Session created:', {
        sessionId: checkoutSessionId,
        checkoutUrl: checkoutUrl,
        fullResponse: response.data.data,
      });

      // Verify the checkout URL is a valid PayMongo checkout URL
      if (!checkoutUrl.includes('pay.paymongo.com') && !checkoutUrl.includes('paymongo.com/checkout')) {
        console.warn('Unexpected checkout URL format:', checkoutUrl);
      }

      // Return checkout URL for redirect to PayMongo's newest hosted checkout page
      // This shows the modern UI with itemized breakdown and pre-filled billing info
      return {
        clientKey: this.publicKey,
        checkoutSessionId: checkoutSessionId,
        checkoutUrl: checkoutUrl,
        returnUrl: returnUrl,
      };
    } catch (error: any) {
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle PayMongo API errors
      const errorMessage = error.response?.data?.errors?.[0]?.detail || 
                          error.response?.data?.errors?.[0]?.code ||
                          error.message || 
                          'Failed to create checkout session';
      
      console.error('PayMongo API Error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new BadRequestException(`Payment error: ${errorMessage}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const response = await this.paymongoApi.get(`/payment_intents/${paymentIntentId}`);
      return response.data.data;
    } catch (error: any) {
      throw new BadRequestException(
        error.response?.data?.errors?.[0]?.detail || 'Failed to retrieve payment intent',
      );
    }
  }

  async retrievePaymentLink(paymentLinkId: string) {
    try {
      const response = await this.paymongoApi.get(`/links/${paymentLinkId}`);
      return response.data.data;
    } catch (error: any) {
      throw new BadRequestException(
        error.response?.data?.errors?.[0]?.detail || 'Failed to retrieve payment link',
      );
    }
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  async handleWebhook(body: any, signature: string, rawBody: Buffer | string) {
    try {
      // Log incoming webhook for debugging
      this.logger.log('🔔 Webhook received:', {
        hasSignature: !!signature,
        signaturePreview: signature ? signature.substring(0, 50) + '...' : 'missing',
        signatureLength: signature ? signature.length : 0,
        hasRawBody: !!rawBody,
        rawBodyType: typeof rawBody,
        rawBodyLength: rawBody ? (typeof rawBody === 'string' ? rawBody.length : rawBody.length) : 0,
        bodyKeys: body ? Object.keys(body) : [],
      });

      // Verify webhook signature for security
      if (!signature || signature.trim() === '') {
        this.logger.warn('⚠️  Missing PayMongo webhook signature header');
        // In development, allow webhooks without signature for testing
        // In production, this should throw an error
        if (process.env.NODE_ENV === 'production') {
          throw new BadRequestException('Missing webhook signature');
        } else {
          this.logger.warn('⚠️  Allowing webhook without signature in development mode');
        }
      }

      // Verify signature using PayMongo's webhook secret
      // Note: You need to set PAYMONGO_WEBHOOK_SECRET in your .env file
      // Get the webhook secret from PayMongo Dashboard > Developers > Webhooks
      // PayMongo webhook secrets typically start with 'whsec_' or 'whsk_'
      // For HMAC verification, we need to use the secret WITHOUT the prefix
      let webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
      if (!webhookSecret) {
        this.logger.warn('PAYMONGO_WEBHOOK_SECRET not configured. Webhook signature verification skipped.');
        // In development, we can skip verification, but in production this should always be verified
      } else if (process.env.SKIP_WEBHOOK_VERIFICATION === 'true') {
        // Temporary: Skip verification for debugging (remove in production!)
        this.logger.warn('⚠️  Webhook signature verification SKIPPED (SKIP_WEBHOOK_VERIFICATION=true)');
      } else {
        // PayMongo webhook secret format: whsec_xxx or whsk_xxx
        // For HMAC calculation, PayMongo requires the secret WITHOUT the prefix
        // Remove prefix if present
        let secretKey = webhookSecret;
        if (webhookSecret.startsWith('whsec_')) {
          secretKey = webhookSecret.substring(6); // Remove 'whsec_' prefix
          this.logger.log('Using webhook secret (removed whsec_ prefix, length):', secretKey.length);
        } else if (webhookSecret.startsWith('whsk_')) {
          secretKey = webhookSecret.substring(5); // Remove 'whsk_' prefix
          this.logger.log('Using webhook secret (removed whsk_ prefix, length):', secretKey.length);
        } else {
          this.logger.log('Using webhook secret as-is (no prefix detected, length):', secretKey.length);
        }
        
        // PayMongo uses HMAC SHA-256 with the RAW request body bytes
        // The signature format is: t=timestamp,te=hmac_hex,li=
        // Get raw body - must be exact bytes PayMongo sent (not parsed/re-stringified)
        let rawBodyBuffer: Buffer;
        let rawBodyString: string;
        
        if (rawBody) {
          if (Buffer.isBuffer(rawBody)) {
            // Use Buffer directly (most accurate)
            rawBodyBuffer = rawBody;
            rawBodyString = rawBody.toString('utf8');
          } else if (typeof rawBody === 'string') {
            // Convert string to Buffer
            rawBodyBuffer = Buffer.from(rawBody, 'utf8');
            rawBodyString = rawBody;
          } else {
            // Convert to string then buffer
            rawBodyString = String(rawBody);
            rawBodyBuffer = Buffer.from(rawBodyString, 'utf8');
          }
        } else {
          // Fallback: use stringified body (may cause signature mismatch)
          this.logger.warn('⚠️  Raw body not available, using stringified body (may cause signature mismatch)');
          rawBodyString = JSON.stringify(body);
          rawBodyBuffer = Buffer.from(rawBodyString, 'utf8');
        }
        
        this.logger.log('📦 Raw body info:', {
          hasRawBody: !!rawBody,
          isBuffer: Buffer.isBuffer(rawBody),
          bufferLength: rawBodyBuffer.length,
          stringLength: rawBodyString.length,
        });
        
        // Extract signature parts
        // PayMongo signature format: t=timestamp,te=signature_hex,li=
        // Example: t=1767899352,te=a55081e483e59b61d11523e192eb0cab9ebd8610eb1d0cb8852d0a09e69c0ec3,li=
        this.logger.log('📝 Raw signature received:', signature.substring(0, 100) + (signature.length > 100 ? '...' : ''));
        
        const parts = signature.split(',');
        let receivedSignature = '';
        let timestamp = '';
        
        // Extract timestamp (t=...) and signature (te=...)
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('t=')) {
            timestamp = trimmed.substring(2); // Remove 't=' prefix
          } else if (trimmed.startsWith('te=')) {
            receivedSignature = trimmed.substring(3); // Remove 'te=' prefix
          } else if (trimmed.startsWith('v1=')) {
            // Fallback for v1= format (older PayMongo format)
            receivedSignature = trimmed.substring(3);
          } else if (!trimmed.startsWith('li=')) {
            // If it's not t=, te=, v1=, or li=, it might be just the signature
            // Check if it's a valid hex string
            if (/^[0-9a-fA-F]+$/i.test(trimmed) && trimmed.length > 32) {
              receivedSignature = trimmed;
            }
          }
        }
        
        // If still no signature found, try the whole signature string (remove known prefixes)
        if (!receivedSignature) {
          const cleanedSignature = signature
            .replace(/^t=\d+,?/, '') // Remove timestamp
            .replace(/^te=/, '') // Remove te= prefix
            .replace(/^v1=/, '') // Remove v1= prefix
            .replace(/li=.*$/, '') // Remove li= and everything after
            .replace(/,/g, '') // Remove any remaining commas
            .trim();
          
          if (/^[0-9a-fA-F]+$/i.test(cleanedSignature)) {
            receivedSignature = cleanedSignature;
          }
        }
        
        // Validate signature is not empty and is valid hex
        if (!receivedSignature || !/^[0-9a-fA-F]+$/i.test(receivedSignature)) {
          this.logger.error('❌ Invalid signature format:', {
            originalSignature: signature,
            extracted: receivedSignature,
            parts: parts,
            signatureLength: signature.length,
            extractedLength: receivedSignature ? receivedSignature.length : 0,
          });
          throw new BadRequestException('Invalid signature format. Expected hex string but got: ' + (receivedSignature || 'empty'));
        }
        
        this.logger.log('✅ Extracted signature (length):', receivedSignature.length);
        
        // Calculate expected signature using HMAC SHA-256
        // PayMongo signature format: HMAC-SHA256(webhook_secret, timestamp + "." + raw_body)
        // The signature includes the timestamp to prevent replay attacks
        let expectedSignature = '';
        let expectedSignatureWithPrefix = '';
        let expectedSignatureNoTimestamp = '';
        let expectedSignatureNoTimestampWithPrefix = '';
        
        // Method 1: Include timestamp (most common for PayMongo)
        if (timestamp) {
          const payloadWithTimestamp = timestamp + '.' + rawBodyString;
          const payloadBufferWithTimestamp = Buffer.from(payloadWithTimestamp, 'utf8');
          
          expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(payloadBufferWithTimestamp)
            .digest('hex');
          
          expectedSignatureWithPrefix = crypto
            .createHmac('sha256', webhookSecret)
            .update(payloadBufferWithTimestamp)
            .digest('hex');
        }
        
        // Method 2: Without timestamp (fallback for older PayMongo versions)
        expectedSignatureNoTimestamp = crypto
          .createHmac('sha256', secretKey)
          .update(rawBodyBuffer)
          .digest('hex');
        
        expectedSignatureNoTimestampWithPrefix = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBodyBuffer)
          .digest('hex');
        
        this.logger.log('🔐 Signature comparison:', {
          receivedLength: receivedSignature.length,
          expectedWithTimestampLength: expectedSignature ? expectedSignature.length : 0,
          expectedWithTimestampPrefixLength: expectedSignatureWithPrefix ? expectedSignatureWithPrefix.length : 0,
          expectedNoTimestampLength: expectedSignatureNoTimestamp.length,
          expectedNoTimestampPrefixLength: expectedSignatureNoTimestampWithPrefix.length,
          receivedPreview: receivedSignature.substring(0, 40) + '...',
          expectedWithTimestampPreview: expectedSignature ? expectedSignature.substring(0, 40) + '...' : 'not calculated',
          expectedNoTimestampPreview: expectedSignatureNoTimestamp.substring(0, 40) + '...',
          secretKeyLength: secretKey.length,
          webhookSecretLength: webhookSecret.length,
          rawBodyLength: rawBodyBuffer.length,
          timestamp: timestamp || 'not found',
        });
        
        // Compare signatures using constant-time comparison to prevent timing attacks
        try {
          const receivedBuffer = Buffer.from(receivedSignature, 'hex');
          
          // Try all combinations (filter out empty strings)
          const attempts = [
            { buffer: expectedSignature ? Buffer.from(expectedSignature, 'hex') : null, method: 'with timestamp, secret WITHOUT prefix' },
            { buffer: expectedSignatureWithPrefix ? Buffer.from(expectedSignatureWithPrefix, 'hex') : null, method: 'with timestamp, secret WITH prefix' },
            { buffer: expectedSignatureNoTimestamp ? Buffer.from(expectedSignatureNoTimestamp, 'hex') : null, method: 'without timestamp, secret WITHOUT prefix' },
            { buffer: expectedSignatureNoTimestampWithPrefix ? Buffer.from(expectedSignatureNoTimestampWithPrefix, 'hex') : null, method: 'without timestamp, secret WITH prefix' },
          ].filter(attempt => attempt.buffer !== null) as Array<{ buffer: Buffer; method: string }>;
          
          let signatureMatches = false;
          let matchMethod = '';
          
          for (const attempt of attempts) {
            if (receivedBuffer.length === attempt.buffer.length) {
              if (crypto.timingSafeEqual(receivedBuffer, attempt.buffer)) {
                signatureMatches = true;
                matchMethod = attempt.method;
                break;
              }
            }
          }
          
          if (signatureMatches) {
            this.logger.log(`✅ Webhook signature verified successfully (using ${matchMethod})`);
          } else {
            // Check buffer lengths for better error messages
            const expectedLengths = attempts.map(a => a.buffer.length);
            const lengthMatches = expectedLengths.some(len => len === receivedBuffer.length);
            
            if (!lengthMatches) {
              this.logger.error('Signature length mismatch', {
                receivedLength: receivedBuffer.length,
                expectedLengths: expectedLengths,
                received: receivedSignature.substring(0, 30) + '...',
                signature: signature,
              });
              throw new BadRequestException('Invalid webhook signature (length mismatch)');
            }
            
            this.logger.error('Invalid webhook signature (values do not match)', {
              received: receivedSignature.substring(0, 40) + '...',
              expectedWithTimestamp: expectedSignature ? expectedSignature.substring(0, 40) + '...' : 'not calculated',
              expectedNoTimestamp: expectedSignatureNoTimestamp.substring(0, 40) + '...',
              secretKeyLength: secretKey.length,
              webhookSecretLength: webhookSecret.length,
              rawBodyPreview: rawBodyString.substring(0, 200) + '...',
            });
            throw new BadRequestException('Invalid webhook signature');
          }
        } catch (error: any) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          // Handle buffer length mismatch or other errors
          this.logger.error('Signature verification error:', error.message);
          throw new BadRequestException(`Failed to verify webhook signature: ${error.message}`);
        }
      }

      // Extract event data
      const eventType = body?.data?.attributes?.type || body?.data?.type;
      const eventData = body?.data?.attributes || body?.data;

      console.log('PayMongo webhook received:', {
        type: eventType,
        id: body?.data?.id,
      });

      // Handle different webhook event types
      switch (eventType) {
        case 'checkout_session.payment.paid':
          // Payment successful - create order from webhook data
          this.logger.log('✅ Payment successful - creating order from webhook');
          await this.handlePaymentSuccess(eventData);
          break;

        case 'checkout_session.payment.failed':
          // Payment failed
          this.logger.warn('❌ Payment failed:', eventData?.data?.id || 'unknown');
          // Handle payment failure (e.g., log error, notify user)
          break;

        case 'payment.paid':
          // Payment completed (for Payment Intents/Links)
          this.logger.log('✅ Payment paid (Payment Intent/Link)');
          await this.handlePaymentSuccess(eventData);
          break;

        default:
          this.logger.log('ℹ️  Unhandled webhook event type:', eventType);
      }

      return { received: true };
    } catch (error: any) {
      this.logger.error('❌ Webhook processing error:', error);
      throw error instanceof BadRequestException 
        ? error 
        : new BadRequestException('Failed to process webhook');
    }
  }

  private async handlePaymentSuccess(eventData: any) {
    try {
      // Webhook payload structure:
      // body.data.attributes.type = "checkout_session.payment.paid"
      // body.data.attributes.data.attributes = checkout session data
      // body.data.attributes.data.attributes.metadata.user_id = user ID
      // body.data.attributes.data.attributes.line_items = line items
      
      // eventData = body.data.attributes (passed from handleWebhook)
      const checkoutSession = eventData?.data?.attributes || eventData?.attributes || eventData;
      
      // Extract user ID from metadata
      // Metadata location: checkoutSession.metadata.user_id
      const userId = checkoutSession?.metadata?.user_id;
      
      if (!userId) {
        this.logger.error('❌ No user_id found in webhook metadata', {
          checkoutSessionKeys: Object.keys(checkoutSession || {}),
          metadata: checkoutSession?.metadata,
          eventDataKeys: Object.keys(eventData || {}),
        });
        throw new BadRequestException('User ID not found in webhook metadata');
      }

      const userIdNumber = Number(userId);
      if (isNaN(userIdNumber)) {
        this.logger.error('❌ Invalid user_id in metadata:', userId);
        throw new BadRequestException('Invalid user ID in webhook metadata');
      }

      // Get line items from checkout session
      // Line items are in: checkoutSession.line_items
      const lineItems = checkoutSession?.line_items || [];
      
      if (!lineItems || lineItems.length === 0) {
        this.logger.error('❌ No line items found in webhook data', {
          checkoutSessionKeys: Object.keys(checkoutSession || {}),
        });
        throw new BadRequestException('No line items found in webhook data');
      }

      this.logger.log('📦 Processing order from webhook:', {
        userId: userIdNumber,
        lineItemCount: lineItems.length,
        lineItems: lineItems.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          amount: item.amount,
        })),
      });

      // Try to get user's cart items first (if cart still exists)
      // This is more reliable as we have productIds
      try {
        const cartItems = await this.cartService.findAll(userIdNumber);
        
        if (cartItems && cartItems.length > 0) {
          // Create order from cart items (most reliable as we have productIds)
          const orderItems = cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.product.price.toString()),
          }));

          await this.ordersService.create({ items: orderItems }, userIdNumber);
          this.logger.log('✅ Order created successfully from cart items');
          return; // Success - cart already cleared by OrdersService.create()
        }
      } catch (cartError: any) {
        this.logger.warn('⚠️  Could not get cart items (cart may be empty):', cartError.message);
      }

      // Fallback: Create order from webhook line items by matching product names
      this.logger.log('📋 Creating order from webhook line items (matching by product name)');
      await this.createOrderFromWebhookLineItems(lineItems, userIdNumber);

    } catch (error: any) {
      this.logger.error('❌ Failed to create order from webhook:', error.message || error);
      // Don't throw error - we still want to return success to PayMongo
      // Otherwise they'll retry the webhook repeatedly
      this.logger.warn('⚠️  Order creation failed but webhook acknowledged (to prevent retries)');
    }
  }

  private async createOrderFromWebhookLineItems(lineItems: any[], userId: number) {
    // Match products by name and create order items
    const orderItems = [];
    const allProducts = await this.productsService.findAll();

    for (const lineItem of lineItems) {
      const productName = lineItem.name;
      const quantity = lineItem.quantity;
      const amountInCentavos = lineItem.amount;
      const priceInPHP = amountInCentavos / 100; // Convert centavos to PHP

      // Find product by name (case-insensitive)
      const product = allProducts.find(
        p => p.name.toLowerCase().trim() === productName.toLowerCase().trim()
      );

      if (!product) {
        this.logger.error(`❌ Product not found: ${productName}`);
        continue; // Skip this item if product not found
      }

      orderItems.push({
        productId: product.id,
        quantity: quantity,
        price: priceInPHP,
      });
    }

    if (orderItems.length === 0) {
      throw new BadRequestException('Could not match any products from webhook line items');
    }

    await this.ordersService.create({ items: orderItems }, userId);
    this.logger.log('✅ Order created successfully from webhook line items');
  }
}
