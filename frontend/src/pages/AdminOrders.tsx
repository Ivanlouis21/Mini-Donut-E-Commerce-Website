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

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [readyForPickupPage, setReadyForPickupPage] = useState(1);
  const itemsPerPage = 5;
  const pendingColumnRef = useRef<HTMLDivElement>(null);
  const readyForPickupColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (pendingColumnRef.current) {
      pendingColumnRef.current.scrollTop = 0;
    }
  }, [pendingPage]);

  useEffect(() => {
    if (readyForPickupColumnRef.current) {
      readyForPickupColumnRef.current.scrollTop = 0;
    }
  }, [readyForPickupPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getAllAdmin();
      setOrders(response.data);
      
      // Reset pagination if current page exceeds available pages after filtering
      const newPendingOrders = response.data.filter((order: Order) => order.status.toLowerCase() === 'pending');
      const newReadyForPickupOrders = response.data.filter((order: Order) => order.status.toLowerCase() === 'ready_for_pickup');
      
      const maxPendingPages = Math.ceil(newPendingOrders.length / itemsPerPage);
      const maxReadyForPickupPages = Math.ceil(newReadyForPickupOrders.length / itemsPerPage);
      
      if (pendingPage > maxPendingPages && maxPendingPages > 0) {
        setPendingPage(1);
      }
      if (readyForPickupPage > maxReadyForPickupPages && maxReadyForPickupPages > 0) {
        setReadyForPickupPage(1);
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

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      const statusName = status === 'ready_for_pickup' ? 'Ready for Pickup' : 'Completed';
      toast.success(`Order #${orderId} marked as ${statusName}!`);
      setIsModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    }
  };

  const handleOrderCardClick = (order: Order) => {
    // Only open modal for pending or ready_for_pickup orders
    if (order.status === 'pending' || order.status === 'ready_for_pickup') {
      setSelectedOrder(order);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent card click event
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete Order #${orderId}? This action cannot be undone. Stock will be restored to inventory.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await ordersAPI.delete(orderId);
      toast.success(`Order #${orderId} deleted successfully!`);
      
      // Close modal if it's open for the deleted order
      if (selectedOrder && selectedOrder.id === orderId) {
        setIsModalOpen(false);
        setSelectedOrder(null);
      }
      
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete order');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  // Separate orders by status (excluding completed orders)
  const pendingOrders = orders.filter(order => order.status.toLowerCase() === 'pending');
  const readyForPickupOrders = orders.filter(order => order.status.toLowerCase() === 'ready_for_pickup');
  const otherOrders = orders.filter(order => 
    order.status.toLowerCase() !== 'pending' && 
    order.status.toLowerCase() !== 'ready_for_pickup' && 
    order.status.toLowerCase() !== 'completed'
  );

  // Pagination logic
  const getPaginatedOrders = (ordersList: Order[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return ordersList.slice(startIndex, endIndex);
  };

  const paginatedPendingOrders = getPaginatedOrders(pendingOrders, pendingPage);
  const paginatedReadyForPickupOrders = getPaginatedOrders(readyForPickupOrders, readyForPickupPage);

  const pendingTotalPages = Math.ceil(pendingOrders.length / itemsPerPage);
  const readyForPickupTotalPages = Math.ceil(readyForPickupOrders.length / itemsPerPage);

  const handlePrevPage = (type: 'pending' | 'readyForPickup') => {
    if (type === 'pending') {
      setPendingPage(prev => Math.max(1, prev - 1));
    } else {
      setReadyForPickupPage(prev => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = (type: 'pending' | 'readyForPickup') => {
    if (type === 'pending') {
      setPendingPage(prev => Math.min(pendingTotalPages, prev + 1));
    } else {
      setReadyForPickupPage(prev => Math.min(readyForPickupTotalPages, prev + 1));
    }
  };

  const renderOrderCard = (order: Order) => (
    <div 
      key={order.id} 
      className={`order-card admin-order-card ${(order.status === 'pending' || order.status === 'ready_for_pickup') ? 'clickable-order-card' : ''}`}
      onClick={() => handleOrderCardClick(order)}
      style={{ cursor: (order.status === 'pending' || order.status === 'ready_for_pickup') ? 'pointer' : 'default' }}
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
        {(order.status === 'pending' || order.status === 'ready_for_pickup') && (
                      <button
            className="btn-delete-order"
            onClick={(e) => handleDeleteOrder(order.id, e)}
            title="Delete Order"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {error && <div className="admin-error">Error: {error}</div>}

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
                  paginatedPendingOrders.map(renderOrderCard)
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
                    Back
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
                <span className="orders-column-count">{readyForPickupOrders.length}</span>
              </div>
              <div className="orders-column-content" ref={readyForPickupColumnRef}>
                {readyForPickupOrders.length === 0 ? (
                  <div className="orders-column-empty">
                    <p>No orders ready for pickup</p>
                  </div>
                ) : (
                  paginatedReadyForPickupOrders.map(renderOrderCard)
                )}
              </div>
              {readyForPickupOrders.length > itemsPerPage && (
                <div className="orders-column-pagination">
                  <button
                    className="pagination-btn btn-sm"
                    onClick={() => handlePrevPage('readyForPickup')}
                    disabled={readyForPickupPage === 1}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
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
                    {formatStatusName(selectedOrder.status)}
                  </span>
                </div>
                <div className="order-detail-item">
                  <span className="order-detail-label">Date:</span>
                  <span className="order-detail-value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                {selectedOrder.user && (
                  <>
                    <div className="order-detail-item">
                      <span className="order-detail-label">Customer:</span>
                      <span className="order-detail-value">{selectedOrder.user.firstName} {selectedOrder.user.lastName}</span>
                    </div>
                    <div className="order-detail-item">
                      <span className="order-detail-label">Email:</span>
                      <span className="order-detail-value">{selectedOrder.user.email}</span>
                    </div>
                  </>
                )}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'ready_for_pickup') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete Order
                  </button>
                )}
                {selectedOrder.status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready_for_pickup')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    Ready for Pickup
                      </button>
                    )}
                {selectedOrder.status === 'ready_for_pickup' && (
                      <button
                    className="btn btn-success"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                      >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Complete Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default AdminOrders;
