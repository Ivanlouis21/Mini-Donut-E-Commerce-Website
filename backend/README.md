# E-Commerce Backend API

NestJS backend with TypeScript and SQLite database.

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Cart
- `GET /cart` - Get all cart items
- `GET /cart/:id` - Get cart item by ID
- `POST /cart` - Add item to cart
- `PATCH /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove item from cart
- `DELETE /cart` - Clear cart

### Orders
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order (checkout)

### Payment (PayMongo)
- `POST /payment/create-intent` - Create payment intent for checkout
- `GET /payment/public-key` - Get PayMongo public key
- `GET /payment/intent/:id` - Get payment intent status

## PayMongo Setup

1. Sign up for a PayMongo account at https://dashboard.paymongo.com/
2. Get your API keys from the dashboard (Test keys for development, Live keys for production)
3. Create a `.env` file in the backend directory with:
   ```
   PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
   PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
   ```
4. The payment integration supports:
   - Credit/Debit Cards
   - GCash
   - GrabPay