import { Link } from 'react-router-dom';

const BuyerDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div>
      <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Buyer Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Welcome back, {userInfo?.name}. Navigate your account using the sidebar menu.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Link to="/favorites" style={{ textDecoration: 'none', padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '2.5rem' }}>❤️</h2>
          <h3 style={{ margin: 0 }}>My Favorites</h3>
        </Link>
        <Link to="/purchases" style={{ textDecoration: 'none', padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '2.5rem' }}>🛍️</h2>
          <h3 style={{ margin: 0 }}>My Purchases</h3>
        </Link>
        <Link to="/compare" style={{ textDecoration: 'none', padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '2.5rem' }}>⚖️</h2>
          <h3 style={{ margin: 0 }}>Compare Tool</h3>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboard;