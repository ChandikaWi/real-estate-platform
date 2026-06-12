import { Link } from 'react-router-dom';

const BuyerDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div>
      <h1 style={{ margin: '0 0 10px 0' }}>Buyer Dashboard</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Welcome back, {userInfo?.name}. Navigate your account using the sidebar menu.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Link to="/favorites" style={{ textDecoration: 'none', padding: '30px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#2c3e50' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>❤️</h2>
          <h3>My Favorites</h3>
        </Link>
        <Link to="/purchases" style={{ textDecoration: 'none', padding: '30px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#2c3e50' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>🛍️</h2>
          <h3>My Purchases</h3>
        </Link>
        <Link to="/compare" style={{ textDecoration: 'none', padding: '30px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: '#2c3e50' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>⚖️</h2>
          <h3>Compare Tool</h3>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboard;