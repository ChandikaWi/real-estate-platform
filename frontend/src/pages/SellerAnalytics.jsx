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
    const element = reportRef.current;
    
    // Adjust styles for perfect PDF capture
    const originalPadding = element.style.padding;
    element.style.padding = '40px';
    element.style.backgroundColor = '#ffffff';
    
    // Capture the canvas
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; 
    const pageHeight = 297; 
    
    // Calculate the total image height in mm based on the A4 width
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    // Loop and add new pages
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`Portfolio_Performance_${new Date().toISOString().split('T')[0]}.pdf`);
    
    element.style.padding = originalPadding;
  };

  if (loading) return <h2>Loading Advanced Analytics...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  // Chart Data Preparation
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Portfolio Analytics</h1>
          <p style={{ color: '#7f8c8d' }}>Deep dive into your property performance metrics.</p>
        </div>
        <button onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)' }}>
          📄 Download Performance PDF
        </button>
      </div>

      {/* The Printable Report Container */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '3px solid #2c3e50', paddingBottom: '15px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '2px' }}>Real Estate Marketplace</h2>
          <h3 style={{ margin: '5px 0', color: '#34495e' }}>Seller Conversion & Performance Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', fontSize: '0.9rem', marginTop: '10px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared For:</strong> {userInfo?.name} (Seller)</span>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #34495e' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Profile Views</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>{analytics.summary.totalViews}</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #e67e22' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.8rem' }}>Client Inquiries</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>{analytics.summary.totalInquiries}</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #1abc9c' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.8rem' }}>View-to-Sale Ratio</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#16a085' }}>{conversionRate}%</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #2ecc71' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.8rem' }}>Capital Generated</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#27ae60' }}>${analytics.summary.totalSalesRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Advanced Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          {/* Complex Multi-Metric Chart */}
          <div style={{ backgroundColor: '#fdfefe', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Engagement Funnel Overlay</h3>
            <div style={{ height: '350px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Views" fill="#ebf5fb" stroke="#3498db" />
                  <Bar dataKey="Inquiries" barSize={30} fill="#f39c12" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Orders" stroke="#2ecc71" strokeWidth={4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div style={{ backgroundColor: '#fdfefe', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Portfolio Status</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" label>
                    {statusPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Properties']} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '20px', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>
            <h3 style={{ margin: 0 }}>Granular Listing Metrics</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #ddd' }}>
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
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No listings to analyze.</td>
                  </tr>
                ) : (
                  analytics.listings.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.title}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ backgroundColor: item.status === 'Sold' ? '#e8f8f5' : '#eaf2f8', color: item.status === 'Sold' ? '#27ae60' : '#2980b9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${item.status === 'Sold' ? '#2ecc71' : '#3498db'}` }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#34495e' }}>{item.views}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#e67e22' }}>{item.inquiries}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#27ae60' }}>{item.orders}</td>
                      <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold' }}>${item.revenue.toLocaleString()}</td>
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