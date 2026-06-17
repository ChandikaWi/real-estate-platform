import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'seller') {
      navigate('/login');
      return;
    }
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/properties/seller/analytics');
        setAnalytics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load performance data.');
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  const exportPDF = async () => {
    setIsExporting(true);
    const element = reportRef.current;
    
    // Save the user's current theme
    const originalTheme = document.documentElement.getAttribute('data-theme');
    
    // Force Light Theme so the PDF has a white background and black text
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
      
      pdf.save(`Portfolio_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Clean up - Revert padding and restore the user's original theme
      element.style.padding = originalPadding;
      document.documentElement.setAttribute('data-theme', originalTheme);
      setIsExporting(false);
    }, 100);
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading Advanced Analytics...</h2>;
  if (error) return <h2 style={{ color: 'var(--danger-color)' }}>{error}</h2>;

  const funnelData = analytics.listings.map(item => ({
    name: item.title.length > 12 ? item.title.substring(0, 12) + '...' : item.title,
    Views: item.views,
    Inquiries: item.inquiries,
    Orders: item.orders
  }));

  const activeCount = analytics.listings.filter(l => l.status === 'Active').length;
  const soldCount = analytics.listings.filter(l => l.status === 'Sold').length;
  const statusPieData = [
    { name: 'Active', value: activeCount },
    { name: 'Sold', value: soldCount }
  ];
  const PIE_COLORS = ['#3498db', '#2ecc71'];

  const conversionRate = analytics.summary.totalViews > 0 
    ? ((soldCount / analytics.summary.totalViews) * 100).toFixed(2) 
    : 0;

  // Custom styles for Recharts Tooltips so they match dark mode
  const tooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px', color: 'var(--text-main)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Portfolio Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Deep dive into your property performance metrics.</p>
        </div>
        <button disabled={isExporting} onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: isExporting ? 'wait' : 'pointer', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
          {isExporting ? 'Generating PDF...' : '📄 Download Performance PDF'}
        </button>
      </div>

      {/* The Printable Report Container */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '3px solid var(--border-color)', paddingBottom: '15px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '2px' }}>Real Estate Marketplace</h2>
          <h3 style={{ margin: '5px 0', color: 'var(--text-muted)' }}>Seller Conversion & Performance Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared For:</strong> {userInfo?.name} (Seller)</span>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--text-muted)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Profile Views</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>{analytics.summary.totalViews}</h2>
          </div>
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Client Inquiries</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-main)' }}>{analytics.summary.totalInquiries}</h2>
          </div>
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #1abc9c' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>View-to-Sale Ratio</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#16a085' }}>{conversionRate}%</h2>
          </div>
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '8px', borderLeft: '5px solid var(--accent-color)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Capital Generated</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--accent-color)' }}>Rs. {analytics.summary.totalSalesRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Advanced Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginTop: 0 }}>Engagement Funnel Overlay</h3>
            <div style={{ height: '350px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="Views" fill="var(--bg-hover)" stroke="var(--primary-color)" />
                  <Bar dataKey="Inquiries" barSize={30} fill="#f39c12" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Orders" stroke="var(--accent-color)" strokeWidth={4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginTop: 0 }}>Portfolio Status</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" label>
                    {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Properties']} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0 }}>Granular Listing Metrics</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '15px' }}>Property Title</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px' }}>Views (Traffic)</th>
                  <th style={{ padding: '15px' }}>Msgs (Leads)</th>
                  <th style={{ padding: '15px' }}>Orders (Sales)</th>
                  <th style={{ padding: '15px' }}>Revenue Yield</th>
                </tr>
              </thead>
              <tbody>
                {analytics.listings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No listings to analyze.</td>
                  </tr>
                ) : (
                  analytics.listings.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.title}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ backgroundColor: item.status === 'Sold' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(52, 152, 219, 0.1)', color: item.status === 'Sold' ? 'var(--accent-color)' : 'var(--primary-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${item.status === 'Sold' ? 'var(--accent-color)' : 'var(--primary-color)'}` }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>{item.views}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#f39c12' }}>{item.inquiries}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{item.orders}</td>
                      <td style={{ padding: '15px', color: 'var(--accent-color)', fontWeight: 'bold' }}>Rs. {item.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SellerAnalytics;