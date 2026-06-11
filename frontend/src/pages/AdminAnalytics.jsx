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
    
    pdf.save(`Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    element.style.padding = originalPadding;
  };

  if (loading) return <h2>Loading Global Analytics...</h2>;
  if (!data) return <h2>Error loading data.</h2>;

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Platform Overview</h1>
          <p style={{ color: '#7f8c8d' }}>Global statistics and system health.</p>
        </div>
        <button onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)' }}>
          📄 Export Executive PDF
        </button>
      </div>

      {/* The Printable Report Container */}
      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#fdfefe', borderRadius: '8px', border: '1px solid #eee' }}>
        
        {/* PDF Formal Header */}
        <div style={{ borderBottom: '3px solid #2c3e50', paddingBottom: '15px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '2px' }}>Real Estate Marketplace</h2>
          <h3 style={{ margin: '5px 0', color: '#34495e' }}>Global Executive Summary Report</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', fontSize: '0.9rem', marginTop: '10px' }}>
            <span><strong>Generated Date:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Prepared By:</strong> {userInfo?.name} (Administrator)</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', backgroundColor: '#ebf5fb', borderRadius: '8px', borderLeft: '5px solid #2980b9' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2980b9', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Network Users</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>{data.users.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#e8f8f5', borderRadius: '8px', borderLeft: '5px solid #27ae60' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#27ae60', textTransform: 'uppercase', fontSize: '0.8rem' }}>Market Properties</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>{data.properties.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fef9e7', borderRadius: '8px', borderLeft: '5px solid #f39c12' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f39c12', textTransform: 'uppercase', fontSize: '0.8rem' }}>Completed Orders</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>{data.sales.completed}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f5eef8', borderRadius: '8px', borderLeft: '5px solid #8e44ad' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#8e44ad', textTransform: 'uppercase', fontSize: '0.8rem' }}>Gross Platform Revenue</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#2c3e50' }}>${data.sales.totalRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Complex Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>User Demographics Matrix</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                    {userPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Users`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Inventory Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={propertyBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2ecc71" barSize={40} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="count" stroke="#e74c3c" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Complex Area Chart Row 2 */}
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Fiscal Growth & Revenue Trajectory</h3>
          <div style={{ height: '350px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2980b9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;