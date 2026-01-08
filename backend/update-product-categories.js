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

// Product category mappings
const categoryMappings = {
  // Classic products
  'Choco': 'Classic',
  'Cookies and Cream': 'Classic',
  'Snow Deli': 'Classic',
  'Tot Mallows Glaze': 'Classic',
  'Matcha': 'Classic',
  'Ube Deli': 'Classic',
  
  // Best Seller products
  'Maple Glazed': 'Best Seller',
  'Honey Glazed': 'Best Seller',
  'Ensaymada': 'Best Seller',
  'Coffee Donut Deli': 'Best Seller',
  'Berry Deli': 'Best Seller',
  'Bavarian': 'Best Seller',
  
  // Beverages
  'Berry & Creme': 'Beverages',
  'Choco Chip Frappe': 'Beverages',
  'CNC Frappe': 'Beverages',
  'Iced Caramel Macchiato': 'Beverages',
  'Iced Coffee': 'Beverages',
  'Lemonade Iced Tea': 'Beverages',
  
  // Others
  'Banana Chocolate Chip Muffins': 'Others',
  'Cinnamon Roll': 'Others',
  'Eclairs': 'Others',
  'Macaroons': 'Others',
  'Mallows': 'Others',
  'Red Velvet Cookies': 'Others',
};

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

    // Get all products
    db.all('SELECT id, name FROM product', (err, products) => {
      if (err) {
        console.error('Error fetching products:', err);
        db.close();
        process.exit(1);
      }

      if (products.length === 0) {
        console.log('No products found in database.');
        db.close();
        return;
      }

      console.log(`Found ${products.length} products. Updating categories...\n`);

      let updated = 0;
      let notFound = 0;

      // Update each product with its category
      products.forEach((product) => {
        const category = categoryMappings[product.name];
        
        if (category) {
          db.run(
            'UPDATE product SET category = ? WHERE id = ?',
            [category, product.id],
            (err) => {
              if (err) {
                console.error(`Error updating ${product.name}:`, err);
              } else {
                updated++;
                console.log(`✓ Updated: ${product.name} -> ${category}`);
              }

              // Check if all updates are done
              if (updated + notFound === products.length) {
                console.log(`\n✅ Successfully updated ${updated} products with categories!`);
                if (notFound > 0) {
                  console.log(`⚠️  ${notFound} products were not found in the category mappings.`);
                }
                db.close();
              }
            }
          );
        } else {
          notFound++;
          console.log(`⚠️  No category mapping found for: ${product.name}`);
          
          // Check if all updates are done
          if (updated + notFound === products.length) {
            console.log(`\n✅ Successfully updated ${updated} products with categories!`);
            if (notFound > 0) {
              console.log(`⚠️  ${notFound} products were not found in the category mappings.`);
            }
            db.close();
          }
        }
      });
    });
  });
});
