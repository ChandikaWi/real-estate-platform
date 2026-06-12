import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';

const Dashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams(); // URL based tabs
  const currentTab = tab || 'add';

  const [userInfo, setUserInfo] = useState(null);
  const [myProperties, setMyProperties] = useState([]);
  const [sales, setSales] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); 
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]); 
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser || storedUser.role !== 'seller') {
      navigate('/login');
    } else {
      setUserInfo(storedUser);
      fetchInquiries();
      fetchMyProperties(); 
      fetchSales(); 
    }
  }, [navigate]);

  useEffect(() => {
    if (userInfo && userInfo.role === 'seller') {
      socket.connect();
      socket.emit('setup', userInfo);
      socket.on('receive_message', (newMessage) => setMessages((prevMessages) => [newMessage, ...prevMessages]));
    }
    return () => { socket.off('receive_message'); socket.disconnect(); };
  }, [userInfo]);

  const fetchMyProperties = async () => {
    try { const { data } = await api.get('/properties/seller/me'); setMyProperties(data); } catch (error) { console.error("Failed to fetch properties"); }
  };
  const fetchSales = async () => {
    try { const { data } = await api.get('/orders/seller'); setSales(data); } catch (error) { console.error("Failed to fetch sales"); }
  };
  const fetchInquiries = async () => {
    try { const { data } = await api.get('/messages'); setMessages(data); setLoadingMessages(false); } catch (error) { setLoadingMessages(false); }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Delete this listing?')) {
      try {
        await api.delete(`/properties/${id}`);
        setMyProperties(myProperties.filter((prop) => prop._id !== id));
      } catch (err) { alert('Failed to delete property'); }
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (window.confirm('Mark this order as completed?')) {
      try {
        const { data } = await api.put(`/orders/${orderId}/status`, { action: 'complete' });
        setSales(sales.map(sale => sale._id === orderId ? data : sale));
      } catch (error) { alert('Failed to update order'); }
    }
  };

  const handleReply = async (e, receiverId, propertyId) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/messages', { receiverId, propertyId, message: replyText });
      setMessages((prev) => [data, ...prev]); setReplyText(''); setReplyingTo(null);
    } catch (err) { alert("Failed to send reply"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setUploading(true);
    try {
      let uploadedImageUrls = [];
      if (images.length > 0) {
        const imageFormData = new FormData();
        for (let i = 0; i < images.length; i++) imageFormData.append('images', images[i]);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedImageUrls = uploadRes.data;
      }
      const payload = {
        title: formData.title, description: formData.description, price: Number(formData.price), previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
        location: { city: formData.city, address: formData.address }, type: formData.type, bedrooms: Number(formData.bedrooms), bathrooms: Number(formData.bathrooms), area: Number(formData.area),
        images: uploadedImageUrls,
        valuationMetrics: { yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore) }
      };
      await api.post('/properties', payload);
      setMessage('Property successfully listed!');
      setFormData({ title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house', bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: '' });
      setImages([]); setUploading(false); fetchMyProperties(); // Refresh properties
    } catch (err) {
      setMessage('Error listing property: ' + (err.response?.data?.message || err.message));
      setUploading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Add Property Form */}
      {currentTab === 'add' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Add New Property</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Fill out the details below to list a new property on the market.</p>
          {message && <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '15px', borderRadius: '4px' }}>{message}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #eee' }}>
            <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Basic Information</h4></div>
            <input type="text" name="title" placeholder="Property Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="land">Land</option>
            </select>
            <input type="number" name="price" placeholder="Current Price ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="previousPrice" placeholder="Previous Price ($) - Optional" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '10px', gridColumn: '1 / -1', minHeight: '100px', borderRadius: '4px', border: '1px solid #ccc' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Location & Dimensions</h4></div>
            <input type="text" name="city" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" name="address" placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="area" placeholder="Area (sqft)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="bedrooms" placeholder="Bedrooms" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="bathrooms" placeholder="Bathrooms" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', gridColumn: '1 / -1' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>AI Valuation Metrics</h4></div>
            <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" step="0.1" name="distanceToTransport" placeholder="Distance to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="parkingSpaces" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="number" name="conditionScore" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', border: '1px dashed #ccc' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Property Images</h4>
              <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} style={{ padding: '8px', width: '100%' }} />
              <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>Upload up to 5 high-quality images.</small>
            </div>

            <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: uploading ? '#95a5a6' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {uploading ? 'Uploading & Listing...' : '🚀 Publish Listing'}
            </button>
          </form>
        </section>
      )}

      {/* Active Listings */}
      {currentTab === 'listings' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Your Active Listings</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Manage, edit, or delete your current market properties.</p>
          {myProperties.length === 0 ? <p>You have no active properties.</p> : (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {myProperties.map((prop) => (
                <div key={prop._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div onClick={() => navigate(`/property/${prop._id}`)} style={{ cursor: 'pointer', flex: 1 }}>
                    {prop.images && prop.images.length > 0 ? (
                      <img src={prop.images[0]} alt="thumbnail" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '180px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                    )}
                    <h3 style={{ margin: '15px 0 5px 0', fontSize: '1.1rem' }}>{prop.title}</h3>
                    <p style={{ margin: '0 0 15px 0', color: '#2ecc71', fontWeight: 'bold', fontSize: '1.2rem' }}>${prop.price.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button onClick={() => navigate(`/edit-property/${prop._id}`)} style={{ flex: 1, padding: '10px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                    <button onClick={() => handleDeleteProperty(prop._id)} style={{ flex: 1, padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Live Inquiries */}
      {currentTab === 'inquiries' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Buyer Inquiries</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Reply to buyer messages in real-time.</p>
          {loadingMessages ? <p>Loading messages...</p> : messages.length === 0 ? <p>No messages yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg) => (
                <div key={msg._id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.6' }}>
                      <strong>{msg.senderId._id === userInfo._id ? 'You replied to:' : 'From:'}</strong> {msg.senderId?.name} <br/>
                      <strong>Regarding:</strong> <span style={{ color: '#3498db', cursor: 'pointer' }} onClick={() => navigate(`/property/${msg.propertyId._id}`)}>{msg.propertyId?.title}</span><br/>
                      <strong>Date:</strong> {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    {msg.senderId._id !== userInfo._id && (
                      <button onClick={() => setReplyingTo(msg._id)} style={{ height: '35px', padding: '0 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reply</button>
                    )}
                  </div>
                  <p style={{ margin: 0, padding: '15px', backgroundColor: msg.senderId._id === userInfo._id ? '#e8f4f8' : '#f4f4f9', borderRadius: '4px', borderLeft: msg.senderId._id === userInfo._id ? '4px solid #3498db' : '4px solid #95a5a6' }}>
                    {msg.message}
                  </p>
                  {replyingTo === msg._id && (
                    <form onSubmit={(e) => handleReply(e, msg.senderId._id, msg.propertyId._id)} style={{ display: 'flex', marginTop: '15px', gap: '10px' }}>
                      <input type="text" autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." required style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                      <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Orders / Sales */}
      {currentTab === 'sales' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Orders Received</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Track your sales and update order statuses.</p>
          {sales.length === 0 ? <p>No sales yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '15px' }}>Property</th>
                  <th style={{ padding: '15px' }}>Buyer Name</th>
                  <th style={{ padding: '15px' }}>Amount</th>
                  <th style={{ padding: '15px' }}>Date</th>
                  <th style={{ padding: '15px' }}>Status & Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const isPending = sale.status === 'Pending';
                  const isCancelled = sale.status === 'Cancelled';
                  return (
                    <tr key={sale._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px' }}>{sale.propertyId?.title || 'Unknown Property'}</td>
                      <td style={{ padding: '15px' }}>{sale.buyerId?.name || 'Unknown Buyer'}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#2ecc71' }}>${sale.amount.toLocaleString()}</td>
                      <td style={{ padding: '15px' }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ backgroundColor: isPending ? '#fef9e7' : isCancelled ? '#fdedec' : '#e8f8f5', color: isPending ? '#f39c12' : isCancelled ? '#c0392b' : '#27ae60', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {sale.status}
                          </span>
                          {isPending && (
                            <button onClick={() => handleCompleteOrder(sale._id)} style={{ padding: '6px 12px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              Mark Completed
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
        </section>
      )}
    </div>
  );
};

export default Dashboard;