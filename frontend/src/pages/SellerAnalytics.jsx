import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportRef = useRef();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
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
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Seller_Performance_Report.pdf');
  };

  if (loading) return <h2>Loading Advanced Analytics...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  // Prepare data for the Conversion Chart (Views vs Inquiries vs Orders)
  const chartData = analytics.listings.map(item => ({
    name: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
    Views: item.views,
    Inquiries: item.inquiries,
    Orders: item.orders
  }));

  // Calculate overall Conversion Rate (Views to Sales)
  const conversionRate = analytics.summary.totalViews > 0 
    ? ((analytics.listings.filter(l => l.status === 'Sold').length / analytics.summary.totalViews) * 100).toFixed(2) 
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Performance & Conversion Matrix</h1>
          <p style={{ color: '#7f8c8d' }}>Track views, engagement, and revenue for your portfolio.</p>
        </div>
        <button onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          📄 Export PDF Report
        </button>
      </div>

      {/* Wrapping the content for PDF Generation */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        
        {/* Top KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #34495e' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Portfolio Views</h4>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{analytics.summary.totalViews}</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #e67e22' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Inquiries</h4>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{analytics.summary.totalInquiries}</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #1abc9c' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>View-to-Sale Conversion</h4>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#16a085' }}>{conversionRate}%</h2>
          </div>
          <div style={{ backgroundColor: '#f4f6f6', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #2ecc71' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Revenue</h4>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#27ae60' }}>${analytics.summary.totalSalesRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ marginBottom: '40px' }}>
          <h3>Engagement Funnel (Views vs Inquiries vs Orders)</h3>
          <div style={{ height: '400px', backgroundColor: '#fdfefe', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Views" fill="#3498db" />
                <Bar dataKey="Inquiries" fill="#f39c12" />
                <Bar dataKey="Orders" fill="#2ecc71" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '20px', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>
            <h3 style={{ margin: 0 }}>Detailed Listing Breakdown</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '15px' }}>Property Title</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px' }}>Page Views</th>
                  <th style={{ padding: '15px' }}>Inquiries</th>
                  <th style={{ padding: '15px' }}>Orders</th>
                  <th style={{ padding: '15px' }}>Revenue</th>
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
                        <span style={{ backgroundColor: item.status === 'Sold' ? '#e8f8f5' : '#eaf2f8', color: item.status === 'Sold' ? '#27ae60' : '#2980b9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>{item.views}</td>
                      <td style={{ padding: '15px' }}>{item.inquiries}</td>
                      <td style={{ padding: '15px' }}>{item.orders}</td>
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