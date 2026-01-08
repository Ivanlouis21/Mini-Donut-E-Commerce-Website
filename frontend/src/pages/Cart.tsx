import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { cartAPI, ordersAPI, paymentAPI } from '../services/api';
import '../styles/components/Cart.css';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Product image mapping based on product name
  const getProductImage = (productName: string, imageUrl?: string): string => {
    // If backend provides imageUrl, use it
    if (imageUrl) {
      return imageUrl;
    }

    // Otherwise, map product names to image paths
    const productImageMap: { [key: string]: string } = {
      // Classic products
      'Choco': '/Assets/Products/choco c.jpg',
      'Cookies and Cream': '/Assets/Products/CookiesNcream.jpg',
      'Snow Deli': '/Assets/Products/Snow Deli.jpg',
      'Tot Mallows Glaze': '/Assets/Products/choco mallows.jpg',
      'Matcha': '/Assets/Products/Matcha.jpg',
      'Ube Deli': '/Assets/Products/Classic Ube.jpg',
      // Best Sellers
      'Maple Glazed': '/Assets/Products/Best Seller/Maple Glazed.jpg',
      'Honey Glazed': '/Assets/Products/Best Seller/honeyg c.jpg',
      'Ensaymada': '/Assets/Products/Best Seller/ensaymada.jpg',
      'Coffee Donut Deli': '/Assets/Products/Best Seller/Coffee Donut Deli.jpg',
      'Berry Deli': '/Assets/Products/Best Seller/Berry Deli.jpg',
      'Bavarian': '/Assets/Products/Best Seller/bavarian.jpg',
      // Beverages
      'Berry & Creme': '/Assets/Products/Drinks/berry & creme.jpg',
      'Choco Chip Frappe': '/Assets/Products/Drinks/choco chip frappe.jpg',
      'CNC Frappe': '/Assets/Products/Drinks/cnc frappe.jpg',
      'Iced Caramel Macchiato': '/Assets/Products/Drinks/iced caramel macchiato.jpg',
      'Iced Coffee': '/Assets/Products/Drinks/iced coffeee.jpg',
      'Lemonade Iced Tea': '/Assets/Products/Drinks/Lemonade Iced Tea.jpg',
      // Other Products
      'Banana Chocolate Chip Muffins': '/Assets/Products/Other Products/Banana Chocolate Chip Muffins.jpg',
      'Cinnamon Roll': '/Assets/Products/Other Products/cinnamon roll.jpg',
      'Eclairs': '/Assets/Products/Other Products/eclairs.jpg',
      'Macaroons': '/Assets/Products/Other Products/macaroons.jpg',
      'Mallows': '/Assets/Products/Other Products/mallows.jpg',
      'Red Velvet Cookies': '/Assets/Products/Other Products/Red Velvet Cookies.jpg',
    };

    // Try exact match first
    if (productImageMap[productName]) {
      return productImageMap[productName];
    }

    // Try case-insensitive match
    const lowerName = productName.toLowerCase();
    for (const [key, value] of Object.entries(productImageMap)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }

    // Default placeholder if no match found
    return '/Assets/Products/choco c.jpg';
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('login_required');
      return;
    }

    fetchCart();
    
    // Check for payment success callback
    if (searchParams.get('payment') === 'success') {
      handlePaymentSuccess();
      // Clean up URL
      navigate('/cart', { replace: true });
    }
    
    // Listen for cart update events
    const handleCartUpdate = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        fetchCart();
      } else {
        setError('login_required');
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Also refresh when page becomes visible (in case user navigates from OrderNow)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          fetchCart();
        } else {
          setError('login_required');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [searchParams, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getAll();
      setCartItems(response.data);
      setError(null);
    } catch (err: any) {
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('login_required');
      } else {
        setError(err.message || 'Failed to fetch cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      await cartAPI.updateItem(itemId, { quantity: newQuantity });
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
      fetchCart();
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartAPI.removeItem(itemId);
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.product.price.toString()) * item.quantity;
    }, 0);
  };

  const handlePaymentSuccess = async () => {
    try {
      // Refresh cart first to get latest state (webhook may have already cleared it)
      const response = await cartAPI.getAll();
      const currentCartItems = response.data;
      
      // If cart is empty, order was already created by webhook
      if (!currentCartItems || currentCartItems.length === 0) {
        toast.success('Order placed successfully!');
        // Dispatch event to notify OrderNow page to refresh products (stock updated)
        window.dispatchEvent(new Event('productUpdated'));
        navigate('/orders');
        return;
      }

      // Create order after successful payment (fallback if webhook didn't work)
      const orderItems = currentCartItems.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(item.product.price.toString()),
      }));

      await ordersAPI.create({ items: orderItems });
      toast.success('Order placed successfully!');
      // Dispatch event to notify OrderNow page to refresh products (stock updated)
      window.dispatchEvent(new Event('productUpdated'));
      navigate('/orders');
    } catch (err: any) {
      // Only show error if it's not the "empty cart" error
      // If cart is empty, order was likely already created by webhook
      const errorMessage = err.response?.data?.message || 'Failed to create order';
      if (errorMessage.includes('at least one item')) {
        // Order was already created by webhook, just navigate
        toast.success('Order placed successfully!');
        // Dispatch event to notify OrderNow page to refresh products (stock updated)
        window.dispatchEvent(new Event('productUpdated'));
        navigate('/orders');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty!');
      return;
    }

    try {
      setCheckingOut(true);
      const total = calculateTotal();
      
      // Simple description - line items already show the detailed breakdown
      // Don't duplicate the item list in the description
      const description = `Order - ${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`;
      
      const returnUrl = `${window.location.origin}/cart?payment=success`;

      // Create checkout session using PayMongo's newest Checkout Sessions API
      // This provides the modern UI with itemized breakdown (like the image)
      const lineItems = cartItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.product.price.toString()),
      }));

      const paymentResponse = await paymentAPI.createIntent({
        amount: total,
        description: description,
        returnUrl: returnUrl,
        lineItems: lineItems, // Pass line items for itemized display
        metadata: {
          itemCount: cartItems.length,
        },
      });

      // Redirect directly to PayMongo checkout page (newest UI with itemized breakdown)
      if (paymentResponse.data && paymentResponse.data.checkoutUrl) {
        // Store checkout session ID for later reference
        if (paymentResponse.data.checkoutSessionId) {
          sessionStorage.setItem('pendingCheckoutSessionId', paymentResponse.data.checkoutSessionId);
        }
        
        // Immediately redirect to PayMongo's newest checkout page
        // This shows the modern UI with itemized breakdown and pre-filled billing info
        window.location.href = paymentResponse.data.checkoutUrl;
        // Don't set checkingOut to false since we're redirecting
        return;
      }

      // If no checkout URL, show error
      setCheckingOut(false);
      toast.error('Failed to initialize payment. Please try again.');
    } catch (err: any) {
      setCheckingOut(false);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
      console.error('Checkout error:', err);
      toast.error(errorMessage);
    }
  };


  if (loading) {
    return (
      <div className="container">
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error === 'login_required') {
    return (
      <div className="container">
        <div className="cart-error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>Please Login First</h3>
          <p>You need to be logged in to view your cart. Please login to continue ordering.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="cart-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchCart}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-container">
      <div className="cart-header">
        <h1>Order Cart</h1>
        {cartItems.length > 0 && (
          <p className="cart-subtitle">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        )}
      </div>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 17.9 19 19 19C20.1 19 21 18.1 21 17V13M9 19.5C9.8 19.5 10.5 20.2 10.5 21C10.5 21.8 9.8 22.5 9 22.5C8.2 22.5 7.5 21.8 7.5 21C7.5 20.2 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21C21.5 21.8 20.8 22.5 20 22.5C19.2 22.5 18.5 21.8 18.5 21C18.5 20.2 19.2 19.5 20 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet. Start ordering to fill it up!</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div key={item.id} className="cart-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="cart-item-image">
                  <img 
                    src={getProductImage(item.product.name, item.product.imageUrl)} 
                    alt={item.product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/Assets/Products/choco c.jpg';
                    }}
                  />
                </div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-description">{item.product.description}</p>
                  <div className="cart-item-price-wrapper">
                    <span className="cart-item-price-label">Price:</span>
                    <span className="cart-item-price">₱{parseFloat(item.product.price.toString()).toFixed(2)}</span>
                  </div>
                  {item.product.stock < 10 && (
                    <div className="stock-warning">
                      Only {item.product.stock} left in stock!
                    </div>
                  )}
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls-wrapper">
                    <label className="quantity-label">Quantity</label>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn quantity-btn-decrease"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleUpdateQuantity(item.id, newQuantity);
                        }}
                        className="quantity-input"
                        aria-label="Quantity"
                      />
                      <button
                        className="quantity-btn quantity-btn-increase"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        aria-label="Increase quantity"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total-wrapper">
                    <span className="cart-item-total-label">Subtotal</span>
                    <div className="cart-item-total">₱{(parseFloat(item.product.price.toString()) * item.quantity).toFixed(2)}</div>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Remove item"
                    title="Remove from cart"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="cart-summary-content">
              <div className="cart-summary-header">
                <h2>Order Summary</h2>
              </div>
              <div className="cart-summary-details">
                <div className="summary-row">
                  <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-shipping">Free</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <span className="total-amount">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              className="btn btn-success btn-checkout"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <>
                  <div className="checkout-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Proceed to Checkout
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
