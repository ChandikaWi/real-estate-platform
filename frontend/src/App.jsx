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

const Navigation = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#2c3e50' }}>
        <h2 style={{ margin: 0 }}>Real Estate Marketplace</h2>
      </Link>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/">Home</Link>
        {userInfo ? (
          <>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', marginRight: '15px' }}>
              {userInfo.profilePhoto ? (
                <img src={userInfo.profilePhoto} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
              )}
              {userInfo.name}
            </Link>
            
            {userInfo.role === 'buyer' && <Link to="/purchases">My Purchases</Link>}
            {userInfo.role === 'buyer' && <Link to="/compare">Compare</Link>}
            {userInfo.role === 'buyer' && <Link to="/favorites">My Favorites</Link>}
            {userInfo.role === 'seller' && <Link to="/dashboard">Dashboard</Link>}
            {userInfo.role === 'seller' && <Link to="/analytics">Analytics</Link>}
            {userInfo.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
            {userInfo.role === 'admin' && <Link to="/admin/analytics">Global Analytics</Link>}
            
            <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '5px 10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px' }}>Logout</button>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/edit-property/:id" element={<EditProperty />} />
            <Route path="/purchases" element={<MyPurchases />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<SellerAnalytics />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;