# Mini Donut E-Commerce Website

A full-stack e-commerce application with NestJS backend and React frontend, featuring user authentication, payment processing, and admin management.

## Project Structure

```
ecommerce-app/
├── backend/          # NestJS API with TypeScript and SQLite
├── frontend/         # React.js frontend with TypeScript
├── README.md
├── PAYMONGO_SETUP.md # PayMongo integration guide
└── backend/WEBHOOK_SETUP.md # Webhook setup guide
```

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **SQLite** - Lightweight database (TypeORM)
- **JWT** - Authentication tokens
- **PayMongo** - Payment gateway integration
- **Nodemailer** - Email service for password reset

### Frontend
- **React.js** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Toastify** - Toast notifications

## Features

### User Features
- ✅ User registration and authentication
- ✅ Login/Logout functionality
- ✅ Password reset via email
- ✅ User profile management
- ✅ Product browsing and search
- ✅ Shopping cart with quantity management
- ✅ Order placement and tracking
- ✅ Payment processing (PayMongo)
  - Credit/Debit Cards
  - GCash
  - GrabPay
- ✅ Contact form for customer support

### Admin Features
- ✅ Admin dashboard
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ User management
- ✅ Stock and price validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory:
   ```env
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   PORT=3001
   
   # PayMongo Configuration (Optional - for payment features)
   PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
   PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
   
   # Email Configuration (Optional - for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. Start the backend server:
   ```bash
   npm run start:dev
   ```

   The backend API will be available at `http://localhost:3001`

5. (Optional) Seed initial products:
   ```bash
   node seed-products.js
   ```

6. (Optional) Create an admin user:
   ```bash
   node create-admin.js
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/profile` - Get current user profile
- `PATCH /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password
- `POST /auth/promote-admin` - Promote user to admin (admin only)

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (admin only)
- `PATCH /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

### Cart
- `GET /cart` - Get user's cart items
- `POST /cart` - Add item to cart
- `PATCH /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove item from cart
- `DELETE /cart` - Clear entire cart

### Orders
- `GET /orders` - Get user's orders (or all orders for admin)
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order (checkout)
- `PATCH /orders/:id/status` - Update order status (admin only)

### Payment
- `POST /payment/create-intent` - Create payment intent
- `GET /payment/public-key` - Get PayMongo public key
- `GET /payment/intent/:id` - Get payment intent status
- `POST /payment/webhook` - PayMongo webhook endpoint

### Contact
- `POST /contact` - Submit contact form message

## Database

The SQLite database (`ecommerce.db`) will be automatically created in the backend directory when you first run the application.

### Database Schema
- **Users** - User accounts and authentication
- **Products** - Product catalog
- **CartItems** - Shopping cart items
- **Orders** - Customer orders
- **OrderItems** - Order line items
- **ContactMessages** - Contact form submissions

## Payment Integration

This application uses PayMongo for payment processing. See [PAYMONGO_SETUP.md](./PAYMONGO_SETUP.md) for detailed setup instructions.

### Supported Payment Methods
- Credit/Debit Cards
- GCash
- GrabPay

## Environment Variables

### Backend (.env)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration (default: 7d)
- `PORT` - Backend server port (default: 3001)
- `PAYMONGO_SECRET_KEY` - PayMongo secret API key
- `PAYMONGO_PUBLIC_KEY` - PayMongo public API key
- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port
- `EMAIL_USER` - Email address for sending emails
- `EMAIL_PASS` - Email password or app password

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_PAYMONGO_PUBLIC_KEY` - PayMongo public key

## Scripts

### Backend
- `npm run start:dev` - Start development server with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build for production

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Enable HTTPS in production
- Keep dependencies updated
- Use environment-specific API keys (test vs. production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub or use the contact form in the application.
