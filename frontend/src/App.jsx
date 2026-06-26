import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import MyVisits from './pages/MyVisits';
import { useState, useEffect, useRef } from 'react';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
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
import SidebarLayout from './components/SidebarLayout';
import AIChatBot from './components/AIChatBot';
import api from './api/axiosConfig';
import socket from './api/socket';

const Navigation = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  // Smart Alerts State
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
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
      socket.emit('setup', userInfo); // Joins a room with their user ID

      // REAL-TIME - Listen for incoming instant alerts
      socket.on('new_notification', (newNotif) => {
        // Instantly add the new notification to the top of the list and increase unread count
        setNotifications((prev) => [newNotif, ...prev]);
      });

      return () => {
        socket.off('new_notification');
      };
    }
  }, [userInfo?._id]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    setShowNotifs(false);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {}
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
      case 'alert': 
      case 'system': return '🚨';
      default: return '🔔';
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const handleExplicitMarkRead = async (e, id) => {
    e.stopPropagation(); // Prevents the link redirect from triggering
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error('Failed to mark as read'); }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation(); // Prevents the link redirect from triggering
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) { console.error('Failed to delete notification'); }
  };

  const handleLogout = () => { localStorage.removeItem('userInfo'); navigate('/login'); };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px',
      position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'var(--bg-nav)',
      backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>R</div>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>RealEstate</h2>
      </Link>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '500' }}>Home</Link>
        
        <button onClick={toggleTheme} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }} title="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {userInfo ? (
          <>
            {/* NOTIFICATION BELL WIDGET */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: 'relative', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--danger-color)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid var(--bg-nav)' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* DROPDOWN PANEL */}
              {showNotifs && (
                <div style={{ position: 'absolute', top: '50px', right: '-50px', width: '350px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-hover)' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Smart Alerts</h4>
                    {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</button>}
                  </div>
                  
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>You're all caught up!</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          onClick={() => handleNotificationClick(notif)} 
                          style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: notif.isRead ? 'transparent' : 'var(--bg-hover)', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                        >
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flex: 1 }}>
                            <div style={{ fontSize: '1.5rem' }}>{getNotificationIcon(notif.type)}</div>
                            <div>
                              <p style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', fontWeight: notif.isRead ? 'normal' : 'bold' }}>{notif.message}</p>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* ACTION BUTTONS (Read & Delete) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => handleExplicitMarkRead(e, notif._id)} 
                                title="Mark as Read"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontSize: '1.2rem', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                ☑
                              </button>
                            )}
                            <button 
                              onClick={(e) => handleDeleteNotification(e, notif._id)} 
                              title="Delete Notification"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                              onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              ☒
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
              {userInfo.profilePhoto ? <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{userInfo.name.charAt(0).toUpperCase()}</div>}
              <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } }}>{userInfo.name.split(' ')[0]}</span>
            </Link>
            
            <Link to={userInfo.role === 'buyer' ? '/buyer/dashboard' : userInfo.role === 'seller' ? '/dashboard' : '/admin'} style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', boxShadow: 'var(--shadow-sm)' }}>Dashboard</Link>
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
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navigation />
          {/* Global AI Chatbot Widget */}
          <AIChatBot /> 
          
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/profile" element={<SidebarLayout><Profile /></SidebarLayout>} />
              <Route path="/buyer/dashboard" element={<SidebarLayout><BuyerDashboard /></SidebarLayout>} />
              <Route path="/favorites" element={<SidebarLayout><Favorites /></SidebarLayout>} />
              <Route path="/purchases" element={<SidebarLayout><MyPurchases /></SidebarLayout>} />
              <Route path="/compare" element={<SidebarLayout><Compare /></SidebarLayout>} />
              <Route path="/admin/analytics" element={<SidebarLayout><AdminAnalytics /></SidebarLayout>} />
              <Route path="/admin/:tab?" element={<SidebarLayout><AdminDashboard /></SidebarLayout>} />
              <Route path="/analytics" element={<SidebarLayout><SellerAnalytics /></SidebarLayout>} />
              <Route path="/edit-property/:id" element={<SidebarLayout><EditProperty /></SidebarLayout>} />
              <Route path="/dashboard/:tab?" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
              <Route path="/visits" element={<SidebarLayout><MyVisits /></SidebarLayout>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;