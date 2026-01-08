# Mini E-Commerce System

A full-stack e-commerce application with NestJS backend and React frontend.

## Project Structure

```
ecommerce-app/
├── backend/          # NestJS API with TypeScript and SQLite
├── frontend/         # React.js frontend
└── README.md
```

## Backend

Built with:
- NestJS
- TypeScript
- SQLite (TypeORM)
- Validation for stock and price

### Setup

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on `http://localhost:3001`

### API Endpoints

- **Products**: CRUD operations at `/products`
- **Cart**: CRUD operations at `/cart`
- **Orders**: Create and list orders at `/orders`

## Frontend

Built with:
- React.js
- React Router
- Axios for API calls

### Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## Features

- ✅ Product CRUD with stock and price validation
- ✅ Order cart with quantity management
- ✅ Order creation with stock validation
- ✅ Price validation on checkout
- ✅ Modern, responsive UI

## Getting Started

1. Start the backend server:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. Open `http://localhost:3000` in your browser

## Database

The SQLite database (`ecommerce.db`) will be automatically created in the backend directory when you first run the application.
