import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { UIProvider, useUI } from './context/UIContext';
import MyVisits from './pages/MyVisits';
import { useState, useEffect, useRef } from 'react';
import MockStripeCheckout from './pages/MockStripeCheckout';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import PropertyDetails from './pages/PropertyDetails';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import EditProperty from './pages/EditProperty';
import MyPurchases from './pages/MyPurchases';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import SellerAnalytics from './pages/SellerAnalytics';
import AdminAnalytics from './pages/AdminAnalytics';
import BuyerDashboard from './pages/BuyerDashboard';
import SystemLogs from './pages/SystemLogs';
import Disputes from './pages/Disputes';
import PlatformSettings from './pages/PlatformSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import SidebarLayout from './components/SidebarLayout';
import Footer from './components/Footer';
import AIChatBot from './components/AIChatBot';
import api from './api/axiosConfig';
import socket from './api/socket';

const Navigation = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { showAlert } = useUI();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Smart Alerts State
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const dropdownRef = useRef(null);

  // Fetch alerts if logged in & Setup Real-Time Socket
  useEffect(() => {
    if (userInfo?._id) {
      // Fetch historical notifications
      const fetchNotifs = async () => {
        try {
          const { data } = await api.get('/notifications');
          setNotifications(data);
        } catch (err) { console.error('Failed to load alerts'); }
      };
      fetchNotifs();

      // REAL-TIME - Connect and join personal notification room
      socket.connect();
      socket.emit('setup', userInfo);

      // REAL-TIME - Listen for incoming instant alerts
      socket.on('new_notification', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        showAlert(newNotif.message, newNotif.type === 'alert' || newNotif.type === 'system' ? 'warning' : 'info');
      });

      socket.on('maintenance_alert', (data) => {
        showAlert(data.message, 'error');
      });

      return () => {
        socket.off('new_notification');
        socket.off('maintenance_alert');
      };
    }
  }, [userInfo?._id, showAlert]);

  const handleNotificationClick = async (notif) => {
    setShowNotifs(false);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) { }
    }
    navigate(notif.link);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'price_drop': return '📉';
      case 'visit_update': return '📅';
      case 'message': return '💬';
      case 'order': return '💰';
      case 'order_update': return '🤝';
      case 'review': return '⭐';
      case 'alert': return '🚨';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) { }
  };

  const handleExplicitMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error('Failed to mark as read'); }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) { console.error('Failed to delete notification'); }
  };

  const handleLogout = () => { localStorage.removeItem('userInfo'); navigate('/login'); };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Alerts' && ['alert', 'price_drop', 'review', 'visit_update'].includes(notif.type)) return true;
    if (activeTab === 'Orders' && ['order', 'order_update'].includes(notif.type)) return true;
    if (activeTab === 'System' && ['system'].includes(notif.type)) return true;
    return false;
  });

  return (
    <>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px',
        position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'var(--bg-nav)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>L</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '1.2' }}>LakEstates</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sri Lanka's Property Marketplace</span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '500' }}>Home</Link>

          <button onClick={toggleTheme} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }} title="Toggle Theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {userInfo ? (
            <>
              {/* NOTIFICATION BELL WIDGET */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotifs(true)} style={{ position: 'relative', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  🔔
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--danger-color)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid var(--bg-nav)' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
                {userInfo.profilePhoto ? <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{userInfo.name.charAt(0).toUpperCase()}</div>}
                <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } }}>{userInfo.name.split(' ')[0]}</span>
              </Link>

              <Link to={userInfo.role === 'buyer' ? '/buyer/dashboard' : userInfo.role === 'seller' ? '/analytics' : '/admin/analytics'} style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', boxShadow: 'var(--shadow-sm)' }}>Dashboard</Link>
              <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '8px 20px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '6px', fontWeight: '600' }}>Logout</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" style={{ padding: '8px 20px', color: 'var(--text-main)', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
              <Link to="/register" style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', boxShadow: 'var(--shadow-sm)' }}>Register</Link>
            </div>
          )}
        </div>
      </nav>

      {/* SLIDE-OVER PANEL */}
      {showNotifs && (
        <>
          <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}></div>
          <div style={{
            position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh',
            backgroundColor: 'var(--bg-nav)', zIndex: 9999,
            boxShadow: '-5px 0 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s forwards'
          }}>
            <div style={{ padding: '25px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 'bold' }}>Notifications</h3>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary-color)', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Mark all read</button>}
                <button onClick={() => setShowNotifs(false)} style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 20px' }}>
              {['All', 'Alerts', 'Orders', 'System'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, background: 'none', border: 'none', padding: '15px 0', cursor: 'pointer',
                    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontWeight: activeTab === tab ? '700' : '500',
                    borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-body)', padding: '15px' }}>
              {filteredNotifications.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>You're all caught up!</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>No notifications found in this category.</p>
                </div>
              ) : (
                filteredNotifications.map(notif => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '18px', marginBottom: '10px', borderRadius: '12px', cursor: 'pointer',
                      backgroundColor: notif.isRead ? 'var(--bg-card)' : 'var(--primary-light)',
                      border: notif.isRead ? '1px solid var(--border-color)' : '1px solid var(--primary-color)',
                      boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', display: 'flex', gap: '15px', alignItems: 'flex-start'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: '1.8rem', backgroundColor: 'var(--bg-hover)', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: notif.isRead ? 'normal' : '600' }}>{notif.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleExplicitMarkRead(e, notif._id)}
                              title="Mark as Read"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontSize: '1.2rem', padding: 0 }}
                            >
                              ☑
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(e, notif._id)}
                            title="Delete Notification"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 0 }}
                          >
                            ☒
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </>
  );
};

function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data && data.maintenanceMode) {
          setMaintenanceMode(true);
        }
      } catch (err) {
        console.error('Failed to check maintenance mode');
      }
    };
    checkMaintenance();

    // Check periodically every 5 minutes
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <UIProvider>
        <Router>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navigation />

            {maintenanceMode && (
              <div style={{ backgroundColor: 'var(--danger-color)', color: '#fff', textAlign: 'center', padding: '10px', fontWeight: 'bold', zIndex: 9999 }}>
                🚧 Platform Maintenance Mode is Active. Some features may be temporarily restricted. 🚧
              </div>
            )}

            {/* Chatbot Widget */}
            <AIChatBot />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/profile" element={<SidebarLayout><Profile /></SidebarLayout>} />
                <Route path="/buyer/dashboard" element={<SidebarLayout><BuyerDashboard /></SidebarLayout>} />
                <Route path="/favorites" element={<SidebarLayout><Favorites /></SidebarLayout>} />
                <Route path="/purchases" element={<SidebarLayout><MyPurchases /></SidebarLayout>} />
                <Route path="/compare" element={<SidebarLayout><Compare /></SidebarLayout>} />
                <Route path="/admin/analytics" element={<SidebarLayout><AdminAnalytics /></SidebarLayout>} />
                <Route path="/admin/logs" element={<SidebarLayout><SystemLogs /></SidebarLayout>} />
                <Route path="/admin/disputes" element={<SidebarLayout><Disputes /></SidebarLayout>} />
                <Route path="/admin/settings" element={<SidebarLayout><PlatformSettings /></SidebarLayout>} />
                <Route path="/admin/:tab?" element={<SidebarLayout><AdminDashboard /></SidebarLayout>} />
                <Route path="/analytics" element={<SidebarLayout><SellerAnalytics /></SidebarLayout>} />
                <Route path="/edit-property/:id" element={<SidebarLayout><EditProperty /></SidebarLayout>} />
                <Route path="/dashboard/:tab?" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
                <Route path="/visits" element={<SidebarLayout><MyVisits /></SidebarLayout>} />
                <Route path="/checkout/:paymentId" element={<MockStripeCheckout />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;