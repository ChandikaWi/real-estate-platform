import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const BuyerDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [stats, setStats] = useState({ favCount: 0, orderCount: 0, visitCount: 0, totalSpent: 0, favCategories: [] });
  const [loading, setLoading] = useState(true);

  // Colors for the charts
  const COLORS = ['#3498db', '#2ecc71', '#9b59b6'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userInfo) return;
      try {
        // Fetch all relevant buyer data simultaneously for speed
        const [favRes, orderRes, visitRes] = await Promise.all([
          api.get(`/favorites/user/${userInfo._id}`),
          api.get('/orders/buyer'),
          api.get('/visits/buyer')
        ]);

        const favorites = favRes.data;
        const orders = orderRes.data;
        const visits = visitRes.data;

        // Calculate Total Spent
        const spent = orders.reduce((sum, order) => sum + (order.status !== 'Cancelled' ? order.amount : 0), 0);

        // Group favorites by property type for the Pie Chart
        const typeCounts = { house: 0, apartment: 0, land: 0 };
        favorites.forEach(fav => { if (fav.propertyId && fav.propertyId.type) typeCounts[fav.propertyId.type]++; });
        
        const favCategories = Object.keys(typeCounts)
          .filter(key => typeCounts[key] > 0)
          .map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: typeCounts[key] }));

        setStats({
          favCount: favorites.length,
          orderCount: orders.length,
          visitCount: visits.filter(v => v.status === 'Pending' || v.status === 'Accepted').length,
          totalSpent: spent,
          favCategories
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userInfo?._id]);

  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' };

  return (
    <div style={{ color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ margin: '0 0 10px 0' }}>Buyer Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Welcome back, {userInfo?.name}. Here is an overview of your real estate journey.</p>
      
      {/* Quick Navigation Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
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

      {loading ? (
        <h3 style={{ color: 'var(--text-muted)' }}>Loading your analytics...</h3>
      ) : (
        <>
          {/* Metric Cards */}
          <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>Your Activity Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid var(--primary-color)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Saved Properties</h4>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{stats.favCount}</h2>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Upcoming Visits</h4>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{stats.visitCount}</h2>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid var(--accent-color)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Properties Bought</h4>
              <h2 style={{ margin: 0, fontSize: '2rem' }}>{stats.orderCount}</h2>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid #8e44ad' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Invested</h4>
              <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-color)' }}>Rs. {stats.totalSpent.toLocaleString()}</h2>
            </div>
          </div>

          {/* Analytics Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
            
            {/* Pie Chart - Interests */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Your Interests by Type</h3>
              {stats.favCategories.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Save properties to see your interest breakdown.</div>
              ) : (
                <div style={{ height: '250px', marginTop: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.favCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                        {stats.favCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Properties']} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bar Chart - Spending/Orders */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Engagement Scale</h3>
              <div style={{ height: '250px', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Favorites', count: stats.favCount, fill: '#3498db' },
                    { name: 'Visits', count: stats.visitCount, fill: '#f39c12' },
                    { name: 'Purchases', count: stats.orderCount, fill: 'var(--accent-color)' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" />
                    <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'var(--bg-hover)'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {
                        [{ name: 'Favorites', count: stats.favCount, fill: '#3498db' }, { name: 'Visits', count: stats.visitCount, fill: '#f39c12' }, { name: 'Purchases', count: stats.orderCount, fill: 'var(--accent-color)' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default BuyerDashboard;