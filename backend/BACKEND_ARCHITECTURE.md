# Backend Architecture & Data Flow Guide

This document explains how the NestJS backend works, including how data flows from HTTP requests to the database and back.

## Table of Contents
1. [NestJS Architecture Overview](#nestjs-architecture-overview)
2. [Request Flow - Complete Journey](#request-flow---complete-journey)
3. [Components Breakdown](#components-breakdown)
4. [Complete Example: Creating an Order](#complete-example-creating-an-order)
5. [Database Layer (TypeORM)](#database-layer-typeorm)
6. [Authentication Flow](#authentication-flow)
7. [Module System & Dependency Injection](#module-system--dependency-injection)

---

## NestJS Architecture Overview

NestJS follows a **layered architecture** pattern:

```
HTTP Request
    ↓
[Controller] ← Handles HTTP requests/responses
    ↓
[Guard] ← Authentication/Authorization (optional)
    ↓
[Service] ← Business logic & data processing
    ↓
[Repository] ← Database operations (via TypeORM)
    ↓
SQLite Database
```

### Key Concepts:
- **Controllers**: Handle HTTP requests, route them to services
- **Services**: Contain business logic, interact with database
- **Entities**: Database table definitions (models)
- **DTOs (Data Transfer Objects)**: Define data structure for validation
- **Guards**: Protect routes (authentication/authorization)
- **Modules**: Organize related components together

---

## Request Flow - Complete Journey

### Example: User Creates an Order

Let's trace a complete request from frontend to database and back:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (React)                                             │
│    User clicks "Proceed to Checkout"                            │
│    → axios.post('/orders', { items: [...] })                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓ HTTP POST Request
                          ↓ Headers: { Authorization: 'Bearer <JWT_TOKEN>' }
                          ↓ Body: { items: [{ productId: 1, quantity: 2, price: 5.99 }] }
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MAIN.TS (Bootstrap)                                          │
│    - Server starts on port 3001                                 │
│    - Enables CORS, validation pipes, Swagger docs               │
│    - Listens for incoming requests                              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. APP.MODULE.TS                                                │
│    - Root module that imports all feature modules               │
│    - Configures TypeORM with SQLite database                    │
│    - Registers: ProductsModule, OrdersModule, AuthModule, etc.  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ORDERS.MODULE.TS                                             │
│    - Imports TypeORM repositories for Order & OrderItem         │
│    - Imports ProductsModule and CartModule (for dependencies)   │
│    - Registers OrdersController and OrdersService               │
│    - Exports OrdersService (so other modules can use it)        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ORDERS.CONTROLLER.TS                                         │
│    @Post() create(@Body() createOrderDto, @Req() req)           │
│                                                                  │
│    What happens:                                                 │
│    a) Route decorator: @Post() → Handles POST /orders           │
│    b) Guard: @UseGuards(JwtAuthGuard) → Validates JWT token     │
│    c) Extracts userId from JWT: req.user.sub                    │
│    d) Calls: ordersService.create(createOrderDto, userId)       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. JWT_AUTH.GUARD.TS (Guard)                                    │
│    canActivate(context)                                         │
│                                                                  │
│    What happens:                                                 │
│    a) Extracts token from: Authorization: Bearer <token>        │
│    b) Verifies token using JwtService                           │
│    c) If valid: Adds payload to req.user                        │
│    d) If invalid: Throws UnauthorizedException                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (if authenticated)
┌─────────────────────────────────────────────────────────────────┐
│ 7. VALIDATION PIPE (Global)                                     │
│    - Validates createOrderDto against CreateOrderDto class      │
│    - Checks: items is array, productId/quantity/price are valid │
│    - Transforms data types if needed                            │
│    - If invalid: Returns 400 Bad Request                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓ (if valid)
┌─────────────────────────────────────────────────────────────────┐
│ 8. ORDERS.SERVICE.TS                                            │
│    async create(createOrderDto, userId)                         │
│                                                                  │
│    Business Logic:                                               │
│    a) Check for duplicate orders (within 30 seconds)            │
│    b) Validate each item:                                       │
│       - Check product exists (productsService.findOne)          │
│       - Check stock availability                                │
│       - Validate price matches                                  │
│    c) Update product stock (productsService.update)             │
│    d) Calculate total price                                     │
│    e) Create OrderItem entities                                 │
│    f) Create Order entity with items                            │
│    g) Save to database (orderRepository.save)                   │
│    h) Clear user's cart (cartService.clear)                     │
│    i) Return order with relations (items, products)             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. TYPEORM REPOSITORY                                           │
│    orderRepository.save(order)                                  │
│                                                                  │
│    What happens:                                                 │
│    a) TypeORM maps Order entity to SQL table                    │
│    b) Generates SQL: INSERT INTO order (...)                    │
│    c) Saves order items (cascade: true saves related items)     │
│    d) Returns saved entity with generated ID                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. SQLITE DATABASE                                             │
│     - Executes SQL INSERT statements                            │
│     - Stores order in 'order' table                             │
│     - Stores order items in 'order_item' table                  │
│     - Updates 'product' table (stock reduction)                 │
│     - Updates 'cart_item' table (clears cart)                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. RESPONSE FLOW (backwards)                                   │
│     SQLite → Repository → Service → Controller → HTTP Response  │
│                                                                  │
│     Final Response:                                              │
│     HTTP 201 Created                                             │
│     {                                                            │
│       "id": 123,                                                 │
│       "userId": 1,                                               │
│       "total": 11.98,                                            │
│       "status": "pending",                                       │
│       "items": [...],                                            │
│       "createdAt": "2024-01-15T10:30:00Z"                       │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 12. FRONTEND RECEIVES RESPONSE                                  │
│     - React component receives order data                       │
│     - Updates UI (shows success message)                        │
│     - Navigates to /orders page                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components Breakdown

### 1. **Controllers** (`*.controller.ts`)
**Purpose**: Handle HTTP requests and responses

**Location**: `backend/src/orders/orders.controller.ts`

**Key Decorators**:
- `@Controller('orders')` - Defines base route `/orders`
- `@Post()` - Handles POST requests
- `@Get()` - Handles GET requests
- `@UseGuards(JwtAuthGuard)` - Protects route with authentication
- `@Body()` - Extracts request body
- `@Param()` - Extracts URL parameters
- `@Req()` - Access full request object

**Example**:
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const userId = (req.user as any).sub;  // Extract from JWT
    return this.ordersService.create(createOrderDto, userId);
  }
}
```

**What Controllers Do**:
- ✅ Receive HTTP requests
- ✅ Validate input (via DTOs)
- ✅ Extract data (body, params, headers)
- ✅ Call appropriate service methods
- ✅ Return HTTP responses (JSON)
- ❌ **DO NOT** contain business logic
- ❌ **DO NOT** directly access database

---

### 2. **Services** (`*.service.ts`)
**Purpose**: Contain business logic and coordinate data operations

**Location**: `backend/src/orders/orders.service.ts`

**Key Features**:
- Injected dependencies via constructor
- Use repositories to interact with database
- Can call other services
- Handle business rules and validation

**Example**:
```typescript
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private productsService: ProductsService,  // Use other service
    private cartService: CartService,          // Use other service
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    // 1. Validate input
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // 2. Business logic: Check for duplicates
    const recentOrders = await this.orderRepository.find({...});

    // 3. Validate each item
    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      if (item.quantity > product.stock) {
        throw new BadRequestException('Not enough stock');
      }
      // Update stock
      product.stock -= item.quantity;
      await this.productsService.update(productId, { stock: product.stock });
    }

    // 4. Create and save order
    const order = this.orderRepository.create({
      userId,
      total: calculatedTotal,
      status: 'pending',
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    // 5. Side effects: Clear cart
    await this.cartService.clear(userId);

    // 6. Return with relations
    return await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product'],
    });
  }
}
```

**What Services Do**:
- ✅ Contain business logic
- ✅ Validate business rules
- ✅ Coordinate between multiple repositories/services
- ✅ Handle transactions (if needed)
- ✅ Transform data before saving/returning
- ❌ **DO NOT** handle HTTP directly
- ❌ **DO NOT** know about request/response objects

---

### 3. **Entities** (`*.entity.ts`)
**Purpose**: Define database table structure

**Location**: `backend/src/orders/entities/order.entity.ts`

**Key Decorators**:
- `@Entity()` - Marks class as database table
- `@PrimaryGeneratedColumn()` - Auto-incrementing ID
- `@Column()` - Regular column
- `@ManyToOne()` - Foreign key relationship
- `@OneToMany()` - One-to-many relationship

**Example**:
```typescript
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];
}
```

**What Entities Do**:
- ✅ Define database schema
- ✅ Map TypeScript classes to SQL tables
- ✅ Define relationships between tables
- ✅ Provide type safety for database operations
- ❌ **DO NOT** contain business logic
- ❌ **DO NOT** handle HTTP requests

---

### 4. **DTOs** (Data Transfer Objects) (`dto/*.dto.ts`)
**Purpose**: Define and validate data structure for API requests

**Location**: `backend/src/orders/dto/create-order.dto.ts`

**Key Decorators**:
- `@IsArray()`, `@IsNumber()`, `@IsString()` - Validation rules
- `@Min()`, `@Max()`, `@IsEmail()` - Additional validation
- `@Type()` - Type transformation
- `@ApiProperty()` - Swagger documentation

**Example**:
```typescript
export class CreateOrderDto {
  @ApiProperty({ 
    type: [OrderItemDto], 
    description: 'Array of order items'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

class OrderItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 5.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}
```

**What DTOs Do**:
- ✅ Define expected request structure
- ✅ Validate incoming data
- ✅ Transform data types
- ✅ Provide API documentation (Swagger)
- ❌ **DO NOT** contain business logic
- ❌ **DO NOT** interact with database

**Validation Flow**:
```
Request Body → ValidationPipe → DTO Validation → Controller
     ↓
Invalid data → 400 Bad Request (before reaching controller)
Valid data → Controller receives validated DTO
```

---

### 5. **Guards** (`guards/*.guard.ts`)
**Purpose**: Protect routes (authentication/authorization)

**Location**: `backend/src/auth/guards/jwt-auth.guard.ts`

**Example**:
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    // Extract token
    const token = authHeader.substring(7);

    try {
      // Verify token
      const payload = this.jwtService.verify(token);
      request.user = payload;  // Attach user info to request
      return true;  // Allow request to proceed
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

**Guard Types**:
- **JwtAuthGuard**: Validates JWT token (authentication)
- **AdminGuard**: Checks if user is admin (authorization)

**Guard Execution Order**:
```
Request → Guard 1 → Guard 2 → Controller
              ↓
        If fails → 401 Unauthorized
```

---

### 6. **Modules** (`*.module.ts`)
**Purpose**: Organize related components together

**Location**: `backend/src/orders/orders.module.ts`

**Key Properties**:
- `imports`: Other modules this module depends on
- `controllers`: HTTP controllers in this module
- `providers`: Services, guards, etc. in this module
- `exports`: What this module exposes to other modules

**Example**:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),  // Register entities
    ProductsModule,  // Import ProductsModule to use ProductsService
    CartModule,      // Import CartModule to use CartService
    AuthModule,      // Import AuthModule for guards
  ],
  controllers: [OrdersController],  // Register controller
  providers: [OrdersService],       // Register service
  exports: [OrdersService],         // Export so other modules can use it
})
export class OrdersModule {}
```

**Module Dependency Graph**:
```
AppModule (Root)
  ├── OrdersModule
  │     ├── ProductsModule (imports)
  │     ├── CartModule (imports)
  │     └── AuthModule (imports)
  ├── ProductsModule
  ├── CartModule
  ├── AuthModule
  └── PaymentModule
```

---

## Complete Example: Creating an Order

Let's walk through creating an order with actual code flow:

### Step 1: Frontend Request
```typescript
// frontend/src/pages/Cart.tsx
const orderItems = cartItems.map(item => ({
  productId: item.productId,
  quantity: item.quantity,
  price: parseFloat(item.product.price),
}));

await ordersAPI.create({ items: orderItems });
// → POST http://localhost:3001/orders
// → Headers: { Authorization: 'Bearer <JWT_TOKEN>' }
// → Body: { items: [{ productId: 1, quantity: 2, price: 5.99 }] }
```

### Step 2: Controller Receives Request
```typescript
// backend/src/orders/orders.controller.ts
@Post()
@UseGuards(JwtAuthGuard)  // ← Validates JWT token first
create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
  // ValidationPipe automatically validates createOrderDto
  // If invalid → 400 Bad Request (before reaching here)
  
  const userId = (req.user as any).sub;  // Extracted from JWT by guard
  return this.ordersService.create(createOrderDto, userId);
}
```

### Step 3: Service Processes Business Logic
```typescript
// backend/src/orders/orders.service.ts
async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
  // 1. Validate input
  if (!createOrderDto.items || createOrderDto.items.length === 0) {
    throw new BadRequestException('Order must have at least one item');
  }

  // 2. Check for duplicates (prevent webhook + client double creation)
  const thirtySecondsAgo = new Date(Date.now() - 30000);
  const recentOrders = await this.orderRepository.find({
    where: { userId },
    relations: ['items'],
    order: { createdAt: 'DESC' },
    take: 5,
  });
  // ... duplicate check logic ...

  // 3. Validate and process each item
  let total = 0;
  const orderItems: OrderItem[] = [];

  for (const item of createOrderDto.items) {
    // Get product from database
    const product = await this.productsService.findOne(item.productId);
    
    // Validate stock
    if (item.quantity > product.stock) {
      throw new BadRequestException(`Not enough stock for ${product.name}`);
    }

    // Validate price
    const priceDifference = Math.abs(item.price - product.price);
    if (priceDifference > 0.01) {
      throw new BadRequestException(`Price mismatch for ${product.name}`);
    }

    // Update stock
    product.stock -= item.quantity;
    await this.productsService.update(item.productId, { stock: product.stock });

    // Calculate total
    total += item.price * item.quantity;

    // Create order item entity
    const orderItem = this.orderItemRepository.create({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    });
    orderItems.push(orderItem);
  }

  // 4. Create order entity
  const order = this.orderRepository.create({
    userId,
    total,
    status: 'pending',
    items: orderItems,  // Cascade save will save items too
  });

  // 5. Save to database
  const savedOrder = await this.orderRepository.save(order);

  // 6. Clear cart (side effect)
  await this.cartService.clear(userId);

  // 7. Return order with full relations
  return await this.orderRepository.findOne({
    where: { id: savedOrder.id },
    relations: ['items', 'items.product'],  // Load related data
  });
}
```

### Step 4: TypeORM Saves to Database
```typescript
// TypeORM automatically:
// 1. Maps Order entity to SQL table
// 2. Generates SQL: INSERT INTO "order" (userId, total, status, createdAt) VALUES (?, ?, ?, ?)
// 3. Saves order items (cascade: true)
// 4. Returns saved entity with generated ID
```

### Step 5: Response Returns to Frontend
```json
HTTP 201 Created
{
  "id": 123,
  "userId": 1,
  "total": 11.98,
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "items": [
    {
      "id": 456,
      "orderId": 123,
      "productId": 1,
      "quantity": 2,
      "price": 5.99,
      "product": {
        "id": 1,
        "name": "Chocolate Donut",
        "price": 5.99,
        "stock": 8  // Updated stock
      }
    }
  ]
}
```

---

## Database Layer (TypeORM)

### What is TypeORM?
TypeORM is an **ORM (Object-Relational Mapping)** that maps TypeScript classes to database tables.

### How It Works:

**1. Entity Definition** (TypeScript):
```typescript
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];
}
```

**2. TypeORM Maps to SQL Table**:
```sql
CREATE TABLE "order" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**3. Repository Pattern**:
```typescript
// Inject repository
@InjectRepository(Order)
private orderRepository: Repository<Order>

// Use repository methods
await this.orderRepository.find({ where: { userId: 1 } });
await this.orderRepository.save(order);
await this.orderRepository.delete(id);
```

**4. TypeORM Generates SQL**:
```typescript
// TypeScript:
await this.orderRepository.find({ where: { userId: 1 } });

// Generated SQL:
SELECT * FROM "order" WHERE "userId" = 1;
```

### Relationships:

**One-to-Many** (Order → OrderItems):
```typescript
// Order entity
@OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
items: OrderItem[];

// OrderItem entity
@ManyToOne(() => Order, order => order.items)
@JoinColumn({ name: 'orderId' })
order: Order;
```

**Many-to-One** (Order → User):
```typescript
// Order entity
@ManyToOne(() => User)
@JoinColumn({ name: 'userId' })
user: User;
```

### Querying with Relations:
```typescript
// Load order with items and products
const order = await this.orderRepository.findOne({
  where: { id: 1 },
  relations: ['items', 'items.product', 'user'],
});

// This generates JOIN queries:
// SELECT o.*, oi.*, p.*, u.*
// FROM order o
// LEFT JOIN order_item oi ON o.id = oi.orderId
// LEFT JOIN product p ON oi.productId = p.id
// LEFT JOIN user u ON o.userId = u.id
// WHERE o.id = 1
```

---

## Authentication Flow

### 1. User Login
```
POST /auth/login
Body: { email: "user@example.com", password: "password123" }
    ↓
AuthService.validateUser() → Checks credentials
    ↓
AuthService.login() → Creates JWT token
    ↓
Response: { access_token: "eyJhbGciOiJIUzI1NiIs..." }
```

### 2. Protected Request
```
GET /orders
Headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..." }
    ↓
JwtAuthGuard.canActivate()
    ↓
Extract token from header
    ↓
JwtService.verify(token) → Validates signature & expiration
    ↓
If valid: Attach payload to req.user = { sub: 1, email: "..." }
    ↓
Controller receives request with req.user populated
```

### 3. Guard Types

**JwtAuthGuard** (Authentication):
- Checks if user is logged in
- Verifies JWT token
- Extracts user info

**AdminGuard** (Authorization):
- Checks if user has admin role
- Must be used AFTER JwtAuthGuard

```typescript
@UseGuards(JwtAuthGuard, AdminGuard)  // Both guards execute
@Get('admin/all')
findAllAdmin() {
  // Only accessible by authenticated admin users
}
```

---

## Module System & Dependency Injection

### Dependency Injection (DI)

NestJS uses **dependency injection** to manage dependencies:

```typescript
// Service depends on Repository
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,  // ← Injected by NestJS
    private productsService: ProductsService,     // ← Injected by NestJS
  ) {}
}
```

**How It Works**:
1. NestJS reads constructor parameters
2. Looks up providers in modules
3. Creates instances automatically
4. Injects them into constructor

### Module Registration

**OrdersModule** registers what it provides and needs:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),  // Provides repositories
    ProductsModule,  // Needs ProductsService
    CartModule,      // Needs CartService
  ],
  controllers: [OrdersController],
  providers: [OrdersService],  // Provides OrdersService
  exports: [OrdersService],    // Exports so others can use
})
export class OrdersModule {}
```

**ProductsModule** exports ProductsService:
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],  // ← Exported so OrdersModule can use it
})
export class ProductsModule {}
```

### Dependency Graph

```
OrdersModule needs:
  ├── OrderRepository (from TypeOrmModule.forFeature)
  ├── OrderItemRepository (from TypeOrmModule.forFeature)
  ├── ProductsService (from ProductsModule - must be exported)
  └── CartService (from CartModule - must be exported)

ProductsModule provides:
  └── ProductsService (exported)

CartModule provides:
  └── CartService (exported)
```

---

## Summary: Data Exchange Flow

### Complete Request → Response Flow:

1. **HTTP Request** arrives at server (port 3001)
2. **Routing** matches URL to controller method
3. **Guards** execute (authentication/authorization)
4. **ValidationPipe** validates request body against DTO
5. **Controller** extracts data and calls service
6. **Service** executes business logic:
   - Validates business rules
   - Calls other services if needed
   - Uses repositories to query/update database
7. **Repository** (TypeORM) generates SQL queries
8. **Database** (SQLite) executes SQL and returns data
9. **Repository** maps SQL results to TypeScript entities
10. **Service** processes and returns data
11. **Controller** formats response
12. **HTTP Response** sent back to client (JSON)

### Key Principles:

✅ **Separation of Concerns**:
- Controllers handle HTTP
- Services handle business logic
- Repositories handle database

✅ **Dependency Injection**:
- Components declare dependencies
- NestJS automatically provides them

✅ **Single Responsibility**:
- Each class has one job
- Easy to test and maintain

✅ **Type Safety**:
- TypeScript + DTOs ensure data integrity
- TypeORM ensures database consistency

This architecture makes the backend:
- **Maintainable**: Clear separation of concerns
- **Testable**: Each component can be tested independently
- **Scalable**: Easy to add new features
- **Type-safe**: TypeScript catches errors at compile time
