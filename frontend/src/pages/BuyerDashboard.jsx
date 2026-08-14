import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const BuyerDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const navigate = useNavigate();
  const [stats, setStats] = useState({ favCount: 0, orderCount: 0, visitCount: 0, totalSpent: 0, favCategories: [] });
  const [loading, setLoading] = useState(true);

  // Dashboard Colors 
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userInfo) return;
      try {
        const [favRes, orderRes, visitRes] = await Promise.all([
          api.get(`/favorites/user/${userInfo._id}`),
          api.get('/orders/buyer'),
          api.get('/visits/buyer')
        ]);

        const favorites = favRes.data;
        const orders = orderRes.data;
        const visits = visitRes.data;

        const spent = orders.reduce((sum, order) => sum + (order.status !== 'Cancelled' ? order.amount : 0), 0);

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

  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '10px' };

  return (
    <div style={{ color: 'var(--text-main)', maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      
      {/* WELCOME BANNER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', 
        border: '1px solid rgba(37, 99, 235, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>
            Welcome back, {userInfo?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Your personal real estate command center.
          </p>
        </div>
        <button onClick={() => navigate('/')} style={{ padding: '14px 28px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          Explore Market
        </button>
      </div>
      
      {/* PROFESSIONAL QUICK NAVIGATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        
        <Link to="/favorites" style={{ textDecoration: 'none', padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'all 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--danger-color)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <div><h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Saved Properties</h3><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>View your wishlist</p></div>
        </Link>

        <Link to="/purchases" style={{ textDecoration: 'none', padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'all 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <div><h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>My Purchases</h3><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track transactions</p></div>
        </Link>

        <Link to="/compare" style={{ textDecoration: 'none', padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)', transition: 'all 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
          </div>
          <div><h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Compare Tool</h3><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyze listings</p></div>
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}><h3 style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</h3></div>
      ) : (
        <>
          {/* AT A GLANCE METRICS */}
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Portfolio Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '50px' }}>
            
            <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600' }}>Favorites</h4>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Active</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.favCount}</h2>
            </div>

            <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600' }}>Site Visits</h4>
                <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.visitCount}</h2>
            </div>

            <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600' }}>Purchases</h4>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Completed</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.orderCount}</h2>
            </div>

            <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600' }}>Total Invested</h4>
              </div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                Rs. {stats.totalSpent > 0 ? (stats.totalSpent / 1000000).toFixed(1) + 'M' : '0'}
              </h2>
            </div>

          </div>

          {/* ANALYTICS CHARTS */}
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Engagement Analytics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
            
            {/* Pie Chart - Interests */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-main)' }}>Interest by Property Type</h3>
              {stats.favCategories.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                  Save properties to generate insights.
                </div>
              ) : (
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.favCategories} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                        {stats.favCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bar Chart - Activity Engagement */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-main)' }}>Platform Engagement</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Favorites', count: stats.favCount, fill: COLORS[0] },
                    { name: 'Visits', count: stats.visitCount, fill: COLORS[3] },
                    { name: 'Purchases', count: stats.orderCount, fill: COLORS[1] }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                    <YAxis allowDecimals={false} stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'var(--bg-hover)'}} itemStyle={{ color: 'var(--text-main)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {
                        [{ name: 'Favorites', fill: COLORS[0] }, { name: 'Visits', fill: COLORS[3] }, { name: 'Purchases', fill: COLORS[1] }].map((entry, index) => (
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