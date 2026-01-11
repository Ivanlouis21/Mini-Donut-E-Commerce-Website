import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/components/Orders.css';
import '../styles/pages/AdminPage.css';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination state
  const [completedPage, setCompletedPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [readyForPickupPage, setReadyForPickupPage] = useState(1);
  const itemsPerPage = 5;
  
  // Refs for scrolling column content
  const pendingColumnRef = useRef<HTMLDivElement>(null);
  const readyForPickupColumnRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
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

  // Separate orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const forPickupOrders = orders.filter(order => order.status === 'ready_for_pickup');
  const completedOrders = orders.filter(order => order.status === 'completed');

  // Pagination calculations
  const completedTotalPages = Math.ceil(completedOrders.length / itemsPerPage);
  const pendingTotalPages = Math.ceil(pendingOrders.length / itemsPerPage);
  const readyForPickupTotalPages = Math.ceil(forPickupOrders.length / itemsPerPage);

  // Get paginated orders
  const getPaginatedCompletedOrders = () => {
    const startIndex = (completedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return completedOrders.slice(startIndex, endIndex);
  };

  const getPaginatedPendingOrders = () => {
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pendingOrders.slice(startIndex, endIndex);
  };

  const getPaginatedReadyForPickupOrders = () => {
    const startIndex = (readyForPickupPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return forPickupOrders.slice(startIndex, endIndex);
  };

  // Reset pagination when filter changes
  useEffect(() => {
    setCompletedPage(1);
    setPendingPage(1);
    setReadyForPickupPage(1);
  }, [selectedFilter]);

  // Reset pagination when orders change
  useEffect(() => {
    setCompletedPage(1);
    setPendingPage(1);
    setReadyForPickupPage(1);
  }, [orders.length]);

  const handleOrderCardClick = (order: Order) => {
    // Open modal for any order to view details
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handlePrevPage = (type: 'completed' | 'pending' | 'readyForPickup') => {
    if (type === 'completed' && completedPage > 1) {
      setCompletedPage(completedPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (type === 'pending' && pendingPage > 1) {
      setPendingPage(pendingPage - 1);
      if (pendingColumnRef.current) {
        pendingColumnRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'readyForPickup' && readyForPickupPage > 1) {
      setReadyForPickupPage(readyForPickupPage - 1);
      if (readyForPickupColumnRef.current) {
        readyForPickupColumnRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleNextPage = (type: 'completed' | 'pending' | 'readyForPickup') => {
    if (type === 'completed' && completedPage < completedTotalPages) {
      setCompletedPage(completedPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (type === 'pending' && pendingPage < pendingTotalPages) {
      setPendingPage(pendingPage + 1);
      if (pendingColumnRef.current) {
        pendingColumnRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'readyForPickup' && readyForPickupPage < readyForPickupTotalPages) {
      setReadyForPickupPage(readyForPickupPage + 1);
      if (readyForPickupColumnRef.current) {
        readyForPickupColumnRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
          <div className="orders-columns orders-columns-two">
            <div className="orders-column">
              <div className="orders-column-header">
                <div className="skeleton-nav-item" style={{ width: '100px', height: '24px' }}></div>
                <div className="skeleton-nav-item" style={{ width: '32px', height: '24px', borderRadius: '9999px' }}></div>
              </div>
              <div className="orders-column-content">
              <div className="skeleton-order-card"></div>
              <div className="skeleton-order-card"></div>
              </div>
            </div>
            <div className="orders-column">
              <div className="orders-column-header">
                <div className="skeleton-nav-item" style={{ width: '120px', height: '24px' }}></div>
                <div className="skeleton-nav-item" style={{ width: '32px', height: '24px', borderRadius: '9999px' }}></div>
              </div>
              <div className="orders-column-content">
              <div className="skeleton-order-card"></div>
              <div className="skeleton-order-card"></div>
              </div>
            </div>
          </div>
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
    <div 
      key={order.id} 
      className="order-card clickable-order-card"
      onClick={() => handleOrderCardClick(order)}
      style={{ cursor: 'pointer' }}
    >
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
        {selectedFilter === 'completed' ? (
          <>
            <div className="orders-content-header">
              <h1>Completed Orders</h1>
              {completedOrders.length > 0 && (
                <div className="orders-count-badge">
                  {completedOrders.length} {completedOrders.length === 1 ? 'order' : 'orders'}
                </div>
              )}
            </div>
            {completedOrders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-orders-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>No Completed Orders</h2>
                <p>You have no completed orders yet. Complete orders will appear here.</p>
              </div>
            ) : (
              <>
              <div className="orders-list">
                  {getPaginatedCompletedOrders().map(renderOrderCard)}
                </div>
                {completedTotalPages > 1 && (
                  <div className="orders-pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => handlePrevPage('completed')}
                      disabled={completedPage === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Previous
                    </button>
                    <div className="pagination-info">
                      <span className="pagination-page">{completedPage}</span>
                      <span className="pagination-separator">of</span>
                      <span className="pagination-total">{completedTotalPages}</span>
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() => handleNextPage('completed')}
                      disabled={completedPage === completedTotalPages}
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
          </>
        ) : (
          <>
            <div className="orders-content-header">
              <h1>My Orders</h1>
              {(pendingOrders.length + forPickupOrders.length) > 0 && (
                <div className="orders-count-badge">
                  {pendingOrders.length + forPickupOrders.length} {(pendingOrders.length + forPickupOrders.length) === 1 ? 'order' : 'orders'}
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
              <div className="orders-columns orders-columns-two">
                {/* Pending Orders Column */}
                <div className="orders-column">
                  <div className="orders-column-header">
                    <h3 className="orders-column-title">Pending</h3>
                    <span className="orders-column-count">{pendingOrders.length}</span>
                  </div>
                  <div className="orders-column-content" ref={pendingColumnRef}>
                    {pendingOrders.length === 0 ? (
                      <div className="orders-column-empty">
                        <p>No pending orders</p>
                      </div>
                    ) : (
                      <>
                        {getPaginatedPendingOrders().map(renderOrderCard)}
                      </>
                    )}
                  </div>
                  {pendingOrders.length > itemsPerPage && (
                    <div className="orders-column-pagination">
                      <button
                        className="pagination-btn btn-sm"
                        onClick={() => handlePrevPage('pending')}
                        disabled={pendingPage === 1}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                        Previous
                      </button>
                      <div className="pagination-info-small">
                        <span>{pendingPage}</span>
                        <span>/</span>
                        <span>{pendingTotalPages}</span>
                    </div>
                      <button
                        className="pagination-btn btn-sm"
                        onClick={() => handleNextPage('pending')}
                        disabled={pendingPage === pendingTotalPages}
                      >
                        Next
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Ready for Pickup Orders Column */}
                <div className="orders-column">
                  <div className="orders-column-header">
                    <h3 className="orders-column-title">Ready for Pickup</h3>
                    <span className="orders-column-count">{forPickupOrders.length}</span>
                  </div>
                  <div className="orders-column-content" ref={readyForPickupColumnRef}>
                    {forPickupOrders.length === 0 ? (
                      <div className="orders-column-empty">
                        <p>No orders ready for pickup</p>
                      </div>
                    ) : (
                      <>
                        {getPaginatedReadyForPickupOrders().map(renderOrderCard)}
                      </>
                    )}
                  </div>
                  {forPickupOrders.length > itemsPerPage && (
                    <div className="orders-column-pagination">
                      <button
                        className="pagination-btn btn-sm"
                        onClick={() => handlePrevPage('readyForPickup')}
                        disabled={readyForPickupPage === 1}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                        Previous
                      </button>
                      <div className="pagination-info-small">
                        <span>{readyForPickupPage}</span>
                        <span>/</span>
                        <span>{readyForPickupTotalPages}</span>
                    </div>
                      <button
                        className="pagination-btn btn-sm"
                        onClick={() => handleNextPage('readyForPickup')}
                        disabled={readyForPickupPage === readyForPickupTotalPages}
                      >
                        Next
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.id} Details</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details-section">
                <h4>Order Information</h4>
                <div className="order-detail-item">
                  <span className="order-detail-label">Order ID:</span>
                  <span className="order-detail-value">#{selectedOrder.id}</span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">Status:</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusIcon(selectedOrder.status)}
                    {formatStatusName(selectedOrder.status)}
                  </span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">Date:</span>
                  <span className="order-detail-value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <div className="order-details-section">
                <h4>Order Items</h4>
                <div className="order-items-list">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="order-detail-item-row">
                      <div className="order-detail-item-info">
                        <span className="order-detail-item-name">{item.product?.name || 'Product'}</span>
                        <span className="order-detail-item-specs">
                          Qty: {item.quantity} × ₱{parseFloat(item.price.toString()).toFixed(2)}
                        </span>
                      </div>
                      <span className="order-detail-item-total">
                        ₱{(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-details-section">
                <div className="order-total-section">
                  <span className="order-total-label-modal">Total Amount:</span>
                  <strong className="order-total-value-modal">₱{parseFloat(selectedOrder.total.toString()).toFixed(2)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
