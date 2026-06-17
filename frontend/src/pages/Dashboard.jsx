import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';

const Dashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
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
  
  const [visits, setVisits] = useState([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser || storedUser.role !== 'seller') navigate('/login');
    else { setUserInfo(storedUser); fetchInquiries(); fetchMyProperties(); fetchSales(); fetchVisits(); } // 👈 Added here
  }, [navigate]);

  useEffect(() => {
    if (userInfo && userInfo.role === 'seller') {
      socket.connect(); socket.emit('setup', userInfo);
      socket.on('receive_message', (newMessage) => setMessages((prev) => [newMessage, ...prev]));
    }
    return () => { socket.off('receive_message'); socket.disconnect(); };
  }, [userInfo]);

  const fetchMyProperties = async () => { try { const { data } = await api.get('/properties/seller/me'); setMyProperties(data); } catch (e) {} };
  const fetchSales = async () => { try { const { data } = await api.get('/orders/seller'); setSales(data); } catch (e) {} };
  const fetchInquiries = async () => { try { const { data } = await api.get('/messages'); setMessages(data); setLoadingMessages(false); } catch (e) { setLoadingMessages(false); } };
  const fetchVisits = async () => { try { const { data } = await api.get('/visits/seller'); setVisits(data); } catch (e) {} };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Delete this listing?')) {
      try { await api.delete(`/properties/${id}`); setMyProperties(myProperties.filter(p => p._id !== id)); } catch (err) { alert('Failed'); }
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (window.confirm('Mark this order as completed?')) {
      try { const { data } = await api.put(`/orders/${orderId}/status`, { action: 'complete' }); setSales(sales.map(s => s._id === orderId ? data : s)); } catch (err) { alert('Failed'); }
    }
  };

  const handleReply = async (e, receiverId, propertyId) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/messages', { receiverId, propertyId, message: replyText });
      setMessages((prev) => [data, ...prev]); setReplyText(''); setReplyingTo(null);
    } catch (err) { alert("Failed"); }
  };

  const handleVisitAction = async (id, status) => {
    try {
      const { data } = await api.put(`/visits/${id}/status`, { status });
      setVisits(visits.map(v => v._id === id ? data : v));
    } catch (err) { alert('Failed to update visit status'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(''); setUploading(true);
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
        images: uploadedImageUrls, valuationMetrics: { yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore) }
      };
      await api.post('/properties', payload);
      setMessage('Property listed successfully!');
      setFormData({ title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house', bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: '' });
      setImages([]); setUploading(false); fetchMyProperties();
    } catch (err) { setMessage('Error: ' + (err.response?.data?.message || err.message)); setUploading(false); }
  };

  if (!userInfo) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      
      {currentTab === 'add' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Add New Property</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Fill out the details below to list a new property.</p>
          {message && <div style={{ padding: '15px', backgroundColor: 'var(--accent-color)', color: '#fff', marginBottom: '15px', borderRadius: '6px' }}>{message}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Basic Info</h4></div>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }}>
              <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
            </select>
            <input type="number" name="price" placeholder="Current Price (Rs.)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="number" name="previousPrice" placeholder="Previous Price (Rs. Optional)" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '12px', gridColumn: '1 / -1', minHeight: '100px', borderRadius: '6px' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Details</h4></div>
            <input type="text" name="city" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="text" name="address" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="number" name="area" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="number" name="bedrooms" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="number" name="bathrooms" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', gridColumn: '1 / -1' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Valuation</h4></div>
            <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
            <input type="number" step="0.1" name="distanceToTransport" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />

            <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Images</h4>
              <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} style={{ padding: '8px', width: '100%' }} />
            </div>

            <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {uploading ? 'Uploading...' : '🚀 Publish'}
            </button>
          </form>
        </section>
      )}

      {currentTab === 'listings' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Your Active Listings</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Manage, edit, or delete your current properties.</p>
          {myProperties.length === 0 ? <p>No active properties.</p> : (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {myProperties.map((prop) => (
                <div key={prop._id} style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
                  <div onClick={() => navigate(`/property/${prop._id}`)} style={{ cursor: 'pointer', flex: 1 }}>
                    {prop.images?.length > 0 ? <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px' }} /> : <div style={{ width: '100%', height: '180px', backgroundColor: 'var(--bg-hover)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>}
                    <h3 style={{ margin: '15px 0 5px 0' }}>{prop.title}</h3>
                    <p style={{ margin: '0 0 15px 0', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>Rs. {prop.price.toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button onClick={() => navigate(`/edit-property/${prop._id}`)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                    <button onClick={() => handleDeleteProperty(prop._id)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {currentTab === 'inquiries' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Buyer Inquiries</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Reply to messages in real-time.</p>
          {loadingMessages ? <p>Loading...</p> : messages.length === 0 ? <p>No messages yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg) => {
                const isMe = msg.senderId._id === userInfo._id;
                return (
                  <div key={msg._id} style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <strong>{isMe ? 'You replied to:' : 'From:'}</strong> {msg.senderId?.name} <br/>
                        <strong>Regarding:</strong> <span style={{ color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => navigate(`/property/${msg.propertyId._id}`)}>{msg.propertyId?.title}</span><br/>
                        <strong>Date:</strong> {new Date(msg.createdAt).toLocaleString()}
                      </p>
                      {!isMe && <button onClick={() => setReplyingTo(msg._id)} style={{ height: '35px', padding: '0 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reply</button>}
                    </div>
                    <p style={{ margin: 0, padding: '15px', backgroundColor: isMe ? 'var(--primary-color)' : 'var(--bg-hover)', color: isMe ? '#fff' : 'var(--text-main)', borderRadius: '6px' }}>{msg.message}</p>
                    {replyingTo === msg._id && (
                      <form onSubmit={(e) => handleReply(e, msg.senderId._id, msg.propertyId._id)} style={{ display: 'flex', marginTop: '15px', gap: '10px' }}>
                        <input type="text" autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply..." required style={{ flex: 1, padding: '10px', borderRadius: '6px' }} />
                        <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send</button>
                        <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                      </form>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {currentTab === 'sales' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Orders Received</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Track sales and update statuses.</p>
          {sales.length === 0 ? <p>No sales yet.</p> : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '15px' }}>Property</th><th style={{ padding: '15px' }}>Buyer</th><th style={{ padding: '15px' }}>Amount</th><th style={{ padding: '15px' }}>Status & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => {
                    const isPending = sale.status === 'Pending';
                    return (
                      <tr key={sale._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '15px' }}>{sale.propertyId?.title}</td><td style={{ padding: '15px' }}>{sale.buyerId?.name}</td>
                        <td style={{ padding: '15px', color: 'var(--accent-color)', fontWeight: 'bold' }}>Rs. {sale.amount.toLocaleString()}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: isPending ? '#f39c12' : 'var(--accent-color)', fontWeight: 'bold' }}>{sale.status}</span>
                            {isPending && <button onClick={() => handleCompleteOrder(sale._id)} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Mark Completed</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Visit Requests */}
      {currentTab === 'visits' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Visit Requests</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Approve or decline property viewings requested by buyers.</p>
          {visits.length === 0 ? <p>No visit requests yet.</p> : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '15px' }}>Property</th>
                    <th style={{ padding: '15px' }}>Buyer Details</th>
                    <th style={{ padding: '15px' }}>Requested Time</th>
                    <th style={{ padding: '15px' }}>Status & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map(visit => {
                    const isPending = visit.status === 'Pending';
                    return (
                      <tr key={visit._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{visit.propertyId?.title}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold' }}>{visit.buyerId?.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {visit.buyerId?.phoneNumber || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{new Date(visit.date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{visit.timeSlot}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ backgroundColor: isPending ? 'rgba(243, 156, 18, 0.1)' : visit.status === 'Accepted' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: isPending ? '#f39c12' : visit.status === 'Accepted' ? 'var(--accent-color)' : 'var(--danger-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {visit.status}
                            </span>
                            {isPending && (
                              <>
                                <button onClick={() => handleVisitAction(visit._id, 'Accepted')} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Accept</button>
                                <button onClick={() => handleVisitAction(visit._id, 'Rejected')} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Reject</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;