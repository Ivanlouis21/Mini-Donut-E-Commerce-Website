import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ordersAPI, productsAPI, contactAPI } from '../services/api';
import '../styles/pages/AdminPage.css';

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'suggestions'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userString);
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchData();
  }, [navigate, activeTab]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await contactAPI.getUnreadCount();
        setUnreadCount(typeof response.data === 'number' ? response.data : response.data.count || 0);
      } catch (err) {
        // Silently fail for unread count
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'orders') {
        const response = await ordersAPI.getAllAdmin();
        setOrders(response.data);
      } else if (activeTab === 'products') {
        const response = await productsAPI.getAll();
        setProducts(response.data);
      } else if (activeTab === 'suggestions') {
        const [messagesResponse, unreadResponse] = await Promise.all([
          contactAPI.getAll(),
          contactAPI.getUnreadCount(),
        ]);
        setMessages(messagesResponse.data);
        setUnreadCount(unreadResponse.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
      category: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      category: product.category || '',
    });
    setSelectedImage(null);
    setImagePreview(product.imageUrl || null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productsAPI.delete(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
      // Dispatch event to notify OrderNow page to refresh
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete product');
    }
  };

  const handleUpdateStock = async (id: number, newStock: number) => {
    if (newStock < 0) {
      toast.warning('Stock cannot be negative');
      return;
    }

    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      await productsAPI.update(id, { stock: newStock });
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success('Stock updated successfully');
      // Dispatch event to notify OrderNow page to refresh
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update stock');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
        toast.error('Please select a valid image file (jpg, jpeg, png, gif, or webp)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.stock || !productForm.category) {
      toast.warning('Please fill in all required fields including category');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('stock', productForm.stock);
      formData.append('category', productForm.category);
      
      // Only append image if a new one is selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      // If no new image is selected, existing imageUrl will be preserved by the backend

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
      } else {
        await productsAPI.create(formData);
      }

      setShowProductModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      // Dispatch event to notify OrderNow page to refresh
      window.dispatchEvent(new Event('productUpdated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save product');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'ready_for_pickup':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success(`Order #${orderId} status updated successfully!`);
      // Refresh orders
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    }
  };

  const formatStatusName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const normalizeCategory = (category: string | undefined): string => {
    if (!category) return 'Others';
    // Normalize category names to match filter buttons
    const normalized = category.trim();
    if (normalized.toLowerCase() === 'classic') return 'Classic';
    if (normalized.toLowerCase() === 'best seller' || normalized.toLowerCase() === 'bestseller') return 'Best Seller';
    if (normalized.toLowerCase() === 'beverages' || normalized.toLowerCase() === 'beverage') return 'Beverages';
    if (normalized.toLowerCase() === 'others' || normalized.toLowerCase() === 'other') return 'Others';
    return normalized;
  };

  const groupProductsByCategory = () => {
    const grouped: { [key: string]: Product[] } = {};
    products.forEach(product => {
      const category = normalizeCategory(product.category);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    return grouped;
  };

  const getCategoriesToDisplay = () => {
    if (selectedCategory === 'All') {
      return ['Classic', 'Best Seller', 'Beverages', 'Others'];
    }
    return [selectedCategory];
  };

  const categories = ['All', 'Classic', 'Best Seller', 'Beverages', 'Others'];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
  };

  if (loading && orders.length === 0 && products.length === 0 && messages.length === 0) {
    return (
      <div className="admin-layout">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <img src="/Assets/Logo/LOGO 2.png" alt="Crazy Mini Donuts Logo" className="admin-logo-image" />
            <span className="admin-logo-text">
              <span className="admin-logo-main">Crazy Mini</span>
              <span className="admin-logo-sub">donuts</span>
            </span>
          </div>
        </div>
      </header>

      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="admin-sidebar-title">Admin Panel</span>
          </div>
          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4C7 2.89543 7.89543 2 9 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Orders</span>
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69752 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69752 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Manage Products</span>
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Suggestions</span>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </button>
            <div className="admin-nav-divider"></div>
            <button
              className="admin-nav-item admin-nav-logout"
              onClick={handleLogout}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {error && <div className="admin-error">Error: {error}</div>}

      {activeTab === 'orders' && (
        <div className="admin-orders">
          <div className="admin-orders-header">
            <h2>All Orders</h2>
            {orders.length > 0 && (
              <div className="admin-orders-count">
                <span className="orders-count-number">{orders.length}</span>
                <span className="orders-count-label">{orders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>No Orders Found</h3>
              <p>There are no orders in the system yet.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card admin-order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <div className="order-id-section">
                        <h3>Order #{order.id}</h3>
                        <span className="order-items-count">{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
                      </div>
                      <p className="order-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {formatDate(order.createdAt)}
                      </p>
                      {order.user && (
                        <div className="order-user">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="order-user-name">{order.user.firstName} {order.user.lastName}</span>
                          <span className="order-user-email">({order.user.email})</span>
                        </div>
                      )}
                    </div>
                    <div className="order-status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {formatStatusName(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="order-items">
                    {order.items?.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="order-item-info">
                          <h4>{item.product?.name || 'Product'}</h4>
                          <div className="order-item-details">
                            <span className="order-item-quantity">Qty: {item.quantity}</span>
                            <span className="order-item-price">₱{parseFloat(item.price.toString()).toFixed(2)} each</span>
                          </div>
                        </div>
                        <div className="order-item-total">
                          ₱{(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-footer">
                    <div className="order-total">
                      <span className="order-total-label">Total Amount</span>
                      <strong>₱{parseFloat(order.total.toString()).toFixed(2)}</strong>
                    </div>
                    <div className="order-actions">
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Mark as Ready
                        </button>
                      )}
                      {order.status === 'ready_for_pickup' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="admin-products">
          <div className="products-header">
            <h2>Products Management</h2>
            <button className="btn btn-primary" onClick={handleAddProduct}>
              + Add Product
            </button>
          </div>
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          {products.length === 0 ? (
            <div className="empty-state">No products found</div>
          ) : (
            <div className="products-by-category">
              {getCategoriesToDisplay().map((categoryName) => {
                const groupedProducts = groupProductsByCategory();
                const categoryProducts = groupedProducts[categoryName] || [];
                
                if (categoryProducts.length === 0) {
                  return null;
                }

                return (
                  <div key={categoryName} className="category-section">
                    <div className="category-section-header">
                      <h3 className="category-section-title">{categoryName}</h3>
                    </div>
                    <div className="products-grid">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="product-card">
                          <div className="product-image">
                            {product.imageUrl ? (
                              <img 
                                src={(() => {
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
                            ) : (
                              <div className="product-image-placeholder">No Image</div>
                            )}
                          </div>
                          <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="product-description">{product.description}</p>
                            <div className="product-details">
                              <div className="product-price">₱{parseFloat(product.price.toString()).toFixed(2)}</div>
                              <div className="product-stock">
                                <label>Stock:</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={product.stock}
                                  onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                                  className="stock-input"
                                />
                              </div>
                            </div>
                            <div className="product-actions">
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {getCategoriesToDisplay().every(cat => {
                const grouped = groupProductsByCategory();
                return (grouped[cat] || []).length === 0;
              }) && (
                <div className="empty-state">No products found in {selectedCategory} category</div>
              )}
            </div>
          )}
        </div>
      )}

      {showProductModal && (
        <div className="modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="file-input"
                />
                {imagePreview && (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    {selectedImage && (
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(editingProduct?.imageUrl || null);
                        }}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                )}
                {!imagePreview && editingProduct?.imageUrl && (
                  <p className="image-note">Current image will be kept if no new image is selected</p>
                )}
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="category-select"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Classic">Classic</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProduct}>
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="admin-suggestions">
          <div className="admin-suggestions-header">
            <h2>Contact Messages & Suggestions</h2>
            {messages.length > 0 && (
              <div className="admin-suggestions-count">
                <span className="suggestions-count-number">{messages.length}</span>
                <span className="suggestions-count-label">{messages.length === 1 ? 'Message' : 'Messages'}</span>
                {unreadCount > 0 && (
                  <span className="unread-indicator">{unreadCount} unread</span>
                )}
              </div>
            )}
          </div>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>No Messages Yet</h3>
              <p>Contact messages and suggestions from users will appear here.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-card ${!message.isRead ? 'unread' : ''}`}>
                  <div className="message-header">
                    <div className="message-info">
                      <div className="message-sender">
                        <h3>{message.name}</h3>
                        {!message.isRead && <span className="unread-dot"></span>}
                      </div>
                      <p className="message-email">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {message.email}
                      </p>
                      <p className="message-date">{formatDate(message.createdAt)}</p>
                    </div>
                    <div className="message-actions">
                      {!message.isRead && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              await contactAPI.markAsRead(message.id);
                              await fetchData();
                              toast.success('Message marked as read');
                            } catch (err: any) {
                              toast.error(err.response?.data?.message || 'Failed to mark as read');
                            }
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this message?')) {
                            try {
                              await contactAPI.delete(message.id);
                              await fetchData();
                              toast.success('Message deleted');
                            } catch (err: any) {
                              toast.error(err.response?.data?.message || 'Failed to delete message');
                            }
                          }
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="message-content">
                    <p>{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="admin-footer">
        <div className="admin-footer-content">
          <p>&copy; {new Date().getFullYear()} Admin Panel. All rights reserved.</p>
          <div className="admin-footer-links">
            <Link to="/">View Site</Link>
            <span>•</span>
            <a href="#support">Support</a>
            <span>•</span>
            <a href="#docs">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminPage;
