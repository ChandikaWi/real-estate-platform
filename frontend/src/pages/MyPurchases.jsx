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

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const { data } = await api.put(`/orders/${orderId}/status`, { action: 'cancel' });
        // Update the specific order in the UI
        setOrders(orders.map(order => order._id === orderId ? data : order));
        alert('Order cancelled successfully.');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  // Helper to check if order is within 3 days
  const isWithinThreeDays = (dateString) => {
    const orderDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return { bg: '#e8f8f5', text: '#27ae60' };
    if (status === 'Cancelled') return { bg: '#fdedec', text: '#c0392b' };
    return { bg: '#fef9e7', text: '#f39c12' }; 
  };

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
            {orders.map((order) => {
              const colors = getStatusColor(order.status);
              return (
                <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '0.8rem', color: '#7f8c8d' }}>{order._id}</td>
                  <td style={{ padding: '12px' }}>{order.propertyId?.title || 'Property Unavailable'}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#2ecc71' }}>${order.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    
                    {/* Status Badge and Cancel Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ backgroundColor: colors.bg, color: colors.text, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {order.status}
                      </span>
                      
                      {order.status === 'Pending' && isWithinThreeDays(order.createdAt) && (
                        <button 
                          onClick={() => handleCancelOrder(order._id)}
                          style={{ padding: '4px 8px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyPurchases;