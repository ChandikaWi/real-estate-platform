import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
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
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Platform_Executive_Report.pdf');
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
        <button onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          📄 Export PDF Report
        </button>
      </div>

      <div ref={reportRef} style={{ padding: '20px', backgroundColor: '#fdfefe', borderRadius: '8px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', backgroundColor: '#ebf5fb', borderRadius: '8px', border: '1px solid #d6eaf8' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>Total Users</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{data.users.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#e8f8f5', borderRadius: '8px', border: '1px solid #d1f2eb' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Total Properties</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{data.properties.total}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fef9e7', borderRadius: '8px', border: '1px solid #fcf3cf' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f39c12' }}>Total Orders</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{data.sales.totalOrders}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f5eef8', borderRadius: '8px', border: '1px solid #ebdef0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#8e44ad' }}>Gross Revenue</h4>
            <h2 style={{ margin: 0, fontSize: '2.5rem' }}>${data.sales.totalRevenue.toLocaleString()}</h2>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3>User Demographics</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                    {userPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3>Property Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2ecc71" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenue Trend */}
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3>Revenue Trend Analysis</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#e74c3c" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;