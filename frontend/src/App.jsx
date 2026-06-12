import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
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

const Navigation = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#2c3e50' }}>
        <h2 style={{ margin: 0 }}>Real Estate Marketplace</h2>
      </Link>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/">Home</Link>
        {userInfo ? (
          <>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', margin: '0 15px' }}>
              {userInfo.profilePhoto ? (
                <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
              {userInfo.name}
            </Link>
            
            {/* Unified Dashboard Link depending on Role */}
            <Link to={userInfo.role === 'buyer' ? '/buyer/dashboard' : userInfo.role === 'seller' ? '/dashboard' : '/admin'} style={{ padding: '8px 15px', backgroundColor: '#ecf0f1', color: '#2c3e50', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
              Dashboard
            </Link>
            
            <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '8px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', fontFamily: 'system-ui' }}>
        <Navigation />
        <main>
          <Routes>
            {/* Public Routes (No Sidebar) */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/property/:id" element={<PropertyDetails />} />

            {/* Dashboard & Profile Routes */}
            <Route path="/profile" element={<SidebarLayout><Profile /></SidebarLayout>} />
            
            {/* Buyer Routes */}
            <Route path="/buyer/dashboard" element={<SidebarLayout><BuyerDashboard /></SidebarLayout>} />
            <Route path="/favorites" element={<SidebarLayout><Favorites /></SidebarLayout>} />
            <Route path="/purchases" element={<SidebarLayout><MyPurchases /></SidebarLayout>} />
            <Route path="/compare" element={<SidebarLayout><Compare /></SidebarLayout>} />

            {/* Admin Routes */}
            <Route path="/admin/analytics" element={<SidebarLayout><AdminAnalytics /></SidebarLayout>} />
            <Route path="/admin/:tab?" element={<SidebarLayout><AdminDashboard /></SidebarLayout>} />

            {/* Seller Routes */}
            <Route path="/analytics" element={<SidebarLayout><SellerAnalytics /></SidebarLayout>} />
            <Route path="/edit-property/:id" element={<SidebarLayout><EditProperty /></SidebarLayout>} />
            <Route path="/dashboard/:tab?" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;