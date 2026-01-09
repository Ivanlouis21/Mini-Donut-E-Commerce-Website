import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { ordersAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
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

const AdminOrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const ordersListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (ordersListRef.current) {
      ordersListRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getAllAdmin();
      // Filter only completed orders
      const completedOrders = response.data.filter(
        (order: Order) => order.status.toLowerCase() === 'completed'
      );
      setOrders(completedOrders);
      
      // Reset pagination if current page exceeds available pages
      const maxPages = Math.ceil(completedOrders.length / itemsPerPage);
      if (currentPage > maxPages && maxPages > 0) {
        setCurrentPage(1);
      }
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

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error && <div className="admin-error">Error: {error}</div>}

      <div className="admin-orders">
        <div className="admin-orders-header">
          <h2>Order History</h2>
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
            <h3>No Completed Orders</h3>
            <p>There are no completed orders in the history yet.</p>
          </div>
        ) : (
          <>
            <div className="orders-list" ref={ordersListRef}>
              {paginatedOrders.map((order) => (
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
                  </div>
                </div>
              ))}
            </div>
            {orders.length > itemsPerPage && (
              <div className="orders-pagination">
                <button
                  className="pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                <div className="pagination-info">
                  <span className="pagination-page">{currentPage}</span>
                  <span className="pagination-separator">/</span>
                  <span className="pagination-total">{totalPages}</span>
                </div>
                <button
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderHistory;
