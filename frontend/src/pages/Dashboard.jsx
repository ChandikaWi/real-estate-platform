import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  const [completeModal, setCompleteModal] = useState({ isOpen: false, orderId: null, finalPrice: '' });

  const [generatingPrice, setGeneratingPrice] = useState(false);
  const [aiEstimatedPrice, setAiEstimatedPrice] = useState(null);

  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); 
  const [uploading, setUploading] = useState(false);
  
  const [images, setImages] = useState([]); 
  const [imagePreviews, setImagePreviews] = useState([]);

  const [boostModal, setBoostModal] = useState({ isOpen: false, property: null, selectedPlan: '7_days' });

  // Filter States for Listings Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortListingsBy, setSortListingsBy] = useState('Newest');
  const [copiedId, setCopiedId] = useState(null);

  // Filter States for Sales Tab
  const [searchSalesQuery, setSearchSalesQuery] = useState('');
  const [filterSalesStatus, setFilterSalesStatus] = useState('All');
  const [sortSalesBy, setSortSalesBy] = useState('Newest Deals');

  // Filter States for Visits Tab
  const [searchVisitsQuery, setSearchVisitsQuery] = useState('');
  const [filterVisitsStatus, setFilterVisitsStatus] = useState('All');
  const [sortVisitsBy, setSortVisitsBy] = useState('Upcoming First');

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
  const fetchSales = async () => { try { const { data } = await api.get('/orders/seller'); setSales(data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))); } catch (e) {} };
  const fetchInquiries = async () => { try { const { data } = await api.get('/messages'); setMessages(data); setLoadingMessages(false); } catch (e) { setLoadingMessages(false); } };
  const fetchVisits = async () => { try { const { data } = await api.get('/visits/seller'); setVisits(data.sort((a,b) => new Date(a.date) - new Date(b.date))); } catch (e) {} };

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
        city: formData.city, type: formData.type, bedrooms: Number(formData.bedrooms) || 0, bathrooms: Number(formData.bathrooms) || 0, area: Number(formData.area)
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
      isOpen: true, title: 'Delete Property?', message: 'Are you sure you want to permanently delete this listing? This cannot be undone.',
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
    if (action === 'complete') {
      setCompleteModal({ isOpen: true, orderId, finalPrice: '' });
      return;
    }
    
    const dialogMessage = action === 'approve' 
      ? 'Approve this request and proceed to offline negotiation?' : 'Cancel this request and put the property back on the market?';

    setConfirmDialog({
      isOpen: true, title: 'Update Request Status', message: dialogMessage,
      onConfirm: async () => {
        try { 
          const { data } = await api.put(`/orders/${orderId}/status`, { action }); 
          setSales(sales.map(s => s._id === orderId ? data : s)); 
          showMessage(`Status updated to ${data.status} successfully.`);
        } catch (err) { showMessage(err.response?.data?.message || 'Failed to update request', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleCompleteSale = async (e) => {
    e.preventDefault();
    if (!completeModal.finalPrice || isNaN(completeModal.finalPrice)) {
      showMessage("Please enter a valid final sold price.", "error");
      return;
    }
    try { 
      const { data } = await api.put(`/orders/${completeModal.orderId}/status`, { action: 'complete', finalSoldPrice: Number(completeModal.finalPrice) }); 
      setSales(sales.map(s => s._id === completeModal.orderId ? data : s)); 
      showMessage(`Property successfully marked as SOLD for Rs. ${Number(completeModal.finalPrice).toLocaleString()}`);
      setCompleteModal({ isOpen: false, orderId: null, finalPrice: '' });
    } catch (err) { 
      showMessage(err.response?.data?.message || 'Failed to complete sale', 'error'); 
    }
  };

  const handleReply = async (e, receiverId, propertyId) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/messages', { receiverId, propertyId, message: replyText });
      setMessages((prev) => [data, ...prev]); setReplyText(''); setReplyingTo(null);
      showMessage('Reply sent successfully!');
    } catch (err) { showMessage("Failed to send reply.", "error"); }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      showMessage("Maximum 5 pictures allowed.", "error");
      e.target.value = '';
      return;
    }
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleRemoveNewImage = (index) => {
    const newFiles = [...images]; newFiles.splice(index, 1); setImages(newFiles);
    const newPreviews = [...imagePreviews]; newPreviews.splice(index, 1); setImagePreviews(newPreviews);
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
      
      if (uploadedImageUrls.length === 0) {
        showMessage("Please add at least 1 image to your listing.", "error");
        setUploading(false); return;
      }

      const payload = {
        title: formData.title, description: formData.description, price: Number(formData.price), previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
        listingType: formData.listingType, location: { city: formData.city, address: formData.address }, type: formData.type, bedrooms: Number(formData.bedrooms), bathrooms: Number(formData.bathrooms), area: Number(formData.area),
        images: uploadedImageUrls, valuationMetrics: { yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore) }
      };
      await api.post('/properties', payload);
      showMessage('Property listed successfully! It is pending admin review.');
      setFormData({ title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house', listingType: 'buy', bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: '' });
      setImages([]); setImagePreviews([]); setAiEstimatedPrice(null); 
      setUploading(false); fetchMyProperties();
    } catch (err) { showMessage('Error: ' + (err.response?.data?.message || err.message), 'error'); setUploading(false); }
  };

  const formatCalendarDate = (dateString) => {
    const date = new Date(dateString);
    return { month: date.toLocaleString('default', { month: 'short' }), day: date.getDate(), year: date.getFullYear(), isPast: date < new Date().setHours(0,0,0,0) };
  };

  // Filter States
  let filteredProperties = myProperties.filter(prop => {
    const matchSearch = prop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        prop.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        prop.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' ? true : prop.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (sortListingsBy === 'Price: High to Low') filteredProperties.sort((a, b) => b.price - a.price);
  else if (sortListingsBy === 'Price: Low to High') filteredProperties.sort((a, b) => a.price - b.price);
  else filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getDaysOnMarket = (createdAt) => {
    if(!createdAt) return "✨ Brand New!";
    const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    if(days === 0) return "✨ Brand New!";
    return `⏳ ${days} Day${days > 1 ? 's' : ''} on Market`;
  };

  const formatMsgTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isNewMessage = (dateString) => {
    if (!dateString) return false;
    const hours = (new Date() - new Date(dateString)) / (1000 * 60 * 60);
    return hours < 24;
  };

  const quickReplies = [
    "Yes, it is still available.",
    "When would you like to schedule a visit?",
    "Let's discuss the price."
  ];

  const handleCopyLink = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/property/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getVisitUrgency = (dateString) => {
    if (!dateString) return null;
    const visitDate = new Date(dateString);
    visitDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = visitDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: '🔥 Today!', color: 'var(--danger-color)' };
    if (diffDays === 1) return { text: '📅 Tomorrow!', color: '#f59e0b' };
    if (diffDays > 1) return { text: `⌛ In ${diffDays} Days`, color: 'var(--primary-color)' };
    return null;
  };

  const handleCopyItinerary = (e, visit) => {
    e.stopPropagation();
    const text = `Viewing: ${visit.propertyId?.title || 'Unknown'}\nBuyer: ${visit.buyerId?.name || 'Unknown'}\nDate: ${new Date(visit.date).toLocaleDateString()}\nTime: ${visit.timeSlot}`;
    navigator.clipboard.writeText(text);
    setCopiedId(visit._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  let filteredSales = sales.filter(sale => {
    const matchSearch = (sale.propertyId?.title || '').toLowerCase().includes(searchSalesQuery.toLowerCase()) || 
                        (sale.buyerId?.name || '').toLowerCase().includes(searchSalesQuery.toLowerCase());
    const matchStatus = filterSalesStatus === 'All' ? true : sale.status === filterSalesStatus;
    return matchSearch && matchStatus;
  });

  if (sortSalesBy === 'Highest Offer First') {
    filteredSales.sort((a, b) => b.amount - a.amount);
  } else if (sortSalesBy === 'Lowest Offer First') {
    filteredSales.sort((a, b) => a.amount - b.amount);
  } else {
    filteredSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const pipelineRevenue = sales.filter(s => s.status === 'Pending' || s.status === 'Approved' || s.status === 'Completed').reduce((acc, curr) => {
    if (curr.status === 'Completed') return acc + (curr.finalSoldPrice || curr.amount);
    return acc + curr.amount;
  }, 0);

  const handlePrintReceipt = (sale) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return alert("Please allow popups to print receipts.");
    printWindow.document.write(`
      <html><head><title>Receipt - ${sale._id}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333;line-height:1.6;} h1{color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px;}</style>
      </head>
      <body>
        <h1>Transaction Receipt</h1>
        <p><strong>Order ID:</strong> ${sale._id}</p>
        <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</p>
        <p><strong>Property:</strong> ${sale.propertyId?.title || 'Unknown Property'}</p>
        <p><strong>Buyer:</strong> ${sale.buyerId?.name || 'Unknown'} (${sale.buyerId?.email || 'N/A'})</p>
        <p style="font-size:1.5rem;font-weight:bold;color:#27ae60;"><strong>Final Amount:</strong> Rs. ${(sale.finalSoldPrice || sale.amount).toLocaleString()}</p>
        <p><strong>Status:</strong> ${sale.status}</p>
        <hr style="margin-top:40px; border:none; border-top:1px solid #ccc;" />
        <p style="color:#7f8c8d;font-size:0.85rem;text-align:center;">Generated by Real Estate Platform</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  let filteredVisits = visits.filter(visit => {
    const matchSearch = (visit.propertyId?.title || '').toLowerCase().includes(searchVisitsQuery.toLowerCase()) || 
                        (visit.buyerId?.name || '').toLowerCase().includes(searchVisitsQuery.toLowerCase());
    const matchStatus = filterVisitsStatus === 'All' ? true : visit.status === filterVisitsStatus;
    return matchSearch && matchStatus;
  });

  if (sortVisitsBy === 'Upcoming First') {
    filteredVisits.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortVisitsBy === 'Furthest First') {
    filteredVisits.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    filteredVisits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Section Completion Checks
  const isSection1Complete = formData.title && formData.price && formData.description;
  const isSection2Complete = formData.city && formData.address && formData.area && (formData.type === 'land' ? true : (formData.bedrooms && formData.bathrooms));

  if (!userInfo) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)', position: 'relative' }}>
      
      {validationMsg.text && (
        <div style={{ padding: '15px 20px', marginBottom: '30px', borderRadius: '12px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `2px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)', animation: 'fadeIn 0.3s ease' }}>
          {validationMsg.text}
        </div>
      )}

      {/* ADD PROPERTY */}
      {currentTab === 'add' && (
      <section>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Add New Listing</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Create a premium property listing to attract buyers and renters.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          
          <div style={{ gridColumn: '1 / -1' }}><h3 style={{ margin: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', fontSize: '1.4rem' }}>1. Basic Information {isSection1Complete && <span style={{ color: 'var(--accent-color)', fontSize: '1.2rem', marginLeft: '10px' }}>✅</span>}</h3></div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <input type="text" placeholder="Property Title (e.g., Luxury Villa in Colombo)" maxLength={100} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formData.title.length}/100</div>
          </div>
          
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}>
            <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
          </select>

          <select value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}>
            <option value="buy">For Sale</option><option value="rent">For Rent</option>
          </select>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formData.listingType === 'rent' ? "Monthly Rent (Rs.)" : "Selling Price (Rs.)"}</label>
              <input type="number" placeholder="Enter Amount" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }} />
              {formData.price && <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '6px' }}>Formatted: Rs. {Number(formData.price).toLocaleString()}</div>}
            </div>
            
            {formData.listingType === 'buy' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Not sure how to price?</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="button" onClick={handleGenerateValuation} disabled={generatingPrice} style={{ padding: '16px 24px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', whiteSpace: 'nowrap', transition: 'opacity 0.2s', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }} onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                    {generatingPrice ? 'Calculating...' : '✨ Use AI Valuator'}
                  </button>
                  {aiEstimatedPrice && (
                    <div style={{ padding: '14px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--accent-color)', borderRadius: '12px', color: 'var(--accent-color)', fontWeight: '900', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                      Est: Rs. {aiEstimatedPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <input type="number" placeholder="Previous Price (Optional - Creates a 'Discount' tag)" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            {formData.previousPrice && <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '6px' }}>Formatted: Rs. {Number(formData.previousPrice).toLocaleString()}</div>}
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <textarea placeholder="Detailed Property Description..." maxLength={2000} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ width: '100%', padding: '16px', minHeight: '150px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formData.description.length}/2000</div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}><h3 style={{ margin: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', fontSize: '1.4rem' }}>2. Property Specifications {isSection2Complete && <span style={{ color: 'var(--accent-color)', fontSize: '1.2rem', marginLeft: '10px' }}>✅</span>}</h3></div>
          
          <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="text" placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" placeholder="Area (Sqft)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" placeholder="Bedrooms" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} disabled={formData.type === 'land'} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: formData.type === 'land' ? 'var(--bg-hover)' : 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" placeholder="Bathrooms" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} disabled={formData.type === 'land'} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: formData.type === 'land' ? 'var(--bg-hover)' : 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />

          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}><h3 style={{ margin: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', fontSize: '1.4rem' }}>3. Advanced Metrics (Optional)</h3></div>
          
          <input type="number" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" step="0.1" placeholder="Distance to Transit (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
          <input type="number" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />

          <div style={{ gridColumn: '1 / -1', marginTop: '20px', backgroundColor: 'var(--bg-hover)', padding: '25px', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>4. Property Gallery</h3>
              <span style={{ fontSize: '0.9rem', color: images.length === 5 ? 'var(--danger-color)' : 'var(--text-muted)', fontWeight: 'bold', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '12px' }}>
                {images.length} / 5 Images Added
              </span>
            </div>

            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '12px', border: '2px solid var(--primary-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => handleRemoveNewImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: images.length >= 5 ? 'var(--bg-main)' : 'var(--bg-hover)', border: `2px dashed ${images.length >= 5 ? 'var(--border-color)' : 'var(--primary-color)'}`, borderRadius: '12px', cursor: images.length >= 5 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: images.length >= 5 ? 0.5 : 1 }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📸</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>Click here to browse images</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>(Maximum 5 images allowed)</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileSelect} 
                disabled={images.length >= 5}
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '18px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '12px', cursor: uploading ? 'wait' : 'pointer', fontWeight: '900', fontSize: '1.15rem', marginTop: '20px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s' }} onMouseOver={e => !uploading && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => !uploading && (e.currentTarget.style.transform = 'translateY(0)')}>
            {uploading ? 'Uploading securely...' : '🚀 Publish Listing'}
          </button>
        </form>
      </section>
      )}

      {/* ACTIVE LISTINGS */}
      {currentTab === 'listings' && (
        <section>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Your Active Portfolio</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Manage and edit your published properties.</p>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '15px 25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-color)' }}>{myProperties.length}</span>
              <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Properties</span>
            </div>
          </div>

          {/* ACTIVE LISTINGS SMART SEARCH & FILTER UI */}
          {myProperties.length > 0 && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="All">All Properties</option>
                  <option value="Active">Active</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort By</label>
                <select value={sortListingsBy} onChange={(e) => setSortListingsBy(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="Newest">Newest First</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                </select>
              </div>
              <div style={{ flex: '2 1 300px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                <input 
                  type="text" 
                  placeholder="Search by title, city, or address..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {myProperties.length === 0 ? (
            <div style={{ padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>🏚️</div>
              <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>No listings yet</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>You haven't published any properties to the market.</p>
              <button onClick={() => navigate('/dashboard/add')} style={{ padding: '14px 32px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Create Listing</button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-muted)' }}>No properties match your current search and filter.</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filteredProperties.map((prop) => (
                <div key={prop._id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', display: 'flex', flexDirection: 'column' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                  
                  <div onClick={() => navigate(`/property/${prop._id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ height: '220px', backgroundColor: 'var(--bg-hover)', position: 'relative' }}>
                      {prop.images?.length > 0 ? (
                        <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                      )}
                      <span style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#111', padding: '6px 14px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}>
                        {prop.type}
                      </span>
                      {/* SHARE BUTTON */}
                      <button onClick={(e) => handleCopyLink(e, prop._id)} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(255,255,255,0.95)', color: copiedId === prop._id ? 'var(--accent-color)' : '#111', border: 'none', padding: '8px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', zIndex: 10 }}>
                        {copiedId === prop._id ? '✅ Copied!' : '🔗 Share'}
                      </button>
                      {prop.status !== 'Active' && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                          <span style={{ backgroundColor: prop.status === 'Sold' ? 'var(--accent-color)' : prop.status === 'Pending Review' ? '#f39c12' : 'var(--danger-color)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                            {prop.status}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '900', marginBottom: '8px' }}>Rs. {(prop.status === 'Sold' && prop.soldPrice) ? prop.soldPrice.toLocaleString() : prop.price.toLocaleString()}{prop.listingType === 'rent' && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}> / mo</span>}</div>
                      
                      {/* Days on market badge */}
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ display: 'inline-block', backgroundColor: 'var(--bg-hover)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {getDaysOnMarket(prop.createdAt)}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500' }}>{prop.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        📍 {prop.location.city} {prop.type !== 'land' && `• ${prop.bedrooms} Beds`} <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>• Rs. {Math.round(((prop.status === 'Sold' && prop.soldPrice) ? prop.soldPrice : prop.price) / prop.area).toLocaleString()}/sqft</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', marginTop: 'auto', flexWrap: 'wrap' }}>
                  {prop.status === 'Sold' ? (
                    <div style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🔒 Sold (Locked)
                    </div>
                  ) : (
                    <>
                      {/* BOOST BUTTON */}
                      {prop.status === 'Active' && (
                        <button 
                          onClick={() => setBoostModal({ isOpen: true, property: prop, selectedPlan: '7_days' })}
                          style={{ flex: '1 1 100%', padding: '12px', background: prop.isBoosted ? 'linear-gradient(135deg, #f59e0b, #e67e22)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', cursor: prop.isBoosted ? 'default' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: prop.isBoosted ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                        >
                          {prop.isBoosted ? '🔥 Boosted Status Active' : '🚀 Boost Listing'}
                        </button>
                      )}
                      
                      <button onClick={() => navigate(`/edit-property/${prop._id}`)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>Edit</button>
                      <button onClick={() => handleDeleteProperty(prop._id)} style={{ flex: 1, padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--danger-color)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger-color)'; }}>Delete</button>
                    </>
                  )}
                </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* INQUIRIES */}
      {currentTab === 'inquiries' && (
        <section>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Direct Messages</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Communicate directly with potential buyers.</p>
          </div>

          {loadingMessages ? <h3 style={{ color: 'var(--text-muted)' }}>Loading messages...</h3> : messages.length === 0 ? (
            <div style={{ padding: '60px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>💬</div>
              <h2 style={{ color: 'var(--text-main)' }}>Your inbox is empty</h2>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {messages.map((msg) => {
                const isMe = msg.senderId._id === userInfo._id;
                return (
                  <div key={msg._id} style={{ border: '1px solid var(--border-color)', borderRadius: '20px', backgroundColor: 'var(--bg-card)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Avatar */}
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: isMe ? 'var(--accent-color)' : 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
                          {(msg.senderId?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{isMe ? 'You replied to:' : 'Message from:'}</strong> <span style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.05rem' }}>{msg.senderId?.name}</span>
                            {!isMe && isNewMessage(msg.createdAt) && <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🆕 New</span>}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <strong>Regarding:</strong> <span style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/property/${msg.propertyId._id}`)}>{msg.propertyId?.title}</span>
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{formatMsgTime(msg.createdAt)}</span>
                        {!isMe && <button onClick={() => setReplyingTo(msg._id)} style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='0.8'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>Reply</button>}
                      </div>
                    </div>

                    <div style={{ padding: '25px', backgroundColor: 'var(--bg-main)' }}>
                      <div style={{ display: 'inline-block', padding: '15px 20px', backgroundColor: isMe ? 'var(--primary-color)' : 'var(--bg-card)', color: isMe ? '#fff' : 'var(--text-main)', border: isMe ? 'none' : '1px solid var(--border-color)', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '1.05rem', lineHeight: '1.5', boxShadow: 'var(--shadow-sm)', maxWidth: '80%' }}>
                        {msg.message}
                      </div>

                      {replyingTo === msg._id && (
                        <div style={{ marginTop: '20px', backgroundColor: 'var(--bg-card)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                          {/* Quick Replies */}
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            {quickReplies.map((qr, idx) => (
                              <button key={idx} type="button" onClick={() => setReplyText(qr)} style={{ padding: '6px 14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--primary-color)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}>
                                {qr}
                              </button>
                            ))}
                          </div>
                          
                          <form onSubmit={(e) => handleReply(e, msg.senderId._id, msg.propertyId._id)} style={{ display: 'flex', gap: '15px' }}>
                            <input type="text" autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." required style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }} />
                            <button type="submit" style={{ padding: '0 24px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>Send</button>
                            <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '0 20px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* SALES PIPELINE */}
      {currentTab === 'sales' && (
        <section>
          <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Deal Pipeline</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Review and approve purchase requests from buyers.</p>
            </div>
            {pipelineRevenue > 0 && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-color)', padding: '15px 25px', borderRadius: '16px', textAlign: 'right' }}>
                <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Potential Revenue</p>
                <p style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.8rem', fontWeight: '900' }}>Rs. {pipelineRevenue.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* SALES SMART SEARCH & FILTER UI */}
          {sales.length > 0 && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
                <select value={filterSalesStatus} onChange={(e) => setFilterSalesStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="All">All Requests</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort By</label>
                <select value={sortSalesBy} onChange={(e) => setSortSalesBy(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="Newest Deals">Newest Deals</option>
                  <option value="Highest Offer First">Highest Offer First</option>
                  <option value="Lowest Offer First">Lowest Offer First</option>
                </select>
              </div>
              <div style={{ flex: '2 1 300px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                <input 
                  type="text" 
                  placeholder="Search by property title or buyer name..." 
                  value={searchSalesQuery}
                  onChange={(e) => setSearchSalesQuery(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {sales.length === 0 ? (
            <div style={{ padding: '60px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>🤝</div>
              <h2 style={{ color: 'var(--text-main)' }}>No purchase requests yet</h2>
            </div>
          ) : filteredSales.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-muted)' }}>No requests match your current search and filter.</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredSales.map(sale => {
                const isPending = sale.status === 'Pending';
                const isApproved = sale.status === 'Approved';
                const isCompleted = sale.status === 'Completed';
                const isCancelled = sale.status === 'Cancelled';

                return (
                  <div key={sale._id} style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', opacity: isCancelled ? 0.7 : 1, transition: 'transform 0.2s', flexWrap: 'wrap' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    
                    <div style={{ width: '150px', backgroundColor: 'var(--bg-hover)', display: 'none', '@media (minWidth: 700px)': { display: 'block' } }}>
                      {sale.propertyId?.images?.length > 0 ? <img src={sale.propertyId.images[0]} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏚️</div>}
                    </div>

                    <div style={{ flex: 1, padding: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ 
                            backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isApproved ? 'rgba(52, 152, 219, 0.1)' : isPending ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: isCompleted ? 'var(--accent-color)' : isApproved ? '#3498db' : isPending ? '#f59e0b' : 'var(--danger-color)', 
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' 
                          }}>
                            {sale.status}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(sale.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sale.propertyId?.title || 'Property Unavailable'}</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Buyer: <strong style={{ color: 'var(--text-main)' }}>{sale.buyerId?.name}</strong></p>
                      </div>

                      <div style={{ flex: '1 1 150px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>{isCompleted ? 'Final Sold Price' : 'Offer Amount'}</p>
                        <p style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem', color: 'var(--accent-color)' }}>Rs. {(isCompleted ? (sale.finalSoldPrice || sale.amount) : sale.amount).toLocaleString()}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
                        {isCompleted && <button onClick={() => handlePrintReceipt(sale)} style={{ padding: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🖨️ Print Receipt</button>}
                        {isPending && <button onClick={() => handleUpdateOrderStatus(sale._id, 'approve')} style={{ padding: '12px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)' }}>Accept Offer</button>}
                        {isApproved && <button onClick={() => handleUpdateOrderStatus(sale._id, 'complete')} style={{ padding: '12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>Mark as Sold</button>}
                        {(isPending || isApproved) && <button onClick={() => handleUpdateOrderStatus(sale._id, 'cancel')} style={{ padding: '12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '2px solid var(--danger-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Reject / Cancel</button>}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* VISIT SCHEDULING */}
      {currentTab === 'visits' && (
        <section>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Viewing Requests</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Manage calendar requests from potential buyers.</p>
          </div>

          {/* VISITS SMART SEARCH & FILTER UI */}
          {visits.length > 0 && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
                <select value={filterVisitsStatus} onChange={(e) => setFilterVisitsStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="All">All Visits</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort By</label>
                <select value={sortVisitsBy} onChange={(e) => setSortVisitsBy(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="Upcoming First">Upcoming First</option>
                  <option value="Furthest First">Furthest First</option>
                  <option value="Newest Requests">Newest Requests</option>
                </select>
              </div>
              <div style={{ flex: '2 1 300px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
                <input 
                  type="text" 
                  placeholder="Search by property title or buyer name..." 
                  value={searchVisitsQuery}
                  onChange={(e) => setSearchVisitsQuery(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {visits.length === 0 ? (
            <div style={{ padding: '60px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📅</div>
              <h2 style={{ color: 'var(--text-main)' }}>No viewing requests yet</h2>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-muted)' }}>No visits match your current search and filter.</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredVisits.map(visit => {
                const isPending = visit.status === 'Pending';
                const isAccepted = visit.status === 'Accepted';
                const isRejected = visit.status === 'Rejected';
                const calDate = formatCalendarDate(visit.date);

                return (
                  <div key={visit._id} style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', opacity: calDate.isPast || isRejected ? 0.7 : 1, transition: 'transform 0.2s', flexWrap: 'wrap' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    
                    <div style={{ width: '130px', backgroundColor: isAccepted ? 'var(--accent-color)' : isPending ? '#f59e0b' : 'var(--bg-hover)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: isAccepted || isPending ? '#fff' : 'var(--text-muted)' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{calDate.month}</span>
                      <span style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1' }}>{calDate.day}</span>
                      <span style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.9 }}>{calDate.year}</span>
                    </div>

                    <div style={{ flex: 1, padding: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ backgroundColor: isPending ? 'rgba(245, 158, 11, 0.1)' : isAccepted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPending ? '#f59e0b' : isAccepted ? 'var(--accent-color)' : 'var(--danger-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{visit.status}</span>
                          {calDate.isPast && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>(Past Date)</span>}
                          {isAccepted && !calDate.isPast && getVisitUrgency(visit.date) && (
                            <span style={{ backgroundColor: 'var(--bg-main)', color: getVisitUrgency(visit.date).color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
                              {getVisitUrgency(visit.date).text}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: 'var(--text-main)' }}>{visit.propertyId?.title || 'Property Unavailable'}</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Requested by: <strong style={{ color: 'var(--text-main)' }}>{visit.buyerId?.name}</strong></p>
                      </div>

                      <div style={{ flex: '1 1 150px', backgroundColor: 'var(--bg-main)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Time Slot</p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{visit.timeSlot}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                        {isAccepted && (
                          <button onClick={(e) => handleCopyItinerary(e, visit)} style={{ padding: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {copiedId === visit._id ? '✅ Copied!' : '📋 Copy Details'}
                          </button>
                        )}
                        {isPending && (
                          <>
                            <button onClick={() => handleVisitAction(visit._id, 'Accepted')} style={{ padding: '12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>Accept Viewing</button>
                            <button onClick={() => handleVisitAction(visit._id, 'Rejected')} style={{ padding: '12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '2px solid var(--danger-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Decline</button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* FINALIZE SALE MODAL */}
      {completeModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤝</div>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>Finalize Sale</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '1.05rem', lineHeight: '1.5' }}>
              You are about to mark this property as sold. Please enter the <strong>actual negotiated price</strong> you both agreed upon.
            </p>
            <form onSubmit={handleCompleteSale}>
              <div style={{ textAlign: 'left', marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Final Sold Price (Rs.)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 55000000" 
                  value={completeModal.finalPrice} 
                  onChange={(e) => setCompleteModal({ ...completeModal, finalPrice: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.2rem', outline: 'none', boxSizing: 'border-box' }} 
                />
                {completeModal.finalPrice && <div style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '8px', textAlign: 'right' }}>Formatted: Rs. {Number(completeModal.finalPrice).toLocaleString()}</div>}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setCompleteModal({ isOpen: false, orderId: null, finalPrice: '' })} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>Mark as Sold</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>{confirmDialog.title}</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '1.05rem', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setConfirmDialog({ isOpen: false })} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Cancel</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, padding: '14px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}>Confirm Action</button>
            </div>
          </div>
        </div>
      )}

      {/* THE BOOST PRICING MODAL */}
  {boostModal.isOpen && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🚀 Upgrade Listing</h2>
          <button onClick={() => setBoostModal({ isOpen: false, property: null, selectedPlan: '7_days' })} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <p style={{ color: 'var(--text-muted)', margin: '0 0 25px 0', lineHeight: '1.5' }}>Push your property to the top of search results. Boosted listings receive up to <strong>400% more views</strong>.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          {/* Duration Options */}
          {[ 
            { id: '7_days', label: '7 Days Priority Boost', price: 3500 },
            { id: '14_days', label: '14 Days Priority Boost', price: 6000 },
            { id: '30_days', label: '30 Days Priority Boost', price: 12000 }
          ].map(plan => (
            <div 
              key={plan.id}
              onClick={() => setBoostModal({ ...boostModal, selectedPlan: plan.id })}
              style={{ padding: '20px', borderRadius: '12px', border: boostModal.selectedPlan === plan.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', backgroundColor: boostModal.selectedPlan === plan.id ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-main)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.05rem' }}>{plan.label}</p>
              </div>
              <p style={{ margin: 0, fontWeight: '900', color: 'var(--accent-color)', fontSize: '1.1rem' }}>Rs. {plan.price.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={async () => {
            try {
              setUploading(true);
              const { data } = await api.post('/payments/create-session', { propertyId: boostModal.property._id, planType: boostModal.selectedPlan });
              window.location.href = `/checkout/${data.paymentId}`; // Redirect to Mock Stripe
            } catch (err) {
              showMessage("Failed to initiate checkout.", "error");
              setUploading(false);
            }
          }} 
          disabled={uploading}
          style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: uploading ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}
        >
          {uploading ? 'Connecting to PaySecure...' : 'Proceed to Checkout 🔒'}
        </button>
      </div>
    </div>
  )}


    </div>
  );
};

export default Dashboard;