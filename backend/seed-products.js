const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'ecommerce.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('Database not found. Please start the server first to create the database.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// Products to seed
const products = [
  // Classic products
  { name: 'Choco', description: 'A delicious chocolate-flavored dessert', price: 280, stock: 100, imageUrl: '/Assets/Products/choco c.jpg', category: 'Classic' },
  { name: 'Cookies and Cream', description: 'A delicious cookies and cream dessert', price: 320, stock: 100, imageUrl: '/Assets/Products/CookiesNcream.jpg', category: 'Classic' },
  { name: 'Snow Deli', description: 'A delicious white chocolate dessert', price: 290, stock: 100, imageUrl: '/Assets/Products/Snow Deli.jpg', category: 'Classic' },
  { name: 'Tot Mallows Glaze', description: 'A delicious glazed dessert', price: 350, stock: 100, imageUrl: '/Assets/Products/choco mallows.jpg', category: 'Classic' },
  { name: 'Matcha', description: 'A delicious matcha-flavored dessert', price: 310, stock: 100, imageUrl: '/Assets/Products/Matcha.jpg', category: 'Classic' },
  { name: 'Ube Deli', description: 'A delicious ube-flavored dessert', price: 300, stock: 100, imageUrl: '/Assets/Products/Classic Ube.jpg', category: 'Classic' },
  
  // Best Sellers
  { name: 'Maple Glazed', description: 'A delicious maple glazed dessert', price: 340, stock: 100, imageUrl: '/Assets/Products/Best Seller/Maple Glazed.jpg', category: 'Best Seller' },
  { name: 'Honey Glazed', description: 'A delicious honey glazed dessert', price: 330, stock: 100, imageUrl: '/Assets/Products/Best Seller/honeyg c.jpg', category: 'Best Seller' },
  { name: 'Ensaymada', description: 'A delicious ensaymada dessert', price: 320, stock: 100, imageUrl: '/Assets/Products/Best Seller/ensaymada.jpg', category: 'Best Seller' },
  { name: 'Coffee Donut Deli', description: 'A delicious coffee donut dessert', price: 350, stock: 100, imageUrl: '/Assets/Products/Best Seller/Coffee Donut Deli.jpg', category: 'Best Seller' },
  { name: 'Berry Deli', description: 'A delicious berry dessert', price: 340, stock: 100, imageUrl: '/Assets/Products/Best Seller/Berry Deli.jpg', category: 'Best Seller' },
  { name: 'Bavarian', description: 'A delicious Bavarian dessert', price: 330, stock: 100, imageUrl: '/Assets/Products/Best Seller/bavarian.jpg', category: 'Best Seller' },
  
  // Beverages
  { name: 'Berry & Creme', description: 'A refreshing berry and creme drink', price: 220, stock: 100, imageUrl: '/Assets/Products/Drinks/berry & creme.jpg', category: 'Beverages' },
  { name: 'Choco Chip Frappe', description: 'A delicious chocolate chip frappe', price: 240, stock: 100, imageUrl: '/Assets/Products/Drinks/choco chip frappe.jpg', category: 'Beverages' },
  { name: 'CNC Frappe', description: 'A delicious cookies and cream frappe', price: 240, stock: 100, imageUrl: '/Assets/Products/Drinks/cnc frappe.jpg', category: 'Beverages' },
  { name: 'Iced Caramel Macchiato', description: 'A refreshing iced caramel macchiato', price: 220, stock: 100, imageUrl: '/Assets/Products/Drinks/iced caramel macchiato.jpg', category: 'Beverages' },
  { name: 'Iced Coffee', description: 'A classic iced coffee', price: 200, stock: 100, imageUrl: '/Assets/Products/Drinks/iced coffeee.jpg', category: 'Beverages' },
  { name: 'Lemonade Iced Tea', description: 'A refreshing lemonade iced tea', price: 210, stock: 100, imageUrl: '/Assets/Products/Drinks/Lemonade Iced Tea.jpg', category: 'Beverages' },
  
  // Other Products
  { name: 'Banana Chocolate Chip Muffins', description: 'Delicious banana chocolate chip muffins', price: 280, stock: 100, imageUrl: '/Assets/Products/Other Products/Banana Chocolate Chip Muffins.jpg', category: 'Others' },
  { name: 'Cinnamon Roll', description: 'A sweet cinnamon roll', price: 290, stock: 100, imageUrl: '/Assets/Products/Other Products/cinnamon roll.jpg', category: 'Others' },
  { name: 'Eclairs', description: 'Delicious eclairs', price: 300, stock: 100, imageUrl: '/Assets/Products/Other Products/eclairs.jpg', category: 'Others' },
  { name: 'Macaroons', description: 'Colorful macaroons', price: 320, stock: 100, imageUrl: '/Assets/Products/Other Products/macaroons.jpg', category: 'Others' },
  { name: 'Mallows', description: 'Sweet mallows', price: 250, stock: 100, imageUrl: '/Assets/Products/Other Products/mallows.jpg', category: 'Others' },
  { name: 'Red Velvet Cookies', description: 'Delicious red velvet cookies', price: 280, stock: 100, imageUrl: '/Assets/Products/Other Products/Red Velvet Cookies.jpg', category: 'Others' },
];

db.serialize(() => {
  // Check if products table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='product'", (err, row) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      process.exit(1);
    }

    if (!row) {
      console.log('Product table does not exist. Please start the server first to create the database schema.');
      db.close();
      process.exit(1);
    }

    // Clear existing products
    db.run('DELETE FROM product', (err) => {
      if (err) {
        console.error('Error clearing products:', err);
        db.close();
        process.exit(1);
      }

      console.log('Cleared existing products...');

      // Insert products
      const stmt = db.prepare('INSERT INTO product (name, description, price, stock, imageUrl, category) VALUES (?, ?, ?, ?, ?, ?)');
      
      let inserted = 0;
      products.forEach((product) => {
        stmt.run([product.name, product.description, product.price, product.stock, product.imageUrl, product.category], (err) => {
          if (err) {
            console.error(`Error inserting ${product.name}:`, err);
          } else {
            inserted++;
            console.log(`✓ Inserted: ${product.name}`);
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing statement:', err);
        } else {
          console.log(`\n✅ Successfully seeded ${inserted} products!`);
        }
        db.close();
      });
    });
  });
});
