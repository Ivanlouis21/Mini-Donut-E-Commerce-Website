import React, { useState } from 'react';
import '../styles/pages/HomePage.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string;
}

interface ProductsSectionProps {
  products: Product[];
  loading: boolean;
  addingToCart: { [key: number]: boolean };
  onAddToCart: (productId: number) => void;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({ 
  products, 
  loading, 
  addingToCart, 
  onAddToCart 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Classic' },
    { id: 'featured', name: 'Best Sellers' },
    { id: 'new', name: 'Beverages' },
    { id: 'popular', name: 'Others' },
  ];

  // Classic products
  const classicProducts = [
    { name: 'Choco', image: '/Assets/Products/choco c.jpg', price: 'P300', description: 'A delicious chocolate-flavored dessert' },
    { name: 'Cookies and Cream', image: '/Assets/Products/CookiesNcream.jpg', price: 'P300', description: 'A delicious cookies and cream dessert' },
    { name: 'Snow Deli', image: '/Assets/Products/Snow Deli.jpg', price: 'P300', description: 'A delicious white chocolate dessert' },
    { name: 'Tot Mallows Glaze', image: '/Assets/Products/choco mallows.jpg', price: 'P300', description: 'A delicious glazed dessert' },
    { name: 'Matcha', image: '/Assets/Products/Matcha.jpg', price: 'P300', description: 'A delicious matcha-flavored dessert' },
    { name: 'Ube Deli', image: '/Assets/Products/Classic Ube.jpg', price: 'P300', description: 'A delicious ube-flavored dessert' },
  ];

  // Best Sellers products
  const bestSellersProducts = [
    { name: 'Maple Glazed', image: '/Assets/Products/Best Seller/Maple Glazed.jpg', price: 'P300', description: 'A delicious maple glazed dessert' },
    { name: 'Honey Glazed', image: '/Assets/Products/Best Seller/honeyg c.jpg', price: 'P300', description: 'A delicious honey glazed dessert' },
    { name: 'Ensaymada', image: '/Assets/Products/Best Seller/ensaymada.jpg', price: 'P300', description: 'A delicious ensaymada dessert' },
    { name: 'Coffee Donut Deli', image: '/Assets/Products/Best Seller/Coffee Donut Deli.jpg', price: 'P300', description: 'A delicious coffee donut dessert' },
    { name: 'Berry Deli', image: '/Assets/Products/Best Seller/Berry Deli.jpg', price: 'P300', description: 'A delicious berry dessert' },
    { name: 'Bavarian', image: '/Assets/Products/Best Seller/bavarian.jpg', price: 'P300', description: 'A delicious Bavarian dessert' },
  ];

  // Beverages products
  const beveragesProducts = [
    { name: 'Berry & Creme', image: '/Assets/Products/Drinks/berry & creme.jpg', price: 'P300', description: 'A refreshing berry and creme drink' },
    { name: 'Choco Chip Frappe', image: '/Assets/Products/Drinks/choco chip frappe.jpg', price: 'P300', description: 'A delicious chocolate chip frappe' },
    { name: 'CNC Frappe', image: '/Assets/Products/Drinks/cnc frappe.jpg', price: 'P300', description: 'A delicious cookies and cream frappe' },
    { name: 'Iced Caramel Macchiato', image: '/Assets/Products/Drinks/iced caramel macchiato.jpg', price: 'P300', description: 'A refreshing iced caramel macchiato' },
    { name: 'Iced Coffee', image: '/Assets/Products/Drinks/iced coffeee.jpg', price: 'P300', description: 'A classic iced coffee' },
    { name: 'Lemonade Iced Tea', image: '/Assets/Products/Drinks/Lemonade Iced Tea.jpg', price: 'P300', description: 'A refreshing lemonade iced tea' },
  ];

  // Other Products
  const otherProducts = [
    { name: 'Banana Chocolate Chip Muffins', image: '/Assets/Products/Other Products/Banana Chocolate Chip Muffins.jpg', price: 'P300', description: 'Delicious banana chocolate chip muffins' },
    { name: 'Cinnamon Roll', image: '/Assets/Products/Other Products/cinnamon roll.jpg', price: 'P300', description: 'A sweet cinnamon roll' },
    { name: 'Eclairs', image: '/Assets/Products/Other Products/eclairs.jpg', price: 'P300', description: 'Delicious eclairs' },
    { name: 'Macaroons', image: '/Assets/Products/Other Products/macaroons.jpg', price: 'P300', description: 'Colorful macaroons' },
    { name: 'Mallows', image: '/Assets/Products/Other Products/mallows.jpg', price: 'P300', description: 'Sweet mallows' },
    { name: 'Red Velvet Cookies', image: '/Assets/Products/Other Products/Red Velvet Cookies.jpg', price: 'P300', description: 'Delicious red velvet cookies' },
  ];

  const getCategoryProducts = () => {
    switch (selectedCategory) {
      case 'all':
        return classicProducts;
      case 'featured':
        return bestSellersProducts;
      case 'new':
        return beveragesProducts;
      case 'popular':
        return otherProducts;
      default:
        return classicProducts;
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'all':
        return 'Classic';
      case 'featured':
        return 'Best Sellers';
      case 'new':
        return 'Beverages';
      case 'popular':
        return 'Others';
      default:
        return 'Classic';
    }
  };

  return (
    <section id="products-section" className="menu-section">
      <div className="menu-container">
        <h2 className="menu-title">PRODUCTS</h2>
        
        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Category Products Section */}
        {(selectedCategory === 'all' || selectedCategory === 'featured' || selectedCategory === 'new' || selectedCategory === 'popular') && (
          <div className="classic-section" key={selectedCategory}>
            <div className="title-box category-title-animate">
              <h2>{getCategoryTitle()}</h2>
            </div>
            <div className="classic-container category-products-animate">
              {getCategoryProducts().map((product, index) => (
                <div 
                  key={`${selectedCategory}-${index}`}
                  className="box category-item-animate" 
                  data-name={product.name} 
                  data-price={product.price} 
                  data-description={product.description}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img src={product.image} alt={product.name} />
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ProductsSection;
