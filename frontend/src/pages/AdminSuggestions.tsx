import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { contactAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/pages/AdminPage.css';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const AdminSuggestions: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const [messagesResponse, unreadResponse] = await Promise.all([
        contactAPI.getAll(),
        contactAPI.getUnreadCount(),
      ]);
      setMessages(messagesResponse.data);
      setUnreadCount(typeof unreadResponse.data === 'number' ? unreadResponse.data : unreadResponse.data.count || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch messages');
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

  if (loading && messages.length === 0) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {error && <div className="admin-error">Error: {error}</div>}

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
                            await fetchMessages();
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
                            await fetchMessages();
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
    </AdminLayout>
  );
};

export default AdminSuggestions;
