import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { cartAPI, productsAPI } from '../services/api';
import '../styles/components/Products.css';
import '../styles/pages/HomePage.css';

interface BackendProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

const OrderNow: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<BackendProduct | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [backendProducts, setBackendProducts] = useState<BackendProduct[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from backend
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getAll();
        setBackendProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Listen for product updates from admin
    const handleProductUpdate = async () => {
      try {
        const response = await productsAPI.getAll();
        const updatedProducts = response.data;
        setBackendProducts(updatedProducts);
        
        // If a product modal is open, update the selected product with latest stock
        setSelectedProduct(prevSelected => {
          if (prevSelected) {
            const updatedProduct = updatedProducts.find((p: BackendProduct) => p.id === prevSelected.id);
            if (updatedProduct) {
              const previousStock = prevSelected.stock;
              // If stock was 0 and now has stock, show a message
              if (previousStock === 0 && updatedProduct.stock > 0) {
                toast.success(`${updatedProduct.name} is now available!`);
              }
              // If trying to add more than available stock, adjust quantity
              setQuantity(prevQty => {
                if (prevQty > updatedProduct.stock) {
                  toast.info(`Quantity adjusted to available stock: ${updatedProduct.stock}`);
                  return updatedProduct.stock;
                }
                return prevQty;
              });
              return updatedProduct;
            }
          }
          return prevSelected;
        });
      } catch (error) {
        console.error('Failed to refresh products:', error);
      }
    };
    window.addEventListener('productUpdated', handleProductUpdate);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
    };
  }, []);

  const handleProductClick = (product: BackendProduct) => {
    setSelectedProduct(product);
    setQuantity(1); // Reset quantity when opening modal
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setQuantity(1); // Reset quantity when closing modal
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (selectedProduct && newQuantity > selectedProduct.stock) {
      toast.warning(`Only ${selectedProduct.stock} available in stock`);
      setQuantity(selectedProduct.stock);
      return;
    }
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('You need to login to add items to cart. Redirecting to login page...', {
        onClose: () => navigate('/login'),
        autoClose: 2000,
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Check stock availability
    if (quantity > selectedProduct.stock) {
      toast.error(`Only ${selectedProduct.stock} available in stock`);
      setQuantity(selectedProduct.stock);
      return;
    }

    try {
      setAddingToCart(true);
      await cartAPI.addItem({ productId: selectedProduct.id, quantity: quantity });
      toast.success(`${quantity} ${selectedProduct.name}${quantity > 1 ? 's' : ''} added to cart!`);
      handleCloseModal();
      // Refresh products to update stock
      const response = await productsAPI.getAll();
      setBackendProducts(response.data);
      // Dispatch event to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add product to cart';
      toast.error(errorMessage);
      // If stock error, refresh products
      if (errorMessage.includes('stock')) {
        const response = await productsAPI.getAll();
        setBackendProducts(response.data);
      }
    } finally {
      setAddingToCart(false);
    }
  };
  // Group products by category
  const normalizeCategory = (category: string | undefined): string => {
    if (!category) return 'Others';
    const normalized = category.trim();
    if (normalized.toLowerCase() === 'classic') return 'Classic';
    if (normalized.toLowerCase() === 'best seller' || normalized.toLowerCase() === 'bestseller') return 'Best Seller';
    if (normalized.toLowerCase() === 'beverages' || normalized.toLowerCase() === 'beverage') return 'Beverages';
    if (normalized.toLowerCase() === 'others' || normalized.toLowerCase() === 'other') return 'Others';
    return normalized;
  };

  const groupProductsByCategory = () => {
    const grouped: { [key: string]: BackendProduct[] } = {};
    backendProducts.forEach(product => {
      const category = normalizeCategory(product.category);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    return grouped;
  };

  const categories = ['Classic', 'Best Seller', 'Beverages', 'Others'];

  const renderProductSection = (title: string, products: BackendProduct[], key?: string) => {
    if (products.length === 0) return null;
    
    return (
      <div key={key} className="ordernow-section">
        <div className="ordernow-title-box">
          <h2>{title}</h2>
        </div>
        <div className="ordernow-container">
          {products.map((product) => (
            <div 
              key={product.id}
              className={`ordernow-box ${product.stock === 0 ? 'out-of-stock' : ''}`}
              onClick={() => product.stock > 0 && handleProductClick(product)}
            >
              <div className="ordernow-box-image-wrapper">
                <img 
                  src={(() => {
                    if (!product.imageUrl) return '/Assets/Products/placeholder.jpg';
                    if (product.imageUrl.startsWith('http')) return product.imageUrl;
                    if (product.imageUrl.startsWith('/Assets/')) return product.imageUrl;
                    if (product.imageUrl.startsWith('/uploads/')) return `http://localhost:3001${product.imageUrl}`;
                    return `http://localhost:3001${product.imageUrl}`;
                  })()}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/Assets/Products/placeholder.jpg';
                  }}
                />
                {product.stock === 0 && (
                  <div className="out-of-stock-overlay">
                    <span>Out of Stock</span>
                  </div>
                )}
                <div className={`stock-badge ${product.stock === 0 ? 'stock-badge-out' : product.stock <= 10 ? 'stock-badge-low' : 'stock-badge-ok'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Not Available'}
                </div>
              </div>
              <div className="ordernow-box-info">
                <span className="ordernow-box-name">{product.name}</span>
                <span className="ordernow-box-price">₱{parseFloat(product.price.toString()).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="products-page ordernow-page">
      <style>{`
        .ordernow-page .products-container {
          max-width: 100%;
          width: 100%;
          padding: 3rem 2rem;
          margin: 0;
        }
        
        .ordernow-section {
          margin-bottom: 4rem;
          width: 100%;
        }
        
        .ordernow-title-box {
          background: #ffffff;
          border: none;
          border-radius: 24px;
          margin-bottom: 2rem;
          text-align: center;
          padding: 16px 40px;
          width: 100%;
          max-width: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 
                      0 2px 8px rgba(0, 0, 0, 0.04),
                      0 1px 2px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;
        }
        
        .ordernow-title-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ec4899 0%, #f472b6 25%, #8b5cf6 50%, #6366f1 75%, #3b82f6 100%);
          box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
        }
        
        .ordernow-title-box h2 {
          font-size: 2.5rem;
          color: #2d3748;
          font-family: "Libre Baskerville", serif;
          margin: 0;
          position: relative;
          z-index: 1;
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        
        .ordernow-container {
          display: flex;
          gap: 2rem;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 1rem 0;
          justify-content: flex-start;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        
        .ordernow-box {
          background: #ffffff;
          border: none;
          border-radius: 12px;
          overflow: hidden;
          transition: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: calc((100% - 10rem) / 6);
          min-width: 180px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        
        .ordernow-box:hover {
          z-index: 10;
          transform: scale(1.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          animation: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ordernow-box:hover ~ .ordernow-box {
          opacity: 0.6;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ordernow-container:hover .ordernow-box:not(:hover) {
          opacity: 0.6;
          transform: scale(0.95);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ordernow-box img {
          width: 100%;
          height: 280px;
          object-fit: cover;
          display: block;
          transition: none;
        }
        
        .ordernow-box:hover img {
          transform: scale(1.1);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ordernow-box-image-wrapper {
          position: relative;
          width: 100%;
          height: 280px;
          overflow: hidden;
        }
        
        .ordernow-box-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .stock-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
          z-index: 3;
        }
        
        .stock-badge-ok {
          background: rgba(16, 185, 129, 0.9);
        }
        
        .stock-badge-low {
          background: rgba(245, 158, 11, 0.9);
        }
        
        .stock-badge-out {
          background: rgba(239, 68, 68, 0.9);
          font-weight: 700;
        }
        
        .out-of-stock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          border-radius: 12px 12px 0 0;
        }
        
        .out-of-stock-overlay span {
          background: #ef4444;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .ordernow-box.out-of-stock {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }
        
        .ordernow-box.out-of-stock:hover {
          transform: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .ordernow-box.out-of-stock .ordernow-box-name {
          color: #9ca3af;
        }
        
        .ordernow-box-info {
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #ffffff;
        }
        
        .ordernow-box-name {
          text-align: center;
          font-weight: 600;
          color: #1e293b;
          font-size: 1.1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .ordernow-box-price {
          text-align: center;
          font-weight: 700;
          color: #ec4899;
          font-size: 1rem;
        }
        
        @media (max-width: 1400px) {
          .ordernow-box {
            width: calc((100% - 8rem) / 5);
          }
        }
        
        @media (max-width: 1200px) {
          .ordernow-box {
            width: calc((100% - 6rem) / 4);
          }
        }
        
        @media (max-width: 900px) {
          .ordernow-box {
            width: calc((100% - 4rem) / 3);
          }
        }
        
        @media (max-width: 600px) {
          .ordernow-box {
            width: calc((100% - 2rem) / 2);
            min-width: 150px;
          }
          
          .ordernow-title-box h2 {
            font-size: 2rem;
          }
        }
        
        /* Modal Styles */
        .ordernow-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .ordernow-modal-content {
          background: #ffffff;
          border-radius: 20px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .ordernow-modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.5);
          color: #ffffff;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }
        
        .ordernow-modal-close:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: rotate(90deg);
        }
        
        .ordernow-modal-image {
          width: 100%;
          height: 350px;
          overflow: hidden;
          border-radius: 20px 20px 0 0;
        }
        
        .ordernow-modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .ordernow-modal-info {
          padding: 2rem;
        }
        
        .ordernow-modal-info h2 {
          font-size: 2rem;
          color: #1e293b;
          margin-bottom: 1rem;
          font-family: "Libre Baskerville", serif;
        }
        
        .ordernow-modal-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ec4899;
          margin-bottom: 1.5rem;
        }
        
        .ordernow-modal-description {
          font-size: 1.1rem;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .ordernow-modal-quantity {
          margin-bottom: 2rem;
        }
        
        .ordernow-modal-quantity label {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }
        
        .ordernow-quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .ordernow-quantity-btn {
          width: 45px;
          height: 45px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          color: #1e293b;
          border-radius: 8px;
          font-size: 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ordernow-quantity-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #ec4899;
          color: #ec4899;
          transform: scale(1.05);
        }
        
        .ordernow-quantity-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .ordernow-quantity-input {
          width: 80px;
          height: 45px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: #1e293b;
          background: #ffffff;
          transition: all 0.3s ease;
        }
        
        .ordernow-quantity-input:focus {
          outline: none;
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        }
        
        .ordernow-modal-add-btn {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
        }
        
        .ordernow-modal-add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
        }
        
        .ordernow-modal-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .ordernow-modal-stock {
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f9fafb;
        }
        
        .stock-indicator {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          text-align: center;
        }
        
        .stock-indicator.in-stock {
          color: #10b981;
        }
        
        .stock-indicator.low-stock {
          color: #f59e0b;
        }
        
        .stock-indicator.out-of-stock {
          color: #ef4444;
        }
        
        @media (max-width: 600px) {
          .ordernow-modal-content {
            width: 95%;
            max-height: 85vh;
          }
          
          .ordernow-modal-image {
            height: 250px;
          }
          
          .ordernow-modal-info {
            padding: 1.5rem;
          }
          
          .ordernow-modal-info h2 {
            font-size: 1.5rem;
          }
          
          .ordernow-modal-price {
            font-size: 1.25rem;
          }
        }
      `}</style>
      <section className="products-hero">
        <div className="products-hero-content">
          <h1 className="products-hero-title">
            Our <span className="highlight">Mini Donuts</span> & Beverages
          </h1>
          <p className="products-hero-description">
            Browse our full menu of freshly made mini donuts and perfectly paired drinks. 
            Mix and match your favorites for the ultimate sweet treat experience.
          </p>
        </div>
      </section>

      <div className="container products-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#6b7280' }}>
            Loading products...
          </div>
        ) : (
          <>
            {categories.map(category => {
              const grouped = groupProductsByCategory();
              const categoryProducts = grouped[category] || [];
              return renderProductSection(category, categoryProducts, category);
            })}
            {backendProducts.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#6b7280' }}>
                No products available at the moment.
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {showModal && selectedProduct && (
        <div className="ordernow-modal-backdrop" onClick={handleCloseModal}>
          <div className="ordernow-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="ordernow-modal-close" onClick={handleCloseModal}>×</button>
            <div className="ordernow-modal-image">
              <img 
                src={(() => {
                  if (!selectedProduct.imageUrl) return '/Assets/Products/placeholder.jpg';
                  if (selectedProduct.imageUrl.startsWith('http')) return selectedProduct.imageUrl;
                  if (selectedProduct.imageUrl.startsWith('/Assets/')) return selectedProduct.imageUrl;
                  if (selectedProduct.imageUrl.startsWith('/uploads/')) return `http://localhost:3001${selectedProduct.imageUrl}`;
                  return `http://localhost:3001${selectedProduct.imageUrl}`;
                })()}
                alt={selectedProduct.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Assets/Products/placeholder.jpg';
                }}
              />
            </div>
            <div className="ordernow-modal-info">
              <h2>{selectedProduct.name}</h2>
              <p className="ordernow-modal-price">₱{parseFloat(selectedProduct.price.toString()).toFixed(2)}</p>
              <p className="ordernow-modal-description">{selectedProduct.description}</p>
              
              {/* Stock Info */}
              <div className="ordernow-modal-stock">
                <span className={`stock-indicator ${selectedProduct.stock > 10 ? 'in-stock' : selectedProduct.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                  {selectedProduct.stock > 10 
                    ? `✓ ${selectedProduct.stock} available in stock` 
                    : selectedProduct.stock > 0 
                    ? `⚠ Only ${selectedProduct.stock} left in stock` 
                    : '✗ Not Available - Out of Stock'}
                </span>
              </div>
              
              {/* Quantity Selector */}
              <div className="ordernow-modal-quantity">
                <label>Quantity:</label>
                <div className="ordernow-quantity-controls">
                  <button
                    className="ordernow-quantity-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      handleQuantityChange(newQuantity);
                    }}
                    className="ordernow-quantity-input"
                  />
                  <button
                    className="ordernow-quantity-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= selectedProduct.stock}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                className="ordernow-modal-add-btn"
                onClick={handleAddToCart}
                disabled={addingToCart || selectedProduct.stock === 0}
              >
                {addingToCart ? 'Adding...' : selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderNow;
