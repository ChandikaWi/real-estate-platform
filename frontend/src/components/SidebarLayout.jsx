import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // If user isn't logged in, just render the page normally
  if (!userInfo) return <div style={{ padding: '20px' }}>{children}</div>;

  let links = [];
  if (userInfo.role === 'buyer') {
    links = [
      { path: '/buyer/dashboard', label: 'Dashboard Home', icon: '🏠' },
      { path: '/favorites', label: 'My Favorites', icon: '❤️' },
      { path: '/visits', label: 'My Visits', icon: '📅' },
      { path: '/purchases', label: 'My Purchases', icon: '🛍️' },
      { path: '/compare', label: 'Compare Properties', icon: '⚖️' },
      { path: '/profile', label: 'Manage Account', icon: '👤' },
    ];
  } else if (userInfo.role === 'seller') {
    links = [
      { path: '/dashboard/add', label: 'Add New Property', icon: '➕' },
      { path: '/dashboard/listings', label: 'Active Listings', icon: '📋' },
      { path: '/dashboard/inquiries', label: 'Live Inquiries', icon: '💬' },
      { path: '/dashboard/visits', label: 'Visit Requests', icon: '📅' },
      { path: '/dashboard/sales', label: 'Orders Received', icon: '💰' },
      { path: '/analytics', label: 'Performance Analytics', icon: '📈' },
      { path: '/profile', label: 'Manage Account', icon: '👤' },
    ];
  } else if (userInfo.role === 'admin') {
    links = [
      { path: '/admin/users', label: 'Manage Users', icon: '👥' },
      { path: '/admin/properties', label: 'Manage Properties', icon: '🏢' },
      { path: '/admin/analytics', label: 'Global Analytics', icon: '🌍' },
      { path: '/profile', label: 'Manage Account', icon: '👤' },
    ];
  }

  return (
    <div style={{ display: 'flex', minHeight: '85vh', borderTop: '1px solid var(--border-color)' }}>
      {/* Sidebar */}
      <div style={{
        width: isExpanded ? '260px' : '70px',
        backgroundColor: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ padding: '15px', background: 'var(--bg-hover)', color: 'var(--text-main)', border: 'none', cursor: 'pointer', textAlign: isExpanded ? 'right' : 'center', outline: 'none', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}
        >
          {isExpanded ? '◀ Collapse Menu' : '▶'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '15px 0' }}>
          {links.map(link => {
            const isActive = location.pathname === link.path || 
              (location.pathname === '/dashboard' && link.path === '/dashboard/add') || 
              (location.pathname === '/admin' && link.path === '/admin/users');

            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '15px 20px',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  whiteSpace: 'nowrap',
                  borderLeft: isActive ? '4px solid var(--primary-color)' : '4px solid transparent',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                {isExpanded && <span>{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Page Content */}
      <div style={{ flex: 1, padding: '30px', backgroundColor: 'var(--bg-main)', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;