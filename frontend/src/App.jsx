import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

// Import Pages
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
import MyVisits from './pages/MyVisits';

const Navigation = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 30px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'var(--bg-nav)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
          R
        </div>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px' }}>RealEstate</h2>
      </Link>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '500' }}>Home</Link>
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
          title="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {userInfo ? (
          <>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
              {userInfo.profilePhoto ? (
                <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } }}>{userInfo.name.split(' ')[0]}</span>
            </Link>
            
            <Link to={userInfo.role === 'buyer' ? '/buyer/dashboard' : userInfo.role === 'seller' ? '/dashboard' : '/admin'} style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', boxShadow: 'var(--shadow-sm)' }}>
              Dashboard
            </Link>
            
            <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '8px 20px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '6px', fontWeight: '600' }}>
              Logout
            </button>
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