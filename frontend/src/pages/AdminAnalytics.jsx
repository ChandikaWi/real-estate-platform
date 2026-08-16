import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  // Filter State for the Trend Chart
  const [timeFilter, setTimeFilter] = useState('All');
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    const fetchAdminData = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load admin analytics");
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [navigate, userInfo]);

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

  // FILTERING LOGIC
  const trendData = data?.revenueTrend || [];
  
  const displayTrendData = useMemo(() => {
    if (timeFilter === 'All') return trendData;
    // Returns the last N elements of the array
    return trendData.slice(-Number(timeFilter));
  }, [trendData, timeFilter]);

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Compiling Global Analytics...</h2></div>;
  if (!data) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--danger-color)' }}>Error loading system data.</h2></div>;

  const userPieData = [
    { name: 'Buyers', value: data.users.buyers },
    { name: 'Sellers', value: data.users.sellers },
  ];
  
  const propertyBarData = [
    { name: 'Houses', count: data.properties.houses },
    { name: 'Apartments', count: data.properties.apartments },
    { name: 'Land', count: data.properties.lands },
  ];
  
  const PIE_COLORS = ['#3b82f6', '#10b981'];
  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', boxShadow: 'var(--shadow-lg)' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
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
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Platform Overview</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Global statistics, demographic distribution, and system health.</p>
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
      {trendData.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Trend Data:</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)} 
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <option value="All">All Time ({trendData.length})</option>
              <option value="30">Last 30 Records</option>
              <option value="10">Last 10 Records</option>
              <option value="5">Last 5 Records</option>
            </select>
          </div>
        </div>
      )}

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

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '50px' }}>
          
          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Total Network Users</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.users.total.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Market Properties</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path></svg>
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.properties.total.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Completed Orders</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" x2="21" y1="6" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '900' }}>{data.sales.completed.toLocaleString()}</h2>
          </div>

          <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold' }}>Gross Revenue</h4>
              <div style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#8b5cf6', fontWeight: '900' }}>
              Rs. {data.sales.totalRevenue > 0 ? (data.sales.totalRevenue / 1000000).toFixed(1) + 'M' : '0'}
            </h2>
          </div>
        </div>

        {/* CHARTS ROW 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
          
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>User Demographics Matrix</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                    {userPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} Users`, 'Count']} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Inventory Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={propertyBarData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  <Bar dataKey="count" fill="var(--accent-color)" barSize={50} radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="count" stroke="var(--primary-color)" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AREA CHART WITH FORCED ANIMATION */}
        <div style={{ backgroundColor: 'var(--bg-main)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Fiscal Growth & Revenue Trajectory</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
              Showing {displayTrendData.length} Points
            </span>
          </div>
          
          {displayTrendData.length === 0 ? (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No revenue data available to chart.
            </div>
          ) : (
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {/* Adding key={timeFilter} forces Recharts to re-animate when the filter changes */}
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
      </div>
    </div>
  );
};

export default AdminAnalytics;