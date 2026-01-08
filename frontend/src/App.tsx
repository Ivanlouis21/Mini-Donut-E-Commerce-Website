import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import OrderNow from './pages/OrderNow';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer';
import { User } from './types/auth.types';
import { authAPI } from './services/api';
import './styles/global/App.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const navbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check for user on mount and when storage changes
    const checkUser = () => {
  const userString = localStorage.getItem('user');
      setUser(userString ? JSON.parse(userString) : null);
    };

    checkUser();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkUser);
    
    // Custom event for same-tab login/logout
    window.addEventListener('userUpdated', checkUser);
    
    // Listen for avatar updates (handled via storage event and userUpdated event)

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userUpdated', checkUser);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll detection for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (navbarRef.current) {
        if (scrolled) {
          navbarRef.current.classList.add('scrolled');
        } else {
          navbarRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart count detection
  useEffect(() => {
    const updateCartCount = () => {
      const cart = localStorage.getItem('cart');
      if (cart) {
        try {
          const cartItems = JSON.parse(cart);
          const count = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          setCartCount(count);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Custom event for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('userUpdated'));
    window.location.href = '/login';
  };

  return (
    <Router>
      <AppContent
        user={user}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        setShowProfileModal={setShowProfileModal}
        showProfileModal={showProfileModal}
        profileMenuRef={profileMenuRef}
        cartCount={cartCount}
        handleLogout={handleLogout}
      />
    </Router>
  );
};

interface AppContentProps {
  user: User | null;
  showProfileMenu: boolean;
  setShowProfileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfileModal: React.Dispatch<React.SetStateAction<boolean>>;
  showProfileModal: boolean;
  profileMenuRef: React.RefObject<HTMLDivElement | null>;
  cartCount: number;
  handleLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({
  user,
  showProfileMenu,
  setShowProfileMenu,
  setShowProfileModal,
  showProfileModal,
  profileMenuRef,
  cartCount,
  handleLogout,
}) => {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="App">
      {!isAdminRoute && (
        <Navbar 
          user={user}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          setShowProfileModal={setShowProfileModal}
          profileMenuRef={profileMenuRef}
          cartCount={cartCount}
        />
      )}
      <main className={isAdminRoute ? '' : 'main-content'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<OrderNow />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}

      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => {
            setShowProfileModal(false);
            // Force re-render to update navbar avatar
            window.dispatchEvent(new Event('avatarUpdated'));
          }}
          onUserUpdate={(updatedUser) => {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('userUpdated'));
          }}
          onLogout={handleLogout}
        />
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className={isAdminRoute ? 'toast-admin' : 'toast-below-header'}
      />
    </div>
  );
};

type NavbarProps = {
  user: User | null;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowProfileModal: (show: boolean) => void;
  profileMenuRef: React.RefObject<HTMLDivElement | null>;
  cartCount: number;
};

const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  showProfileMenu, 
  setShowProfileMenu, 
  setShowProfileModal,
  profileMenuRef,
  cartCount 
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (navbarRef.current) {
        if (scrolled) {
          navbarRef.current.classList.add('scrolled');
        } else {
          navbarRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentSection = searchParams.get('section') || (location.pathname === '/' ? 'home' : '');

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userUpdated'));
    window.location.href = '/login';
  };

  return (
    <nav className="navbar" ref={navbarRef}>
          <div className="container">
            <Link to="/" className="logo">
              <img src="/Assets/Logo/LOGO 2.png" alt="Crazy Mini Donuts Logo" className="logo-image" />
              <span className="logo-text">
                <span className="logo-main">Crazy Mini</span>
                <span className="logo-sub melting">donuts</span>
              </span>
            </Link>
            <div className="nav-center">
          <Link 
            to="/?section=home" 
            className={currentSection === 'home' || (location.pathname === '/' && !currentSection) ? 'active' : ''}
          >
            Home
          </Link>
          <Link 
            to="/?section=products" 
            className={currentSection === 'products' && location.pathname !== '/products' ? 'active' : ''}
          >
            Products
          </Link>
          <Link 
            to="/?section=about" 
            className={currentSection === 'about' ? 'active' : ''}
          >
            About Us
          </Link>
          <Link 
            to="/?section=contact" 
            className={currentSection === 'contact' ? 'active' : ''}
          >
            Contact Us
          </Link>
          <Link to="/products" className="nav-order-btn">Order Now</Link>
            </div>
            <div className="nav-right">
              <Link to="/cart" className="nav-icon-link cart-icon" title="Cart">
                🛒
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
              </Link>
              {user ? (
            <div className="profile-menu-wrapper" ref={profileMenuRef}>
              <button
                className="nav-icon-link profile-toggle"
                title="Profile"
                onClick={() => setShowProfileMenu((prev) => !prev)}
              >
                {(() => {
                  const storedAvatar = localStorage.getItem('userAvatar');
                  return storedAvatar ? (
                    <img src={storedAvatar} alt="Profile" className="profile-nav-avatar" />
                  ) : (
                    <span className="profile-nav-icon">👤</span>
                  );
                })()}
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {(() => {
                        const storedAvatar = localStorage.getItem('userAvatar');
                        return storedAvatar ? (
                          <img src={storedAvatar} alt="Profile" />
                        ) : (
                          <span>{user.firstName?.[0]?.toUpperCase() || 'U'}</span>
                        );
                      })()}
                    </div>
                    <div className="profile-name">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="profile-email">{user.email}</div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="profile-dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="profile-dropdown-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Orders
                  </Link>
                  <button
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfileMenu(false);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage Profile
                  </button>
                  <button
                    className="profile-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </nav>
  );
};

export default App;

type ProfileModalProps = {
  user: User;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUserUpdate, onLogout }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Photo upload state - prioritize user.profilePicture from backend, then localStorage
  const [avatar, setAvatar] = useState<string | null>(user.profilePicture || localStorage.getItem('userAvatar'));
  
  // Sync avatar when user.profilePicture changes
  useEffect(() => {
    if (user.profilePicture) {
      setAvatar(user.profilePicture);
      localStorage.setItem('userAvatar', user.profilePicture);
    }
  }, [user.profilePicture]);
  
  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        try {
          // Call backend to update profile picture
          const response = await authAPI.updateProfilePicture({
            profilePicture: result,
          });
          
          // Update avatar state and localStorage
          setAvatar(result);
          localStorage.setItem('userAvatar', result);
          
          // Update user object with new profile picture
          const updatedUser = { ...user, profilePicture: response.data.profilePicture };
          onUserUpdate(updatedUser);
          
          setMessage('Profile picture updated successfully.');
          setIsError(false);
          // Trigger event to update navbar avatar
          window.dispatchEvent(new Event('avatarUpdated'));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile picture. Please try again.';
          setMessage(errorMessage);
          setIsError(true);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setIsError(false);

    if (activeTab === 'password') {
      if (!currentPassword) {
        setMessage('Please enter your current password.');
        setIsError(true);
        setSaving(false);
        return;
      }
      if (!password || password.length < 6) {
        setMessage('New password must be at least 6 characters.');
        setIsError(true);
        setSaving(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        setIsError(true);
        setSaving(false);
        return;
      }
      
      try {
        // Call backend to change password
        await authAPI.changePassword({
          currentPassword,
          newPassword: password,
        });
        
        setMessage('Password changed successfully.');
        setIsError(false);
        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to change password. Please try again.';
        setMessage(errorMessage);
        setIsError(true);
      }
    } else {
      // Update profile info
      try {
        const response = await authAPI.updateProfile({
          firstName,
          lastName,
        });
        
        // Update user with response from backend
        onUserUpdate(response.data.user);
        setMessage('Profile updated successfully.');
        setIsError(false);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
        setMessage(errorMessage);
        setIsError(true);
      }
    }
    
    setSaving(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card profile-modal-card">
        <div className="modal-header">
          <h3>Account</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body profile-modal-body">
          <div className="profile-modal-layout">
            {/* Left Sidebar */}
            <aside className="profile-sidebar">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  {avatar ? (
                    <img src={avatar} alt="Profile" />
                  ) : (
                    <span>{user.firstName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <label className="profile-avatar-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  Edit profile picture
                </label>
              </div>

              <div className="profile-sidebar-name">
                <span className="profile-gender-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                    <path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" fill="currentColor"/>
                  </svg>
                </span>
                {user.firstName} {user.lastName}
              </div>
              <div className="profile-sidebar-email">{email}</div>

              <div className="profile-sidebar-divider"></div>

              <div className="profile-sidebar-menu">
                <button
                  className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <span className="sidebar-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Manage profile
                </button>
                <button
                  className={`sidebar-item ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <span className="sidebar-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Change password
                </button>
              </div>

              <button className="sidebar-logout" onClick={onLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </aside>

            {/* Right Content */}
            <section className="profile-main">
              {activeTab === 'profile' && (
                <div className="modal-section">
                  <h4>Manage Profile</h4>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} disabled placeholder="Your email address" />
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div className="modal-section">
                  <h4>Change Password</h4>
                  <div className="form-group password-field-group">
                    <label>Enter current password:</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.88 9.88C9.17537 10.5846 8.7802 11.527 8.7802 12.5C8.7802 13.473 9.17537 14.4154 9.88 15.12C10.5846 15.8246 11.527 16.2198 12.5 16.2198C13.473 16.2198 14.4154 15.8246 15.12 15.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="form-group password-field-group">
                    <label>New password:</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.88 9.88C9.17537 10.5846 8.7802 11.527 8.7802 12.5C8.7802 13.473 9.17537 14.4154 9.88 15.12C10.5846 15.8246 11.527 16.2198 12.5 16.2198C13.473 16.2198 14.4154 15.8246 15.12 15.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="form-group password-field-group">
                    <label>Retype new password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1751 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.88 9.88C9.17537 10.5846 8.7802 11.527 8.7802 12.5C8.7802 13.473 9.17537 14.4154 9.88 15.12C10.5846 15.8246 11.527 16.2198 12.5 16.2198C13.473 16.2198 14.4154 15.8246 15.12 15.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {message && (
                <div className={`modal-message ${isError ? 'modal-message-error' : 'modal-message-success'}`}>
                  {message}
                </div>
              )}
            </section>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
