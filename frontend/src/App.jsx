import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Nav component to handle the logout logic and links
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
            <span style={{ fontWeight: 'bold' }}>Hello, {userInfo.name}</span>
            {userInfo.role === 'seller' && <Link to="/dashboard">Dashboard</Link>}
            <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;