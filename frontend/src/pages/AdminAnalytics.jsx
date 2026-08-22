import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line, AreaChart, Area, ComposedChart } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();
  
  // Filter States
  const [timeFilter, setTimeFilter] = useState('All');
  const [searchSeller, setSearchSeller] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  
  // Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        let url = '/admin/analytics';
        if (startDate || endDate) {
          url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        console.error("Failed to load admin analytics");
      } finally {
        setLoading(false);
      }
    };
    
    // Small debounce for dates to avoid spamming if typing
    const timeout = setTimeout(() => {
      fetchAdminData();
    }, 500);
    return () => clearTimeout(timeout);
    
  }, [navigate, startDate, endDate]);

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
      
      pdf.save(`Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      element.style.padding = originalPadding;
      element.style.backgroundColor = '';
      document.documentElement.setAttribute('data-theme', originalTheme);
      setIsExporting(false);
    }, 150);
  };

  const exportCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'sellers' && data?.topSellers) {
      csvContent += "Seller Name,Email,Total Deals,Gross Revenue\n";
      data.topSellers.forEach(s => {
        csvContent += `"${s.name}","${s.email}",${s.salesCount},${s.revenue}\n`;
      });
    } else if (type === 'orders' && data?.recentOrders) {
      csvContent += "Order ID,Buyer Name,Property,Status,Value\n";
      data.recentOrders.forEach(o => {
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

  // FILTERING LOGIC
  const trendData = data?.revenueTrend || [];
  const displayTrendData = useMemo(() => {
    if (timeFilter === 'All') return trendData;
    return trendData.slice(-Number(timeFilter));
  }, [trendData, timeFilter]);

  const filteredSellers = useMemo(() => {
    if (!data?.topSellers) return [];
    return data.topSellers.filter(s => s.name.toLowerCase().includes(searchSeller.toLowerCase()) || s.email.toLowerCase().includes(searchSeller.toLowerCase()));
  }, [data?.topSellers, searchSeller]);

  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    return data.recentOrders.filter(o => 
      o._id.toLowerCase().includes(searchOrder.toLowerCase()) || 
      (o.buyerId?.name || '').toLowerCase().includes(searchOrder.toLowerCase()) ||
      (o.propertyId?.title || '').toLowerCase().includes(searchOrder.toLowerCase())
    );
  }, [data?.recentOrders, searchOrder]);

  if (loading && !data) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Compiling Global Analytics...</h2></div>;
  if (!data) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--danger-color)' }}>Error loading system data.</h2></div>;

  const userPieData = [
    { name: 'Buyers', value: data.users.buyers },
    { name: 'Sellers', value: data.users.sellers },
  ];
  
  const geoData = data.properties.geoDistribution || [];
  const propertyStatusData = [
    { name: 'Active', value: data.properties.statusDistribution?.active || 0 },
    { name: 'Reserved', value: data.properties.statusDistribution?.reserved || 0 },
    { name: 'Sold', value: data.properties.statusDistribution?.sold || 0 },
    { name: 'Pending', value: data.properties.statusDistribution?.pending || 0 },
  ];

  const orderStatusData = [
    { name: 'Pending', count: data.sales.statusDistribution?.pending || 0 },
    { name: 'Approved', count: data.sales.statusDistribution?.approved || 0 },
    { name: 'Completed', count: data.sales.statusDistribution?.completed || 0 },
    { name: 'Cancelled', count: data.sales.statusDistribution?.cancelled || 0 },
  ];
  
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ef4444'];
  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', boxShadow: 'var(--shadow-lg)' };

  const avgDealSize = data.sales.completed > 0 ? (data.sales.totalRevenue / data.sales.completed) : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      {/* ADMIN BANNER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', 
        border: '1px solid rgba(139, 92, 246, 0.2)', 
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
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: '800' }}>Executive Command Center</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Global real-time analytics, revenue tracking, and network health.</p>
        </div>
        <button 
          disabled={isExporting} 
          onClick={exportPDF} 
          style={{ padding: '14px 24px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: isExporting ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s', opacity: isExporting ? 0.7 : 1 }}
          onMouseOver={e => !isExporting && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={e => !isExporting && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {isExporting ? 'Generating PDF...' : '📄 Export Executive PDF'}
        </button>
      </div>

      {/* SMART FILTER UI */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' }}>
        
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transactions Date Range:</label>
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

      {/* PRINTABLE REPORT CONTAINER */}
      <div ref={reportRef} style={{ padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.8rem', fontWeight: '900' }}>Real Estate Marketplace</h2>
          <h3 style={{ margin: '8px 0', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 'normal' }}>Global Executive Summary Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '15px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared By:</strong> {userInfo?.name} (Administrator)</span>
          </div>
        </div>

        {/* KPI CARDS (7 grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Live Online Users</h4>
              <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                🟢
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.users.online.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Total Network Users</h4>
              <div style={{ color: '#3b82f6' }}>👥</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.users.total.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Market Properties</h4>
              <div style={{ color: '#10b981' }}>🏢</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.properties.total.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Completed Orders</h4>
              <div style={{ color: '#f59e0b' }}>📦</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.sales.completed.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Gross Revenue</h4>
              <div style={{ color: '#8b5cf6' }}>💰</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#8b5cf6', fontWeight: '900' }}>
              Rs. {data.sales.totalRevenue >= 1000000 ? (data.sales.totalRevenue / 1000000).toFixed(1) + 'M' : data.sales.totalRevenue.toLocaleString()}
            </h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Avg Deal Size</h4>
              <div style={{ color: '#ec4899' }}>📈</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)', fontWeight: '900' }}>
              Rs. {avgDealSize >= 1000000 ? (avgDealSize / 1000000).toFixed(1) + 'M' : avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h2>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Open Disputes</h4>
              <div style={{ color: '#ef4444' }}>🚨</div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.2rem', color: data.openDisputes > 0 ? '#ef4444' : 'var(--text-main)', fontWeight: '900' }}>{data.openDisputes || 0}</h2>
          </div>
        </div>

        {/* AREA CHART WITH FORCED ANIMATION */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Real-Time Revenue Trajectory</h3>
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
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis tickFormatter={(value) => `Rs.${value >= 1000000 ? (value/1000000).toFixed(1)+'M' : value}`} stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHARTS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '40px' }}>
          
          {/* Geo Distribution */}
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Regional Distribution</h3>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={geoData} cx="50%" cy="45%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="count" stroke="none">
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
          
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Order Pipeline</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-muted)" />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
                    {orderStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Property Funnel</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {propertyStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} Properties`, 'Count']} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* DATA TABLES ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
          
          {/* Top Sellers Table */}
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Top Performers</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Search sellers..." 
                  value={searchSeller}
                  onChange={(e) => setSearchSeller(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                />
                <button 
                  onClick={() => exportCSV('sellers')}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  📥 CSV
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 10px' }}>Seller</th>
                    <th style={{ padding: '12px 10px' }}>Deals</th>
                    <th style={{ padding: '12px 10px' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.length > 0 ? filteredSellers.map((seller, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='rgba(139, 92, 246, 0.05)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding: '15px 10px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{seller.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{seller.email}</div>
                      </td>
                      <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{seller.salesCount}</td>
                      <td style={{ padding: '15px 10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Rs. {seller.revenue.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No sellers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recent Ledger</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                />
                <button 
                  onClick={() => exportCSV('orders')}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                  📥 CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 10px' }}>Order & Property</th>
                    <th style={{ padding: '12px 10px' }}>Buyer</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                    <tr key={order._id} style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='rgba(139, 92, 246, 0.05)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{ padding: '15px 10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>#{order._id.substring(order._id.length - 6).toUpperCase()}</div>
                        <Link to={`/property/${order.propertyId?._id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.propertyId?.title || 'Unknown Property'}</div>
                        </Link>
                      </td>
                      <td style={{ padding: '15px 10px', fontSize: '0.9rem', fontWeight: '500' }}>
                        {order.buyerId?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '15px 10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: order.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: order.status === 'Completed' ? '#10b981' : order.status === 'Cancelled' ? '#ef4444' : '#3b82f6'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>Rs. {((order.status === 'Completed' && order.finalSoldPrice) ? order.finalSoldPrice : (order.amount || 0)).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</td></tr>
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

export default AdminAnalytics;