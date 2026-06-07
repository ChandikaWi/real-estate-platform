import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const MyPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/buyer');
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <h2>Loading purchases...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1>My Purchased Properties</h1>
      {orders.length === 0 ? (
        <p>You haven't purchased any properties yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px' }}>Order ID</th>
              <th style={{ padding: '12px' }}>Property</th>
              <th style={{ padding: '12px' }}>Amount Paid</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontSize: '0.8rem', color: '#7f8c8d' }}>{order._id}</td>
                <td style={{ padding: '12px' }}>{order.propertyId?.title || 'Property Unavailable'}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2ecc71' }}>${order.amount.toLocaleString()}</td>
                <td style={{ padding: '12px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e8f8f5', color: '#27ae60', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyPurchases;