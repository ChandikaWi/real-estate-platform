import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, ComposedChart, Line } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();

  // Raw Data States
  const [rawFavorites, setRawFavorites] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [rawVisits, setRawVisits] = useState([]);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Loading States
  const [actionLoading, setActionLoading] = useState(null);
  
  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, activity: null });

  // Dashboard Colors 
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];

  const fetchDashboardData = async (silent = false) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) return;
    try {
      if (!silent) setLoading(true);
      const [favRes, orderRes, visitRes] = await Promise.all([
        api.get(`/favorites/user/${userInfo._id}`),
        api.get('/orders/buyer'),
        api.get('/visits/buyer')
      ]);

      setRawFavorites(favRes.data || []);
      setRawOrders(orderRes.data || []);
      setRawVisits(visitRes.data || []);
    } catch (err) {
      if (!silent) setError("Failed to fetch dashboard data");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'buyer') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  // Real-Time Socket Listener
  useEffect(() => {
    const handleNewNotification = (notif) => {
      if (['order_update', 'visit_update', 'visit_request', 'message'].includes(notif.type)) {
        fetchDashboardData(true);
      }
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Filtering Logic
  const { filteredFavs, filteredOrders, filteredVisits } = useMemo(() => {
    const filterByDate = (arr, dateField = 'createdAt') => {
      return arr.filter(item => {
        const itemDate = new Date(item[dateField]);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    };
    return {
      filteredFavs: filterByDate(rawFavorites),
      filteredOrders: filterByDate(rawOrders),
      filteredVisits: filterByDate(rawVisits)
    };
  }, [rawFavorites, rawOrders, rawVisits, startDate, endDate]);

  // General Calculations & Target Budget
  const stats = useMemo(() => {
    const spent = filteredOrders.reduce((sum, order) => sum + (order.status === 'Completed' ? (order.finalSoldPrice || order.amount) : 0), 0);
    
    const typeCounts = { house: 0, apartment: 0, land: 0 };
    let totalPrice = 0;
    let pricedPropertyCount = 0;

    filteredFavs.forEach(fav => { 
      if (fav.propertyId) {
        if (fav.propertyId.type) typeCounts[fav.propertyId.type]++; 
        if (fav.propertyId.price) { totalPrice += fav.propertyId.price; pricedPropertyCount++; }
      }
    });

    filteredOrders.forEach(o => {
      if (o.propertyId && o.propertyId.price) {
        totalPrice += (o.status === 'Completed' && o.finalSoldPrice) ? o.finalSoldPrice : o.propertyId.price;
        pricedPropertyCount++;
      }
    });
    
    const favCategories = Object.keys(typeCounts)
      .filter(key => typeCounts[key] > 0)
      .map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: typeCounts[key] }));

    return {
      favCount: filteredFavs.length,
      orderCount: filteredOrders.filter(o => o.status === 'Completed').length,
      visitCount: filteredVisits.filter(v => v.status === 'Pending' || v.status === 'Accepted').length,
      totalSpent: spent,
      favCategories,
      averageBudget: pricedPropertyCount > 0 ? Math.round(totalPrice / pricedPropertyCount) : 0
    };
  }, [filteredFavs, filteredOrders, filteredVisits]);

  // Geo-Distribution (Preferred Hotspots)
  const geoDistribution = useMemo(() => {
    const geoMap = {};
    filteredFavs.forEach(fav => {
      if (fav.propertyId && fav.propertyId.location && fav.propertyId.location.city) {
        geoMap[fav.propertyId.location.city] = (geoMap[fav.propertyId.location.city] || 0) + 1;
      }
    });
    filteredOrders.forEach(o => {
      if (o.propertyId && o.propertyId.location && o.propertyId.location.city) {
        geoMap[o.propertyId.location.city] = (geoMap[o.propertyId.location.city] || 0) + 2; // Weight orders slightly higher
      }
    });
    return Object.keys(geoMap).map(city => ({ name: city, value: geoMap[city] }));
  }, [filteredFavs, filteredOrders]);

  // Spending Trend Calculation
  const spendingTrend = useMemo(() => {
    const months = {};
    const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[monthYear] = 0;
    }

    completedOrders.forEach(o => {
      const d = new Date(o.updatedAt || o.createdAt);
      const monthYear = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (months[monthYear] !== undefined) {
        months[monthYear] += (o.finalSoldPrice || o.amount || 0);
      }
    });

    return Object.keys(months).map(key => ({ name: key, spent: months[key] }));
  }, [filteredOrders]);

  const displayTrendData = useMemo(() => {
    if (timeFilter === 'All') return spendingTrend;
    return spendingTrend.slice(-Number(timeFilter));
  }, [spendingTrend, timeFilter]);

  // Buyer Journey Funnel Data
  const funnelData = [
    { name: 'Favorites', count: filteredFavs.length },
    { name: 'Visits', count: filteredVisits.length },
    { name: 'Purchases', count: filteredOrders.length }
  ];

  // Unified Recent Activity Ledger
  const recentActivity = useMemo(() => {
    let activities = [];
    
    filteredFavs.forEach(f => {
      activities.push({
        id: f._id,
        type: 'Favorite',
        title: f.propertyId?.title || 'Unknown Property',
        propertyId: f.propertyId?._id,
        status: 'Active',
        date: new Date(f.createdAt),
        actionType: 'delete_favorite'
      });
    });

    filteredVisits.forEach(v => {
      activities.push({
        id: v._id,
        type: 'Site Visit',
        title: v.propertyId?.title || 'Unknown Property',
        propertyId: v.propertyId?._id,
        status: v.status,
        date: new Date(v.createdAt),
        actionType: 'cancel_visit'
      });
    });

    filteredOrders.forEach(o => {
      activities.push({
        id: o._id,
        type: 'Purchase',
        title: o.propertyId?.title || 'Unknown Property',
        propertyId: o.propertyId?._id,
        status: o.status,
        date: new Date(o.createdAt),
        actionType: null // No direct action on completed orders from this list
      });
    });

    // Sort by date descending
    activities.sort((a, b) => b.date - a.date);
    
    // Apply smart search
    if (searchQuery) {
      activities = activities.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return activities.slice(0, 15); // Show top 15 recent
  }, [filteredFavs, filteredVisits, filteredOrders, searchQuery]);

  // Quick Action Handlers
  const openConfirmModal = (activity) => {
    if (actionLoading === activity.id) return;
    if (activity.actionType === 'cancel_visit' && activity.status !== 'Pending') {
      alert("You can only cancel pending visits.");
      return;
    }
    setConfirmModal({ isOpen: true, activity });
  };

  const executeAction = async () => {
    const activity = confirmModal.activity;
    if (!activity) return;
    
    try {
      setConfirmModal({ isOpen: false, activity: null });
      setActionLoading(activity.id);
      
      if (activity.actionType === 'delete_favorite') {
        await api.delete(`/favorites/${activity.id}`);
      } else if (activity.actionType === 'cancel_visit') {
        await api.delete(`/visits/${activity.id}`);
      }
      
      fetchDashboardData(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing action');
    } finally {
      setActionLoading(null);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    const element = reportRef.current;
    const originalTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    
    setTimeout(async () => {
      const originalPadding = element.style.padding;
      element.style.padding = '40px';
      element.style.backgroundColor = '#ffffff'; 
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Buyer_Portfolio_${new Date().toISOString().split('T')[0]}.pdf`);
      element.style.padding = originalPadding;
      element.style.backgroundColor = ''; 
      document.documentElement.setAttribute('data-theme', originalTheme);
      setIsExporting(false);
    }, 150);
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Activity Type,Property,Status,Date\n";
    recentActivity.forEach(a => {
      csvContent += `"${a.type}","${a.title}","${a.status}","${a.date.toLocaleDateString()}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '10px' };

  if (loading && rawFavorites.length === 0) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading your dashboard...</h2></div>;
  if (error) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--danger-color)' }}>{error}</h2></div>;

  return (
    <div style={{ color: 'var(--text-main)', maxWidth: '1400px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      
      {/* BANNER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', 
        border: '1px solid rgba(37, 99, 235, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '30px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '800' }}>
            Welcome back, {userInfo?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Your personal real estate command center.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => navigate('/')} style={{ padding: '14px 24px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
            Explore Market
          </button>
          <button 
            disabled={isExporting} 
            onClick={exportPDF} 
            style={{ padding: '14px 24px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: isExporting ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s', opacity: isExporting ? 0.7 : 1 }}
            onMouseOver={e => !isExporting && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !isExporting && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isExporting ? 'Generating PDF...' : '📄 Download Report'}
          </button>
        </div>
      </div>
      
      {/* QUICK NAVIGATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
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

      {/* SMART FILTER UI */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Timeline:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
          />
        </div>

        {spendingTrend.length > 0 && (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spending Trend Window:</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)} 
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <option value="All">12 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="3">Last 3 Months</option>
            </select>
          </div>
        )}
      </div>

      <div ref={reportRef} style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--bg-main)' }}>
        
        {/* AT A GLANCE METRICS */}
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Portfolio Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          
          <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Saved Properties</h4>
              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Active</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.favCount}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Site Visits</h4>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.visitCount}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Purchases</h4>
              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Completed</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>{stats.orderCount}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Average Target Budget</h4>
              <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Market</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: '#8b5cf6' }}>
              Rs. {stats.averageBudget > 0 ? (stats.averageBudget >= 1000000 ? (stats.averageBudget / 1000000).toFixed(1) + 'M' : stats.averageBudget.toLocaleString()) : '0'}
            </h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Total Invested</h4>
              <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Lifetime</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>
              Rs. {stats.totalSpent > 0 ? (stats.totalSpent >= 1000000 ? (stats.totalSpent / 1000000).toFixed(1) + 'M' : stats.totalSpent.toLocaleString()) : '0'}
            </h2>
          </div>

        </div>

        {/* ANALYTICS CHARTS */}
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>Engagement Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          
          {/* Spending Area Chart */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Spending Trajectory</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                {displayTrendData.length} Months
              </span>
            </div>
            {displayTrendData.every(d => d.spent === 0) ? (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No spending data in this period.
              </div>
            ) : (
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                    <YAxis tickFormatter={(value) => `Rs.${value >= 1000000 ? (value/1000000).toFixed(1)+'M' : value}`} stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Spent']} />
                    <Area type="monotone" dataKey="spent" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSpend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Buyer Journey Funnel Overlay */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-main)' }}>Buyer Journey Conversion</h3>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={funnelData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="count" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={2} name="Total Pipeline" />
                  <Bar dataKey="count" barSize={30} fill="#f59e0b" radius={[4, 4, 0, 0]} name="Volume" />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} name="Trend" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geo Distribution Chart */}
          {geoDistribution.length > 0 && (
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-main)' }}>Preferred Market Hotspots</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={geoDistribution} cx="50%" cy="45%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                      {geoDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} Interactions`, 'Engagement']} itemStyle={{ fontWeight: 'bold' }} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60} 
                      iconType="circle" 
                      wrapperStyle={{ maxHeight: '60px', overflowY: 'auto', fontSize: '12px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pie Chart - Interests */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-main)' }}>Interest by Property Type</h3>
            {stats.favCategories.length === 0 ? (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                Save properties to generate insights.
              </div>
            ) : (
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.favCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                      {stats.favCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY LEDGER */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '25px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Recent Activity Ledger</h3>
              <button 
                onClick={exportCSV}
                style={{ padding: '8px 16px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                📥 Export CSV
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                <input 
                  type="text" 
                  placeholder="Search activity by property or type..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '20px 25px' }}>Activity Type</th>
                  <th style={{ padding: '20px 25px' }}>Property</th>
                  <th style={{ padding: '20px 25px' }}>Status</th>
                  <th style={{ padding: '20px 25px' }}>Date</th>
                  <th style={{ padding: '20px 25px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length > 0 ? recentActivity.map((activity) => (
                  <tr key={activity.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      <span style={{ 
                        marginRight: '10px',
                        fontSize: '1.2rem'
                      }}>
                        {activity.type === 'Favorite' ? '❤️' : activity.type === 'Site Visit' ? '📅' : '💰'}
                      </span>
                      {activity.type}
                    </td>
                    <td style={{ padding: '20px 25px', fontSize: '1.05rem', fontWeight: '600' }}>
                      <Link to={`/property/${activity.propertyId}`} style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
                        {activity.title}
                      </Link>
                    </td>
                    <td style={{ padding: '20px 25px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: (activity.status === 'Completed' || activity.status === 'Accepted' || activity.status === 'Active') ? 'rgba(16, 185, 129, 0.1)' : activity.status === 'Cancelled' || activity.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: (activity.status === 'Completed' || activity.status === 'Accepted' || activity.status === 'Active') ? '#10b981' : activity.status === 'Cancelled' || activity.status === 'Rejected' ? '#ef4444' : '#3b82f6'
                      }}>
                        {activity.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px 25px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {activity.date.toLocaleDateString()}
                    </td>
                    <td style={{ padding: '20px 25px', textAlign: 'center' }}>
                      {activity.actionType && (
                        <button 
                          onClick={() => openConfirmModal(activity)}
                          disabled={actionLoading === activity.id || (activity.actionType === 'cancel_visit' && activity.status !== 'Pending')}
                          title={activity.actionType === 'delete_favorite' ? 'Remove Favorite' : 'Cancel Pending Visit'}
                          style={{
                            backgroundColor: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: (actionLoading === activity.id || (activity.actionType === 'cancel_visit' && activity.status !== 'Pending')) ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            fontSize: '1.2rem',
                            opacity: (actionLoading === activity.id || (activity.actionType === 'cancel_visit' && activity.status !== 'Pending')) ? 0.5 : 1
                          }}
                          onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'var(--danger-color)'; }}}
                          onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}}
                        >
                          {activity.actionType === 'delete_favorite' ? '❌' : '🚫'}
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No recent activity found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && confirmModal.activity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '30px',
            borderRadius: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '15px' 
            }}>
              {confirmModal.activity.actionType === 'delete_favorite' ? '🗑️' : '🚫'}
            </div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--text-main)' }}>
              Are you sure?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '1.05rem', lineHeight: '1.5' }}>
              {confirmModal.activity.actionType === 'delete_favorite' 
                ? `You are about to remove "${confirmModal.activity.title}" from your saved properties.`
                : `You are about to cancel your pending site visit for "${confirmModal.activity.title}".`
              }
              <br/>This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, activity: null })}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Go Back
              </button>
              <button 
                onClick={executeAction}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--danger-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Yes, {confirmModal.activity.actionType === 'delete_favorite' ? 'Remove' : 'Cancel Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuyerDashboard;