# Activity 9: Mini E-Commerce API + UI

## Title of Activity
**Mini E-Commerce Website - Crazy Mini Donuts Online Store**

## Short Description

A full-stack e-commerce application with NestJS backend and React frontend, featuring user authentication, payment processing, and admin management. This is an online store for a mini donut shop that allows customers to browse products, manage shopping carts, place orders, and make payments. It includes a comprehensive admin dashboard for managing products, orders, and customer inquiries.

**Key Features:**
- **Customer Features**: User registration/login, product browsing with category filtering, shopping cart management, order placement and tracking, payment processing (PayMongo), and contact form
- **Admin Features**: Dashboard with revenue statistics, product management (CRUD operations), order management with status tracking (Kanban-style layout), and customer message management

## Screenshots

> **Note**: Please refer to `ACTIVITY_DOCUMENTATION.md` for detailed screenshot instructions and API examples.

### UI Screenshots
- Homepage/Product listing
- Shopping cart
- Checkout/Payment
- Order tracking
- Admin dashboard
- Admin product management
- Admin order management

### API Examples
- API root endpoint response
- Product listing API
- User authentication API
- Swagger API documentation

See `ACTIVITY_DOCUMENTATION.md` for complete screenshot guidelines and API examples.

## 📖 Instructions on How to Run the Project

This guide will walk you through setting up and running the Mini Donut E-Commerce website step by step. Follow these instructions carefully to get the project up and running on your local machine.

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
- **Node.js** - JavaScript runtime environment
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
- **CSS3** - Modern styling with gradients, animations, and responsive design

## Features

### User Features
- ✅ User registration and authentication
- ✅ Login/Logout functionality
- ✅ Password reset via email
- ✅ User profile management
- ✅ Product browsing and search
  - Category filtering
  - Stock availability indicators
  - Product details modal
- ✅ Shopping cart with quantity management
  - Real-time stock validation
  - Quantity adjustment
  - Cart persistence
- ✅ Order placement and tracking
  - Order status sections: Pending, Ready for Pickup, Completed
  - Pagination support (5 orders per page per section)
  - Order details modal view
  - Order history tracking
- ✅ Payment processing (PayMongo)
  - Credit/Debit Cards
  - GCash
  - GrabPay
  - Webhook support for automatic order creation
  - Duplicate order prevention
- ✅ Contact form for customer support

### Admin Features
- ✅ Admin dashboard with real-time statistics
  - Total revenue tracking (from completed orders)
  - Order count by status (Pending, Ready for Pickup, Completed, Total Orders)
- ✅ Product management (CRUD)
  - Add, edit, delete products
  - Image upload support
  - Stock and price management
  - Category filtering
- ✅ Order management
  - Kanban-style layout for order status tracking
  - Separate views for active orders (Pending, Ready for Pickup) and Order History (Completed)
  - Pagination support (5 orders per page)
  - Status updates: Pending → Ready for Pickup → Completed
  - Order details modal with customer information
- ✅ Customer suggestions/contact management
  - View and manage customer messages
  - Mark messages as read/unread
- ✅ Stock and price validation

## 🚀 Quick Start Guide

### 📋 Prerequisites

Before you begin, make sure you have the following installed on your computer:

1. **Node.js** (version 14 or higher)
   - Download from: [https://nodejs.org/](https://nodejs.org/)
   - To check if installed: Open terminal/command prompt and run `node --version`
   
2. **npm** (comes with Node.js)
   - To check if installed: Run `npm --version`
   
3. **Git** (optional, for cloning the repository)
   - Download from: [https://git-scm.com/](https://git-scm.com/)

---

## 🖥️ Step 1: Backend Setup

The backend is the API server that handles all data processing, authentication, and database operations.

### Step 1.1: Navigate to Backend Folder

Open your terminal/command prompt and navigate to the backend directory:

```bash
cd backend
```

> **Note for Windows Users:** If you're using Windows, use PowerShell or Command Prompt. The commands work the same way.

### Step 1.2: Install Backend Dependencies

Install all required packages for the backend:

```bash
npm install
```

⏱️ **This may take 2-5 minutes** - npm is downloading all the required packages.

> **What's happening?** npm reads the `package.json` file and downloads all the libraries the backend needs to run (NestJS, TypeORM, SQLite, etc.)

✅ **Success looks like:** You'll see a list of installed packages, and no error messages.

### Step 1.3: Create Environment Configuration File

Create a `.env` file in the `backend` folder to configure the application settings.

**On Windows:**
```powershell
New-Item -Path ".env" -ItemType File
```

**On Mac/Linux:**
```bash
touch .env
```

Then open the `.env` file with any text editor (Notepad, VS Code, etc.) and add the following:

```env
# Required: JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_to_anything_random
JWT_EXPIRES_IN=7d

# Required: Server Port
PORT=3001

# Optional: Admin User Configuration (auto-created on first startup if no admin exists)
# If not provided, defaults to: admin@example.com / admin123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Optional: PayMongo Configuration (for payment features)
# Get these from https://dashboard.paymongo.com/
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here

# Optional: Email Configuration (for password reset feature)
# For Gmail, you'll need an "App Password" - see Gmail settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

> **Important:** 
> - Replace `your_super_secret_jwt_key_change_this_to_anything_random` with any random string (e.g., `mySecretKey123!@#`)
> - The PayMongo and Email settings are **optional** - the app will work without them, but payment and password reset won't function
> - Don't worry if you don't have PayMongo keys yet - you can add them later

### Step 1.4: Start the Backend Server

Start the development server:

```bash
npm run start:dev
```

✅ **Success looks like:**
```
[Nest] 12345  - 12/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 12/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 12/01/2024, 10:00:00 AM     LOG [RoutesResolver] {/api}
✓ Admin user created automatically on startup
  Email: admin@example.com
  Password: admin123
  Role: admin
  ⚠️  IMPORTANT: Change the default password after first login!
[Nest] 12345  - 12/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started on http://localhost:3001
Backend server running on http://localhost:3001
Swagger documentation available at http://localhost:3001/api-docs
```

🌐 **Backend is now running at:** `http://localhost:3001`

> **Keep this terminal window open!** The backend needs to keep running for the application to work.

> **✨ Admin Auto-Creation:** If no admin user exists, one will be automatically created on startup! Check the console output above for the admin credentials (default: `admin@example.com` / `admin123`). You can customize these in your `.env` file.

### Step 1.5: (Optional) Add Sample Products

In a **NEW terminal window** (keep the backend running), navigate to the backend folder and run:

```bash
cd backend
node seed-products.js
```

✅ **Success:** You'll see messages like "✓ Inserted: Choco", "✓ Inserted: Cookies and Cream", etc.

> **What's this doing?** This adds sample donut products to your database so you have items to display and purchase.

### Step 1.6: (Optional) Create Additional Admin Accounts

**Good news!** An admin account is automatically created when the server starts (see Step 1.4). You can skip this step if you're using the default admin.

If you want to create additional admin accounts, you can use the utility script:

```bash
node create-admin.js
```

Or create a custom admin account:

```bash
node create-admin.js admin@example.com adminpassword123 Admin User
```

> **Note:** The `create-admin.js` script requires the backend server to be running, and it needs an existing admin account to promote users. Since an admin is auto-created on startup, you can use that admin account to create more.

> **💡 Tip:** Check your server startup logs (Step 1.4) to see the automatically created admin credentials.

---

## 🎨 Step 2: Frontend Setup

The frontend is the user interface that customers see in their web browser.

### Step 2.1: Open a New Terminal Window

Open a **new terminal/command prompt window** (keep the backend terminal running).

Navigate to the frontend directory:

```bash
cd frontend
```

> **Note:** Make sure you're in the project root first. If you're still in the `backend` folder, go back with `cd ..` then `cd frontend`.

### Step 2.2: Install Frontend Dependencies

Install all required packages for the frontend:

```bash
npm install
```

⏱️ **This may take 3-5 minutes** - npm is downloading React and all frontend dependencies.

✅ **Success:** You'll see a list of installed packages without errors.

### Step 2.3: Create Frontend Environment File

Create a `.env` file in the `frontend` folder:

**On Windows:**
```powershell
New-Item -Path ".env" -ItemType File
```

**On Mac/Linux:**
```bash
touch .env
```

Open the `.env` file and add:

```env
# Required: Backend API URL
REACT_APP_API_URL=http://localhost:3001

# Optional: PayMongo Public Key (for payment features)
REACT_APP_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
```

> **Important:** 
> - Make sure `REACT_APP_API_URL` matches your backend port (default is 3001)
> - The PayMongo key is optional - payments won't work without it, but you can test everything else

### Step 2.4: Start the Frontend Development Server

Start the React development server:

```bash
npm start
```

⏱️ **This takes 10-30 seconds** - React is compiling your application.

✅ **Success:** Your default web browser should automatically open to `http://localhost:3000`

> **If the browser doesn't open automatically:** Manually navigate to `http://localhost:3000` in your web browser.

---

## 🎉 You're All Set!

If everything worked correctly, you should now see:

✅ **Backend running** at `http://localhost:3001` (API server)
✅ **Frontend running** at `http://localhost:3000` (Website)

### 🌐 Access Points:

- **Customer Website:** `http://localhost:3000`
- **Admin Dashboard:** `http://localhost:3000/admin` (requires admin login)
- **API Documentation (Swagger):** `http://localhost:3001/api` (if Swagger is enabled)

---

## 🧪 Testing the Application

1. **Browse Products:** Visit `http://localhost:3000` to see the product catalog
2. **Register an Account:** Click "Register" to create a customer account
3. **Add to Cart:** Click on products to add them to your shopping cart
4. **Admin Login:** Use your admin credentials to access `/admin` dashboard

---

## ⚠️ Troubleshooting

### Backend Issues

**Problem:** `npm install` fails
- **Solution:** Make sure you have Node.js v14+ installed. Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again.

**Problem:** Port 3001 is already in use
- **Solution:** Either stop the other application using port 3001, or change `PORT=3002` in your `.env` file (don't forget to update frontend `.env` too).

**Problem:** Database errors
- **Solution:** Delete `backend/ecommerce.db` file and restart the server - it will create a fresh database.

**Problem:** `node seed-products.js` fails
- **Solution:** Make sure the backend server has been started at least once (to create the database), then try again.

### Frontend Issues

**Problem:** `npm start` fails
- **Solution:** Make sure you're in the `frontend` directory. Delete `node_modules` and `package-lock.json`, then run `npm install` again.

**Problem:** Frontend can't connect to backend
- **Solution:** 
  1. Check that backend is running on port 3001
  2. Verify `REACT_APP_API_URL=http://localhost:3001` in `frontend/.env`
  3. Restart the frontend server after changing `.env` file

**Problem:** Page shows "Network Error" or "Cannot GET /"
- **Solution:** Make sure both backend and frontend servers are running. Check the terminal windows for error messages.

### General Issues

**Problem:** Changes not appearing
- **Solution:** 
  - Backend: The dev server auto-reloads. If not, press `Ctrl+C` to stop, then `npm run start:dev` again.
  - Frontend: React auto-reloads. Try refreshing your browser (`F5` or `Ctrl+R`).

**Problem:** Still having issues?
- **Solution:** 
  1. Make sure all prerequisites are installed correctly
  2. Check that both terminal windows show servers running
  3. Try clearing browser cache
  4. Restart both servers
  5. Check the terminal output for specific error messages

---

## 📝 Important Notes

- **Keep both terminals open** - Backend and Frontend need to run simultaneously
- **Database is created automatically** - The first time you start the backend, it creates `ecommerce.db` in the backend folder
- **Environment files are required** - Make sure both `.env` files exist with correct values
- **Admin features require admin account** - Create an admin user to access the admin dashboard
- **Payment features are optional** - The app works without PayMongo, but checkout won't process payments

---

## 🛑 Stopping the Application

To stop the servers:
1. Go to each terminal window
2. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac)
3. Confirm with `Y` if prompted

To start again later:
1. Run backend: `cd backend` → `npm run start:dev`
2. Run frontend: `cd frontend` → `npm start`

---

## 📚 Next Steps

- Read `PAYMONGO_SETUP.md` for payment integration guide
- Check `backend/WEBHOOK_SETUP.md` for webhook configuration
- Explore the API documentation at `http://localhost:3001/api` (if Swagger is enabled)

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

### Payment Flow
- Client-side payment intent creation
- Webhook support for automatic order confirmation
- Duplicate order prevention (both client and server-side)
- Fallback order creation if webhooks are not configured

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

## Recent Updates

### Version 2.0 (Latest)

#### Admin Panel Enhancements
- ✨ Refactored admin pages into separate components for better maintainability
- ✨ Added comprehensive admin dashboard with revenue and order statistics
- ✨ Implemented Kanban-style order management layout
- ✨ Separated Order History from active orders management
- ✨ Added pagination to all admin order pages (5 items per page)
- ✨ Enhanced UI/UX with modern gradients, shadows, and animations
- ✨ Updated currency display to use Philippine Peso (₱) throughout

#### User Experience Improvements
- ✨ Added pagination to user orders page (5 items per section)
- ✨ Improved order status tracking with separate sections
- ✨ Added order details modal for better order information display
- ✨ Enhanced order cards with better visual hierarchy

#### Bug Fixes & Performance
- 🐛 Fixed duplicate order creation issue during checkout
- 🐛 Implemented robust duplicate prevention on both client and server
- 🐛 Removed auto-refresh from orders page for better user control
- 🐛 Fixed pagination reset logic when orders change status

## Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Enable HTTPS in production
- Keep dependencies updated
- Use environment-specific API keys (test vs. production)
- Duplicate order prevention mechanisms in place

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub or use the contact form in the application.
