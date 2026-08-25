import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// SVG Icons Library
const Icons = {
  dashboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  heart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>,
  calendar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>,
  bag: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
  scale: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>,
  user: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  plus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>,
  list: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>,
  message: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>,
  dollar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  chart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"></line><line x1="12" x2="12" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="14"></line></svg>,
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  building: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  globe: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>,
  settings: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
};

const SidebarLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo) return <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', minHeight: '85vh' }}>{children}</div>;

  let links = [];
  if (userInfo.role === 'buyer') {
    links = [
      { path: '/buyer/dashboard', label: 'Dashboard Home', icon: Icons.dashboard },
      { path: '/favorites', label: 'My Collection', icon: Icons.heart },
      { path: '/visits', label: 'My Itinerary', icon: Icons.calendar },
      { path: '/purchases', label: 'Investment Portfolio', icon: Icons.bag },
      { path: '/compare', label: 'Compare Matrix', icon: Icons.scale },
      { path: '/profile', label: 'Account Settings', icon: Icons.user },
    ];
  } else if (userInfo.role === 'seller') {
    links = [
      { path: '/analytics', label: 'Performance Analytics', icon: Icons.chart },
      { path: '/dashboard/add', label: 'Add New Listing', icon: Icons.plus },
      { path: '/dashboard/listings', label: 'Active Portfolio', icon: Icons.list },
      { path: '/dashboard/inquiries', label: 'Direct Messages', icon: Icons.message },
      { path: '/dashboard/visits', label: 'Viewing Requests', icon: Icons.calendar },
      { path: '/dashboard/sales', label: 'Deal Pipeline', icon: Icons.dollar },
      { path: '/profile', label: 'Account Settings', icon: Icons.user },
    ];
  } else if (userInfo.role === 'admin') {
    links = [
      { path: '/admin/analytics', label: 'Global Analytics', icon: Icons.globe },
      { path: '/admin/users', label: 'Manage Users', icon: Icons.users },
      { path: '/admin/properties', label: 'Manage Properties', icon: Icons.building },
      { path: '/admin/boosts', label: 'Revenue & Boosts', icon: Icons.dollar },
      { path: '/admin/disputes', label: 'Dispute Center', icon: Icons.scale },
      { path: '/admin/logs', label: 'Master Audit Trail', icon: Icons.list },
      { path: '/admin/settings', label: 'Platform Settings', icon: Icons.settings },
      { path: '/profile', label: 'Account Settings', icon: Icons.user },
    ];
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', borderTop: '1px solid var(--border-color)', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{
        width: isExpanded ? '280px' : '80px',
        backgroundColor: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: 'var(--shadow-sm)'
      }}>
        
        {/* Toggle Button Area */}
        <div style={{ padding: '20px 15px', display: 'flex', justifyContent: isExpanded ? 'flex-end' : 'center', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            style={{ 
              background: 'var(--bg-hover)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              cursor: 'pointer', 
              outline: 'none', 
              width: '35px', 
              height: '35px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--primary-color)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            {isExpanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            )}
          </button>
        </div>

        {/* Role Badge */}
        <div style={{ padding: '15px', display: 'flex', justifyContent: isExpanded ? 'flex-start' : 'center', borderBottom: '1px solid var(--border-color)', transition: 'all 0.3s' }}>
          {isExpanded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: userInfo.role === 'admin' ? '#f59e0b' : userInfo.role === 'seller' ? '#3b82f6' : '#10b981', boxShadow: `0 0 8px ${userInfo.role === 'admin' ? '#f59e0b' : userInfo.role === 'seller' ? '#3b82f6' : '#10b981'}` }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                {userInfo.role === 'admin' ? 'Admin Portal' : userInfo.role === 'seller' ? 'Seller Hub' : 'Buyer Hub'}
              </span>
            </div>
          ) : (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: userInfo.role === 'admin' ? '#f59e0b' : userInfo.role === 'seller' ? '#3b82f6' : '#10b981', boxShadow: `0 0 8px ${userInfo.role === 'admin' ? '#f59e0b' : userInfo.role === 'seller' ? '#3b82f6' : '#10b981'}` }}></div>
          )}
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px 10px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {links.map(link => {
            const isActive = location.pathname === link.path || 
              (location.pathname === '/dashboard' && link.path === '/dashboard/add') || 
              (location.pathname === '/admin' && link.path === '/admin/users');

            return (
              <Link
                key={link.path}
                to={link.path}
                title={!isExpanded ? link.label : ""}
                style={{
                  position: 'relative',
                  padding: '12px 15px',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.1) 0%, transparent 100%)' : 'transparent',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  gap: '15px',
                  fontWeight: isActive ? '800' : '600',
                  whiteSpace: 'nowrap',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                  e.currentTarget.querySelector('.nav-icon').style.transform = 'scale(1.15) translateY(-2px)';
                }}
                onMouseOut={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                  e.currentTarget.querySelector('.nav-icon').style.transform = 'scale(1) translateY(0)';
                }}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '15%', height: '70%', width: '4px', backgroundColor: 'var(--primary-color)', borderRadius: '0 4px 4px 0', boxShadow: '2px 0 8px rgba(37, 99, 235, 0.4)' }}></div>
                )}
                
                <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  {link.icon}
                </span>
                {isExpanded && <span style={{ fontSize: '0.95rem' }}>{link.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* MINI PROFILE ANCHOR (Bottom) */}
        <div style={{ padding: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer', flex: 1 }} onClick={() => navigate('/profile')}>
            {userInfo.profilePhoto ? (
              <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div style={{ display: isExpanded ? 'block' : 'none', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.3s' }}>
              <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{userInfo.name}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>{userInfo.role}</p>
            </div>
          </div>

          {/* Quick Logout Button */}
          {isExpanded && (
            <button 
              title="Logout"
              onClick={() => {
                localStorage.removeItem('userInfo');
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger-color)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          )}
        </div>

      </div>

      {/* Main Page Content */}
      <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', overflowY: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;