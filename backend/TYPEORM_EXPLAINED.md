# What is TypeORM?

TypeORM is an **ORM (Object-Relational Mapping)** library for TypeScript and JavaScript. It's a tool that helps you work with databases using TypeScript/JavaScript objects instead of writing raw SQL queries.

## The Problem TypeORM Solves

### Without TypeORM (Raw SQL):
```typescript
// You'd have to write SQL queries manually
const result = await db.query(
  'SELECT * FROM orders WHERE userId = ? AND status = ?',
  [userId, 'pending']
);

// Manual data mapping
const orders = result.rows.map(row => ({
  id: row.id,
  userId: row.user_id,
  total: parseFloat(row.total),
  status: row.status,
  createdAt: new Date(row.created_at),
}));
```

**Problems:**
- ❌ Write SQL strings (error-prone)
- ❌ Manual type conversion
- ❌ No TypeScript type safety
- ❌ Manual relationship handling
- ❌ Different syntax for different databases

### With TypeORM:
```typescript
// Clean, type-safe, database-agnostic
const orders = await orderRepository.find({
  where: { userId, status: 'pending' },
  relations: ['items', 'items.product'],
});
```

**Benefits:**
- ✅ TypeScript classes instead of SQL
- ✅ Automatic type conversion
- ✅ Full TypeScript type safety
- ✅ Automatic relationship handling
- ✅ Works with multiple databases (SQLite, PostgreSQL, MySQL, etc.)

---

## How TypeORM Works

### 1. **Entities = Database Tables**

An **Entity** is a TypeScript class that represents a database table.

**Example from your codebase:**

```typescript
// backend/src/products/entities/product.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()  // ← This decorator tells TypeORM: "This is a database table"
export class Product {
  @PrimaryGeneratedColumn()  // ← Auto-incrementing primary key
  id: number;

  @Column()  // ← Regular column (VARCHAR in SQL)
  name: string;

  @Column('text')  // ← TEXT column type
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })  // ← DECIMAL(10,2)
  price: number;

  @Column()
  stock: number;
}
```

**TypeORM automatically creates this SQL table:**
```sql
CREATE TABLE "product" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" VARCHAR NOT NULL,
  "description" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "stock" INTEGER NOT NULL,
  "imageUrl" VARCHAR,
  "category" VARCHAR
);
```

### 2. **Repositories = Database Operations**

A **Repository** is an object that provides methods to interact with a specific entity/table.

**TypeORM provides these methods automatically:**

```typescript
// Inject repository in your service
@InjectRepository(Product)
private productRepository: Repository<Product>

// Now you can use repository methods:
await this.productRepository.find()           // SELECT * FROM product
await this.productRepository.findOne({ id: 1 })  // SELECT * FROM product WHERE id = 1
await this.productRepository.save(product)    // INSERT or UPDATE
await this.productRepository.delete(id)       // DELETE FROM product WHERE id = ?
await this.productRepository.create(data)     // Creates entity (doesn't save yet)
```

---

## Real Examples from Your Codebase

### Example 1: Creating an Order

**Your Service Code:**
```typescript
// backend/src/orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    // Create entity instance (doesn't save to DB yet)
    const order = this.orderRepository.create({
      userId,
      total: 100.00,
      status: 'pending',
      items: orderItems,
    });

    // Save to database
    const savedOrder = await this.orderRepository.save(order);
    
    // TypeORM generates and executes:
    // INSERT INTO "order" (userId, total, status, createdAt) 
    // VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    // Returns: { id: 123, userId: 1, total: 100.00, ... }
  }
}
```

**What TypeORM Does Behind the Scenes:**
```sql
-- TypeORM automatically generates:
INSERT INTO "order" ("userId", "total", "status", "createdAt")
VALUES (1, 100.00, 'pending', CURRENT_TIMESTAMP);

-- And for related items (cascade: true):
INSERT INTO "order_item" ("orderId", "productId", "quantity", "price")
VALUES (123, 1, 2, 5.99);
```

### Example 2: Finding Orders with Relations

**Your Service Code:**
```typescript
async findAll(userId: number): Promise<Order[]> {
  return await this.orderRepository.find({
    where: { userId },
    relations: ['items', 'items.product'],  // ← Load related data
    order: { createdAt: 'DESC' },
  });
}
```

**What TypeORM Generates:**
```sql
-- TypeORM automatically generates JOIN queries:
SELECT 
  o.*, 
  oi.*, 
  p.*
FROM "order" o
LEFT JOIN "order_item" oi ON o.id = oi."orderId"
LEFT JOIN "product" p ON oi."productId" = p.id
WHERE o."userId" = 1
ORDER BY o."createdAt" DESC;
```

**Result:** You get a fully populated Order object with all related data:
```typescript
{
  id: 123,
  userId: 1,
  total: 11.98,
  status: 'pending',
  items: [
    {
      id: 456,
      quantity: 2,
      price: 5.99,
      product: {
        id: 1,
        name: 'Chocolate Donut',
        price: 5.99,
        stock: 10
      }
    }
  ]
}
```

---

## Key TypeORM Concepts

### 1. **Decorators** (How you define entities)

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@Entity()` | Marks class as database table | `@Entity() export class Product` |
| `@Column()` | Regular column | `@Column() name: string` |
| `@PrimaryGeneratedColumn()` | Auto-increment ID | `@PrimaryGeneratedColumn() id: number` |
| `@ManyToOne()` | Foreign key (many-to-one) | `@ManyToOne(() => User) user: User` |
| `@OneToMany()` | One-to-many relationship | `@OneToMany(() => OrderItem) items: OrderItem[]` |
| `@JoinColumn()` | Specify foreign key column name | `@JoinColumn({ name: 'userId' })` |

### 2. **Relationships**

**Many-to-One** (Order → User):
```typescript
// Order entity
@ManyToOne(() => User)
@JoinColumn({ name: 'userId' })
user: User;
```
*Translation: Many orders belong to one user*

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
*Translation: One order has many order items*

**`cascade: true`** means: When you save an order, automatically save its items too.

### 3. **Repository Methods**

| Method | SQL Equivalent | Purpose |
|--------|---------------|---------|
| `find()` | `SELECT * FROM table` | Get all records |
| `findOne({ where })` | `SELECT * FROM table WHERE ...` | Get one record |
| `save(entity)` | `INSERT` or `UPDATE` | Save entity (creates or updates) |
| `create(data)` | - | Create entity instance (doesn't save) |
| `delete(id)` | `DELETE FROM table WHERE id = ?` | Delete record |
| `update(id, data)` | `UPDATE table SET ... WHERE id = ?` | Update record |
| `count({ where })` | `SELECT COUNT(*) FROM table WHERE ...` | Count records |

### 4. **Query Options**

```typescript
await repository.find({
  where: { status: 'pending' },        // WHERE clause
  relations: ['items', 'user'],        // JOIN related tables
  order: { createdAt: 'DESC' },        // ORDER BY
  take: 10,                            // LIMIT
  skip: 0,                             // OFFSET (for pagination)
});
```

---

## TypeORM Configuration in Your Project

**In `app.module.ts`:**
```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',                      // Database type
  database: 'ecommerce.db',            // SQLite file name
  entities: [Product, Order, User, ...], // Entity classes
  synchronize: true,                   // Auto-create tables (dev only!)
})
```

**What `synchronize: true` does:**
- ✅ Automatically creates tables if they don't exist
- ✅ Automatically updates table structure if entities change
- ⚠️ **Only use in development!** (Use migrations in production)

---

## TypeORM vs Raw SQL: Side-by-Side Comparison

### Scenario: Get all pending orders for a user with their items and products

**With Raw SQL:**
```typescript
const query = `
  SELECT 
    o.id as order_id,
    o.total as order_total,
    o.status as order_status,
    oi.id as item_id,
    oi.quantity as item_quantity,
    oi.price as item_price,
    p.id as product_id,
    p.name as product_name,
    p.price as product_price
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE o.user_id = ? AND o.status = ?
  ORDER BY o.created_at DESC
`;

const result = await db.query(query, [userId, 'pending']);

// Manual data transformation
const ordersMap = new Map();
result.rows.forEach(row => {
  if (!ordersMap.has(row.order_id)) {
    ordersMap.set(row.order_id, {
      id: row.order_id,
      total: parseFloat(row.order_total),
      status: row.order_status,
      items: []
    });
  }
  
  if (row.item_id) {
    ordersMap.get(row.order_id).items.push({
      id: row.item_id,
      quantity: row.item_quantity,
      price: parseFloat(row.item_price),
      product: {
        id: row.product_id,
        name: row.product_name,
        price: parseFloat(row.product_price)
      }
    });
  }
});

const orders = Array.from(ordersMap.values());
```

**With TypeORM:**
```typescript
const orders = await orderRepository.find({
  where: { userId, status: 'pending' },
  relations: ['items', 'items.product'],
  order: { createdAt: 'DESC' },
});

// That's it! TypeORM handles everything:
// - SQL generation
// - JOIN queries
// - Data transformation
// - Type conversion
// - Relationship mapping
```

**Result:** Same data, but TypeORM version is:
- ✅ **10x less code**
- ✅ **Type-safe** (TypeScript knows the structure)
- ✅ **Database-agnostic** (works with SQLite, PostgreSQL, MySQL, etc.)
- ✅ **Less error-prone** (no SQL syntax errors)

---

## Advanced TypeORM Features

### 1. **Transactions**
```typescript
await this.orderRepository.manager.transaction(async (manager) => {
  const order = await manager.save(Order, orderData);
  await manager.save(OrderItem, orderItems);
  // If any operation fails, all are rolled back
});
```

### 2. **Query Builder** (Complex queries)
```typescript
const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.items', 'item')
  .leftJoinAndSelect('item.product', 'product')
  .where('order.userId = :userId', { userId })
  .andWhere('order.status = :status', { status: 'pending' })
  .orderBy('order.createdAt', 'DESC')
  .getMany();
```

### 3. **Migrations** (Production database changes)
```bash
# Generate migration
npm run typeorm migration:generate -- -n AddUserEmail

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

---

## Why Your Project Uses TypeORM

### Benefits for Your E-Commerce App:

1. **Type Safety**: TypeScript catches errors at compile time
   ```typescript
   // ❌ TypeScript error: Property 'nmae' doesn't exist
   product.nmae = 'Donut';
   
   // ✅ Correct
   product.name = 'Donut';
   ```

2. **Database Independence**: Can switch from SQLite to PostgreSQL easily
   ```typescript
   // Just change config - code stays the same!
   type: 'postgres',  // Instead of 'sqlite'
   host: 'localhost',
   port: 5432,
   ```

3. **Automatic Relationship Handling**: No manual JOIN management
   ```typescript
   // TypeORM automatically handles:
   // - JOIN queries
   // - Data nesting
   // - Loading related entities
   relations: ['items', 'items.product']
   ```

4. **Less Boilerplate**: No manual SQL or data mapping

5. **Built-in Features**: 
   - Pagination
   - Sorting
   - Filtering
   - Relationships
   - Transactions
   - Migrations

---

## Common TypeORM Patterns in Your Codebase

### Pattern 1: Find with Relations
```typescript
// Get order with all related data
const order = await this.orderRepository.findOne({
  where: { id },
  relations: ['items', 'items.product', 'user'],
});
```

### Pattern 2: Create and Save
```typescript
// Create entity instance
const order = this.orderRepository.create({
  userId,
  total,
  status: 'pending',
});

// Save to database
const savedOrder = await this.orderRepository.save(order);
```

### Pattern 3: Update Existing
```typescript
// Find first
const order = await this.orderRepository.findOne({ where: { id } });
order.status = 'completed';

// Save updates
await this.orderRepository.save(order);
```

### Pattern 4: Conditional Queries
```typescript
// Find orders with optional filters
const orders = await this.orderRepository.find({
  where: userId ? { userId } : {},  // Optional filter
  order: { createdAt: 'DESC' },
  take: limit || 10,
  skip: offset || 0,
});
```

---

## Summary

**TypeORM is:**
- An ORM (Object-Relational Mapping) library
- A bridge between TypeScript/JavaScript and databases
- A tool that converts classes to SQL tables and queries
- Type-safe, database-agnostic, and developer-friendly

**In your project, TypeORM:**
- ✅ Defines database tables as TypeScript classes (Entities)
- ✅ Provides repositories for database operations
- ✅ Handles relationships automatically
- ✅ Generates SQL queries for you
- ✅ Works with SQLite (can easily switch to other databases)

**Think of TypeORM as:**
> A translator that converts your TypeScript code into SQL queries, so you can work with databases using familiar object-oriented patterns instead of raw SQL strings.
