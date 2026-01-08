import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/components/Orders.css';

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    name: string;
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    
    // Refresh orders every 5 seconds to check for status updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
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

  const formatStatusName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready_for_pickup':
        return 'For Pickup';
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

  // Separate orders into active and completed
  const activeOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );
  const completedOrders = orders.filter(order => 
    order.status === 'completed'
  );

  // Get orders to display based on selected filter
  const getOrdersToDisplay = () => {
    if (selectedFilter === 'completed') {
      return completedOrders;
    }
    return activeOrders;
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  // Calculate pagination
  const ordersToDisplay = getOrdersToDisplay();
  const totalPages = Math.ceil(ordersToDisplay.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = ordersToDisplay.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="orders-page-container">
        <div className="orders-sidebar">
          <div className="orders-sidebar-header">
            <h2>Orders</h2>
          </div>
          <nav className="orders-nav">
            <div className="orders-nav-item skeleton-nav-item"></div>
            <div className="orders-nav-item skeleton-nav-item"></div>
          </nav>
        </div>
        <div className="orders-content">
          <div className="skeleton-header"></div>
          <div className="skeleton-order-card"></div>
          <div className="skeleton-order-card"></div>
          <div className="skeleton-order-card"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'ready_for_pickup':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'pending':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="order-card">
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
        </div>
        <div className="order-status">
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {getStatusIcon(order.status)}
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
      </div>
    </div>
  );

  return (
    <div className="orders-page-container">
      <div className="orders-sidebar">
        <div className="orders-sidebar-header">
          <h2>Orders</h2>
        </div>
        <nav className="orders-nav">
          <button
            className={`orders-nav-item ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>My Orders</span>
          </button>
          <button
            className={`orders-nav-item ${selectedFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('completed')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Completed Orders</span>
          </button>
        </nav>
      </div>
      <div className="orders-content">
        <div className="orders-content-header">
          <h1>{selectedFilter === 'completed' ? 'Completed Orders' : 'My Orders'}</h1>
          {ordersToDisplay.length > 0 && (
            <div className="orders-count-badge">
              {ordersToDisplay.length} {ordersToDisplay.length === 1 ? 'order' : 'orders'}
            </div>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-orders-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start ordering to see them here!</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 17.9 19 19 19C20.1 19 21 18.1 21 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Browse Products
            </button>
          </div>
        ) : (
          <>
            {ordersToDisplay.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-orders-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>
                  {selectedFilter === 'completed' 
                    ? 'No Completed Orders' 
                    : 'No Active Orders'}
                </h2>
                <p>
                  {selectedFilter === 'completed' 
                    ? 'You have no completed orders yet. Complete orders will appear here.' 
                    : 'You have no active orders. All your orders have been completed or cancelled.'}
                </p>
              </div>
            ) : (
              <>
                <div className="orders-section">
                  <div className="orders-list">
                    {paginatedOrders.map(renderOrderCard)}
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="orders-pagination">
                    <button
                      className="pagination-btn"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Previous</span>
                    </button>
                    <div className="pagination-info">
                      <span className="pagination-page">Page {currentPage}</span>
                      <span className="pagination-separator">of</span>
                      <span className="pagination-total">{totalPages}</span>
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <span>Next</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
