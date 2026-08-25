import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area, PieChart, Pie, Cell, AreaChart } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();
  
  // Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Table Filter States
  const [timeFilter, setTimeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchOrder, setSearchOrder] = useState('');

  // Fetch logic decoupled so it can be called silently by websockets
  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      let url = '/properties/seller/analytics';
      if (startDate || endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const { data } = await api.get(url);
      setAnalytics(data);
    } catch (err) {
      if (!silent) setError('Failed to load performance data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'seller') {
      navigate('/login');
      return;
    }

    // Debounce for date inputs
    const timeout = setTimeout(() => {
      fetchAnalytics();
    }, 500);
    return () => clearTimeout(timeout);
  }, [navigate, startDate, endDate]);

  // Real-Time Socket Listener
  useEffect(() => {
    const handleNewNotification = (notif) => {
      // If we receive an order, message, or visit update, silently re-fetch analytics
      if (['order', 'order_update', 'message', 'visit_update', 'review'].includes(notif.type)) {
        fetchAnalytics(true);
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [startDate, endDate]);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

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
      
      pdf.save(`Portfolio_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
      
      element.style.padding = originalPadding;
      element.style.backgroundColor = ''; 
      document.documentElement.setAttribute('data-theme', originalTheme);
      setIsExporting(false);
    }, 150);
  };

  const exportCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'listings' && analytics?.listings) {
      csvContent += "Property Title,Status,Traffic (Views),Leads (Msgs),Sales (Deals),Revenue Yield\n";
      analytics.listings.forEach(s => {
        csvContent += `"${s.title}","${s.status}",${s.views},${s.inquiries},${s.orders},${s.revenue}\n`;
      });
    } else if (type === 'orders' && analytics?.recentOrders) {
      csvContent += "Order ID,Buyer Name,Property,Status,Value\n";
      analytics.recentOrders.forEach(o => {
        csvContent += `"${o._id}","${o.buyerId?.name || 'Unknown'}","${o.propertyId?.title || 'Unknown'}","${o.status}",${(o.status === 'Completed' && o.finalSoldPrice) ? o.finalSoldPrice : (o.amount || 0)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State for Filtering the Analytics Table
  const filteredListings = analytics ? analytics.listings.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' ? true : item.status === filterStatus;
    return matchSearch && matchStatus;
  }) : [];

  const filteredOrders = useMemo(() => {
    if (!analytics?.recentOrders) return [];
    return analytics.recentOrders.filter(o => 
      o._id.toLowerCase().includes(searchOrder.toLowerCase()) || 
      (o.buyerId?.name || '').toLowerCase().includes(searchOrder.toLowerCase()) ||
      (o.propertyId?.title || '').toLowerCase().includes(searchOrder.toLowerCase())
    );
  }, [analytics?.recentOrders, searchOrder]);

  const trendData = analytics?.revenueTrend || [];
  const displayTrendData = useMemo(() => {
    if (timeFilter === 'All') return trendData;
    return trendData.slice(-Number(timeFilter));
  }, [trendData, timeFilter]);

  // Leaderboard Data (Top 5 properties by Views + Inquiries)
  const leaderboardData = useMemo(() => {
    if (!analytics?.listings) return [];
    return [...analytics.listings]
      .sort((a, b) => (b.views + b.inquiries) - (a.views + a.inquiries))
      .slice(0, 5)
      .map(item => ({
        name: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
        Views: item.views,
        Inquiries: item.inquiries,
        Orders: item.orders
      }));
  }, [analytics?.listings]);

  if (loading && !analytics) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Compiling your analytics...</h2></div>;
  if (error) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--danger-color)' }}>{error}</h2></div>;
  if (!analytics) return null;

  const funnelData = analytics.listings.map(item => ({
    name: item.title.length > 12 ? item.title.substring(0, 12) + '...' : item.title,
    Views: item.views,
    Inquiries: item.inquiries,
    Orders: item.orders
  }));

  const geoData = analytics.geoDistribution || [];
  const activeCount = analytics.listings.filter(l => l.status === 'Active').length;
  const soldCount = analytics.listings.filter(l => l.status === 'Sold').length;
  const statusPieData = [
    { name: 'Active', value: activeCount },
    { name: 'Sold', value: soldCount }
  ];
  
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', boxShadow: 'var(--shadow-lg)' };

  const conversionRate = analytics.summary.totalViews > 0 
    ? ((soldCount / analytics.summary.totalViews) * 100).toFixed(2) 
    : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      {/* BANNER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', 
        border: '1px solid rgba(59, 130, 246, 0.2)', 
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
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '800' }}>Portfolio Analytics</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Deep dive into your property performance metrics and market traction.</p>
        </div>
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

      {/* SMART FILTER UI */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' }}>
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

        {trendData.length > 0 && (
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue Trend Window:</label>
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

      {loading && <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '20px' }}>Refreshing data...</div>}

      {/* PDF EXPORT CONTAINER */}
      <div ref={reportRef} style={{ padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.8rem', fontWeight: '900' }}>LakEstates</h2>
          <h3 style={{ margin: '8px 0', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 'normal' }}>Seller Conversion & Performance Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '15px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared For:</strong> {userInfo?.name} (Seller)</span>
          </div>
        </div>

        {/* KPI METRICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Total Profile Views</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👁️</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '900' }}>{analytics.summary.totalViews.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Client Inquiries</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💬</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '900' }}>{analytics.summary.totalInquiries.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Avg Days on Market</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⏳</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#ec4899', fontWeight: '900' }}>{analytics.summary.averageDOM}d</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>View-to-Sale Ratio</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📈</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#10b981', fontWeight: '900' }}>{conversionRate}%</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Capital Generated</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💰</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#8b5cf6', fontWeight: '900' }}>
              Rs. {analytics.summary.totalSalesRevenue >= 1000000 ? (analytics.summary.totalSalesRevenue / 1000000).toFixed(1) + 'M' : analytics.summary.totalSalesRevenue.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* REVENUE AREA CHART */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Revenue Trajectory</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
              {displayTrendData.length} Months Displayed
            </span>
          </div>
          
          {displayTrendData.length === 0 ? (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No revenue data available to chart.
            </div>
          ) : (
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={timeFilter} data={displayTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueSeller" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis tickFormatter={(value) => `Rs.${value >= 1000000 ? (value/1000000).toFixed(1)+'M' : value}`} stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueSeller)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHARTS SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          
          {leaderboardData.length > 0 && (
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Property Performance Leaderboard</h3>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderboardData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-muted)" />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={120} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Views" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                    <Bar dataKey="Inquiries" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={15} />
                    <Bar dataKey="Orders" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Engagement Funnel Overlay</h3>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={funnelData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="Views" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={2} />
                  <Bar dataKey="Inquiries" barSize={20} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Orders" stroke="#10b981" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Portfolio Status Breakdown</h3>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                    {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Properties']} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {geoData.length > 0 && (
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Regional Distribution</h3>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={geoData} cx="50%" cy="45%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="count" stroke="none">
                      {geoData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} Properties`, 'Count']} itemStyle={{ fontWeight: 'bold' }} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={80} 
                      iconType="circle" 
                      wrapperStyle={{ maxHeight: '80px', overflowY: 'auto', fontSize: '12px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* DATA TABLES ROW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Granular Listing Metrics */}
          <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '25px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Granular Listing Metrics</h3>
                <button 
                  onClick={() => exportCSV('listings')}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  📥 CSV
                </button>
              </div>
              
              {/* SMART SEARCH & FILTER UI FOR ANALYTICS TABLE */}
              {analytics.listings.length > 0 && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                      <option value="All">All Properties</option>
                      <option value="Active">Active</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                  <div style={{ flex: '2 1 300px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                    <input 
                      type="text" 
                      placeholder="Search by property title..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Property Title</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Status</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Traffic (Views)</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Leads (Msgs)</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Sales (Deals)</th>
                    <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Revenue Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.listings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No listings to analyze.</td>
                    </tr>
                  ) : filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No metrics match your current search and filter.</td>
                    </tr>
                  ) : (
                    filteredListings.map(item => (
                      <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.05rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Link to={`/property/${item._id}`} style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
                            {item.title}
                          </Link>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <span style={{ 
                            backgroundColor: item.status === 'Sold' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'Active' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: item.status === 'Sold' ? '#10b981' : item.status === 'Active' ? '#3b82f6' : '#f59e0b', 
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' 
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '20px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>{item.views.toLocaleString()}</td>
                        <td style={{ padding: '20px', fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1rem' }}>{item.inquiries.toLocaleString()}</td>
                        <td style={{ padding: '20px', fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>{item.orders.toLocaleString()}</td>
                        <td style={{ padding: '20px', color: '#8b5cf6', fontWeight: '900', fontSize: '1.1rem' }}>Rs. {item.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Ledger */}
          <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '25px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recent Ledger</h3>
                <button 
                  onClick={() => exportCSV('orders')}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  📥 CSV
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                  <input 
                    type="text" 
                    placeholder="Search orders..." 
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '20px 15px' }}>Order & Property</th>
                    <th style={{ padding: '20px 15px' }}>Buyer</th>
                    <th style={{ padding: '20px 15px' }}>Status</th>
                    <th style={{ padding: '20px 15px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                    <tr key={order._id} style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='rgba(139, 92, 246, 0.05)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding: '20px 15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>#{order._id.substring(order._id.length - 6).toUpperCase()}</div>
                        <Link to={`/property/${order.propertyId?._id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--primary-color)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{order.propertyId?.title || 'Unknown Property'}</div>
                        </Link>
                      </td>
                      <td style={{ padding: '20px 15px', fontSize: '1rem', fontWeight: '500' }}>
                        {order.buyerId?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '20px 15px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          backgroundColor: order.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: order.status === 'Completed' ? '#10b981' : order.status === 'Cancelled' ? '#ef4444' : '#3b82f6'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 15px', fontWeight: '900', color: '#8b5cf6', fontSize: '1.1rem' }}>Rs. {((order.status === 'Completed' && order.finalSoldPrice) ? order.finalSoldPrice : (order.amount || 0)).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SellerAnalytics;