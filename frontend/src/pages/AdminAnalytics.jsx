import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();
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
  }, [navigate]);

  const exportPDF = async () => {
    setIsExporting(true);
    const element = reportRef.current;
    
    // Save the user's current theme
    const originalTheme = document.documentElement.getAttribute('data-theme');
    
    //Force Light Theme so the PDF has a white background and black text
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Give React 100ms to apply the light theme CSS before taking the screenshot
    setTimeout(async () => {
      const originalPadding = element.style.padding;
      element.style.padding = '40px';
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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
      
      // Clean up - Revert padding and restore the user's original theme
      element.style.padding = originalPadding;
      document.documentElement.setAttribute('data-theme', originalTheme);
      setIsExporting(false);
    }, 100);
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading Global Analytics...</h2>;
  if (!data) return <h2 style={{ color: 'var(--danger-color)' }}>Error loading data.</h2>;

  const userPieData = [
    { name: 'Buyers', value: data.users.buyers },
    { name: 'Sellers', value: data.users.sellers },
  ];
  const propertyBarData = [
    { name: 'Houses', count: data.properties.houses },
    { name: 'Apartments', count: data.properties.apartments },
    { name: 'Land', count: data.properties.lands },
  ];
  
  const COLORS = ['#3498db', '#2ecc71', '#9b59b6'];
  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px', color: 'var(--text-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Platform Overview</h1>
          <p style={{ color: 'var(--text-muted)' }}>Global statistics and system health.</p>
        </div>
        <button disabled={isExporting} onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: isExporting ? 'wait' : 'pointer', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
          {isExporting ? 'Generating PDF...' : '📄 Export Executive PDF'}
        </button>
      </div>

      {/* The Printable Report Container */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '3px solid var(--border-color)', paddingBottom: '15px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '2px' }}>Real Estate Marketplace</h2>
          <h3 style={{ margin: '5px 0', color: 'var(--text-muted)' }}>Global Executive Summary Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared By:</strong> {userInfo?.name} (Administrator)</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid var(--primary-color)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Network Users</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>{data.users.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid var(--accent-color)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Market Properties</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>{data.properties.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Completed Orders</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>{data.sales.completed}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '5px solid #8e44ad' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Gross Platform Revenue</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>${data.sales.totalRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Complex Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          <div style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>User Demographics Matrix</h3>
            <div style={{ height: '300px', marginTop: '15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                    {userPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} Users`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>Inventory Distribution</h3>
            <div style={{ height: '300px', marginTop: '15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={propertyBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="var(--accent-color)" barSize={40} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="count" stroke="var(--danger-color)" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Complex Area Chart Row 2 */}
        <div style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>Fiscal Growth & Revenue Trajectory</h3>
          <div style={{ height: '350px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis tickFormatter={(value) => `$${value}`} stroke="var(--text-muted)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary-hover)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;