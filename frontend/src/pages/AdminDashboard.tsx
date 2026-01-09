import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/pages/AdminPage.css';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getAllAdmin();
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status.toLowerCase() === 'pending').length;
  const completedOrders = orders.filter(order => order.status.toLowerCase() === 'completed').length;
  const readyForPickupOrders = orders.filter(order => order.status.toLowerCase() === 'ready_for_pickup').length;
  
  // Calculate total revenue from completed orders
  const totalRevenue = orders
    .filter(order => order.status.toLowerCase() === 'completed')
    .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error && <div className="admin-error">Error: {error}</div>}

      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <p className="dashboard-subtitle">Overview of your e-commerce store</p>
        </div>

        <div className="dashboard-cards">
          {/* Pending Orders Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Pending Orders</h3>
              <p className="dashboard-card-value" style={{ color: '#f59e0b' }}>{pendingOrders}</p>
              <p className="dashboard-card-label">Awaiting processing</p>
            </div>
          </div>

          {/* Ready for Pickup Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Ready for Pickup</h3>
              <p className="dashboard-card-value" style={{ color: '#3b82f6' }}>{readyForPickupOrders}</p>
              <p className="dashboard-card-label">Ready to be collected</p>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Completed Orders</h3>
              <p className="dashboard-card-value" style={{ color: '#10b981' }}>{completedOrders}</p>
              <p className="dashboard-card-label">Successfully delivered</p>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2H15C16.1046 2 17 2.89543 17 4V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V4C7 2.89543 7.89543 2 9 2Z" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6H15" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Orders</h3>
              <p className="dashboard-card-value">{totalOrders}</p>
              <p className="dashboard-card-label">All time orders</p>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="dashboard-card dashboard-card-revenue">
            <div className="dashboard-card-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>₱</span>
            </div>
            <div className="dashboard-card-content">
              <h3 className="dashboard-card-title">Total Revenue</h3>
              <p className="dashboard-card-value" style={{ color: '#8b5cf6' }}>₱{totalRevenue.toFixed(2)}</p>
              <p className="dashboard-card-label">From completed orders</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
