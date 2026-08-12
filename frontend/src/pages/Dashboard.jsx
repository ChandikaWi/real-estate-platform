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
  const [visits, setVisits] = useState([]);
  
  const [validationMsg, setValidationMsg] = useState({ text: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [generatingPrice, setGeneratingPrice] = useState(false);
  const [aiEstimatedPrice, setAiEstimatedPrice] = useState(null);

  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]); 

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house',
    listingType: 'buy',
    bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  const showMessage = (text, type = 'success') => {
    setValidationMsg({ text, type });
    setTimeout(() => setValidationMsg({ text: '', type: '' }), 4000);
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser || storedUser.role !== 'seller') navigate('/login');
    else { setUserInfo(storedUser); fetchInquiries(); fetchMyProperties(); fetchSales(); fetchVisits(); } 
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

  const handleVisitAction = async (id, status) => {
    try {
      const { data } = await api.put(`/visits/${id}/status`, { status });
      setVisits(visits.map(v => v._id === id ? data : v));
      showMessage(`Visit request ${status.toLowerCase()} successfully.`);
    } catch (err) { showMessage('Failed to update visit status', 'error'); }
  };

  const handleGenerateValuation = async () => {
    if (!formData.city || !formData.area) {
      showMessage("Please fill in City, Property Type, and Sqft first.", "error");
      return;
    }
    setGeneratingPrice(true);
    try {
      const { data } = await api.post('/properties/predict-price', {
        city: formData.city,
        type: formData.type,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        area: Number(formData.area)
      });
      
      setAiEstimatedPrice(Math.round(data.estimatedPrice));
      showMessage("✨ AI Suggested Price generated successfully!", "success");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to generate AI valuation.", "error");
    } finally {
      setGeneratingPrice(false);
    }
  };

  const handleDeleteProperty = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Property?',
      message: 'Are you sure you want to permanently delete this listing?',
      onConfirm: async () => {
        try { 
          await api.delete(`/properties/${id}`); 
          setMyProperties(myProperties.filter(p => p._id !== id)); 
          showMessage('Listing deleted successfully.');
        } catch (err) { showMessage('Failed to delete property.', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleUpdateOrderStatus = (orderId, action) => {
    const dialogMessage = action === 'approve' 
      ? 'Approve this request and proceed to offline negotiation?' 
      : action === 'complete' 
      ? 'Mark this property as officially SOLD?' 
      : 'Cancel this request and put the property back on the market?';

    setConfirmDialog({
      isOpen: true,
      title: 'Update Request Status',
      message: dialogMessage,
      onConfirm: async () => {
        try { 
          const { data } = await api.put(`/orders/${orderId}/status`, { action }); 
          setSales(sales.map(s => s._id === orderId ? data : s)); 
          showMessage(`Status updated to ${data.status} successfully.`);
        } catch (err) { 
          showMessage(err.response?.data?.message || 'Failed to update request', 'error'); 
        }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleReply = async (e, receiverId, propertyId) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/messages', { receiverId, propertyId, message: replyText });
      setMessages((prev) => [data, ...prev]); setReplyText(''); setReplyingTo(null);
      showMessage('Reply sent successfully!');
    } catch (err) { showMessage("Failed to send reply.", "error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setUploading(true);
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
        listingType: formData.listingType,
        images: uploadedImageUrls, valuationMetrics: { yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore) }
      };
      await api.post('/properties', payload);
      showMessage('Property listed successfully! It is pending admin review.');
      setFormData({ title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house', listingType: 'buy', bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: '' });
      setImages([]); 
      setAiEstimatedPrice(null); // Clear the AI price after posting
      setUploading(false); fetchMyProperties();
    } catch (err) { showMessage('Error: ' + (err.response?.data?.message || err.message), 'error'); setUploading(false); }
  };

  if (!userInfo) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', position: 'relative' }}>
      
      {validationMsg.text && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `1px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold' }}>
          {validationMsg.text}
        </div>
      )}

      {currentTab === 'add' && (
      <section>
        <h1 style={{ margin: '0 0 5px 0' }}>Add New Property</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Fill out the details below to list a new property.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Basic Info</h4></div>
          <input type="text" name="title" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
          <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }}>
            <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
          </select>
          <select name="listingType" value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <option value="buy">For Sale</option>
            <option value="rent">For Rent (Monthly)</option>
          </select>
          {/* DYNAMIC PRICING & AI UI */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="number" 
              name="price" 
              placeholder={formData.listingType === 'rent' ? "Monthly Rent (Rs.)" : "Selling Price (Rs.)"} 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              required 
              style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px' }} 
            />
            
            {/* ONLY show the AI Valuator if the user is Selling */}
            {formData.listingType === 'buy' && (
              <>
                <button 
                  type="button" 
                  onClick={handleGenerateValuation} 
                  disabled={generatingPrice} 
                  style={{ padding: '12px 20px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  {generatingPrice ? 'Calculating...' : '✨ Generate AI Price'}
                </button>
                {aiEstimatedPrice && (
                  <div style={{ padding: '10px 15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '6px', color: 'var(--accent-color)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    AI Suggestion: Rs. {aiEstimatedPrice.toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>

          <input type="number" name="previousPrice" placeholder="Previous Price (Rs. Optional)" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '12px', borderRadius: '6px', gridColumn: '1 / -1' }} />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '12px', gridColumn: '1 / -1', minHeight: '100px', borderRadius: '6px' }} />

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Details</h4></div>
          <input type="text" name="city" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" name="area" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" name="bedrooms" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" name="bathrooms" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Valuation Metrics</h4></div>
          <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" step="0.1" name="distanceToTransport" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" name="parkingSpaces" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
          <input type="number" name="conditionScore" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />

          <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Upload Property Images (Max 5)</h4>
            <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files.length > 5) { showMessage("Max 5 pictures.", "error"); e.target.value = ''; } else { setImages(e.target.files); } }} style={{ padding: '8px', width: '100%' }} />
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
          {myProperties.length === 0 ? <p>No active properties.</p> : (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {myProperties.map((prop) => (
                <div key={prop._id} style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                  <div onClick={() => navigate(`/property/${prop._id}`)} style={{ cursor: 'pointer', flex: 1 }}>
                    {prop.images?.length > 0 ? <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px' }} /> : <div style={{ width: '100%', height: '180px', backgroundColor: 'var(--bg-hover)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>}
                    <h3 style={{ margin: '15px 0 5px 0' }}>{prop.title}</h3>
                    <p style={{ margin: '0 0 15px 0', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>Rs.{prop.price.toLocaleString()}</p>
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
          {loadingMessages ? <p>Loading...</p> : messages.length === 0 ? <p>No messages yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg) => {
                const isMe = msg.senderId._id === userInfo._id;
                return (
                  <div key={msg._id} style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <strong>{isMe ? 'You replied to:' : 'From:'}</strong> {msg.senderId?.name} <br/>
                        <strong>Regarding:</strong> <span style={{ color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => navigate(`/property/${msg.propertyId._id}`)}>{msg.propertyId?.title}</span>
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
          <h1 style={{ margin: '0 0 5px 0' }}>Purchase Requests</h1>
          {sales.length === 0 ? <p>No purchase requests yet.</p> : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '15px' }}>Property</th><th style={{ padding: '15px' }}>Buyer</th><th style={{ padding: '15px' }}>Amount</th><th style={{ padding: '15px' }}>Status & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '15px' }}>{sale.propertyId?.title}</td><td style={{ padding: '15px' }}>{sale.buyerId?.name}</td>
                      <td style={{ padding: '15px', color: 'var(--accent-color)', fontWeight: 'bold' }}>Rs.{sale.amount.toLocaleString()}</td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ backgroundColor: sale.status === 'Completed' ? 'rgba(39, 174, 96, 0.1)' : sale.status === 'Approved' ? 'rgba(59, 130, 246, 0.1)' : sale.status === 'Pending' ? 'rgba(243, 156, 18, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: sale.status === 'Completed' ? 'var(--accent-color)' : sale.status === 'Approved' ? '#3b82f6' : sale.status === 'Pending' ? '#f39c12' : 'var(--danger-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', width: 'fit-content' }}>
                            {sale.status}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {sale.status === 'Pending' && <button onClick={() => handleUpdateOrderStatus(sale._id, 'approve')} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Approve Request</button>}
                            {sale.status === 'Approved' && <button onClick={() => handleUpdateOrderStatus(sale._id, 'complete')} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Mark as Sold</button>}
                            {(sale.status === 'Pending' || sale.status === 'Approved') && <button onClick={() => handleUpdateOrderStatus(sale._id, 'cancel')} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cancel</button>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {currentTab === 'visits' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Visit Requests</h1>
          {visits.length === 0 ? <p>No visit requests yet.</p> : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '15px' }}>Property</th><th style={{ padding: '15px' }}>Buyer Details</th><th style={{ padding: '15px' }}>Requested Time</th><th style={{ padding: '15px' }}>Status & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map(visit => {
                    const isPending = visit.status === 'Pending';
                    return (
                      <tr key={visit._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{visit.propertyId?.title}</td>
                        <td style={{ padding: '15px' }}><div style={{ fontWeight: 'bold' }}>{visit.buyerId?.name}</div></td>
                        <td style={{ padding: '15px' }}><div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{new Date(visit.date).toLocaleDateString()}</div></td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ backgroundColor: isPending ? 'rgba(243, 156, 18, 0.1)' : visit.status === 'Accepted' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: isPending ? '#f39c12' : visit.status === 'Accepted' ? 'var(--accent-color)' : 'var(--danger-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{visit.status}</span>
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

      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>{confirmDialog.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDialog({ isOpen: false })} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;