const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'ecommerce.db');

if (!fs.existsSync(dbPath)) {
  console.log('Database not found.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('Verifying product categories...\n');

// Best Seller products
const bestSellerProducts = ['Maple Glazed', 'Honey Glazed', 'Ensaymada', 'Coffee Donut Deli', 'Berry Deli', 'Bavarian'];

// Beverages products
const beveragesProducts = ['Berry & Creme', 'Choco Chip Frappe', 'CNC Frappe', 'Iced Caramel Macchiato', 'Iced Coffee', 'Lemonade Iced Tea'];

db.all('SELECT name, category FROM product ORDER BY category, name', (err, products) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    process.exit(1);
  }

  console.log('=== Best Seller Products ===');
  const bestSellers = products.filter(p => p.category === 'Best Seller');
  bestSellers.forEach(p => {
    console.log(`✓ ${p.name} - ${p.category}`);
  });
  console.log(`\nTotal Best Seller products: ${bestSellers.length}\n`);

  console.log('=== Beverages Products ===');
  const beverages = products.filter(p => p.category === 'Beverages');
  beverages.forEach(p => {
    console.log(`✓ ${p.name} - ${p.category}`);
  });
  console.log(`\nTotal Beverages products: ${beverages.length}\n`);

  console.log('=== All Products by Category ===');
  const grouped = {};
  products.forEach(p => {
    const cat = p.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p.name);
  });

  Object.keys(grouped).sort().forEach(cat => {
    console.log(`\n${cat} (${grouped[cat].length} products):`);
    grouped[cat].forEach(name => console.log(`  - ${name}`));
  });

  db.close();
});
