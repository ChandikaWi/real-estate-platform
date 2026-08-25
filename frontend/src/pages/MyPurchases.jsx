import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';

const MyPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, orderId: null });
  const [validationMsg, setValidationMsg] = useState({ text: '', type: '' });

  // Filter, Search and Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');

  // Receipt Modal State
  const [receiptDialog, setReceiptDialog] = useState({ isOpen: false, order: null });

  useEffect(() => {
    const fetchOrders = async () => {
      try { 
        const { data } = await api.get('/orders/buyer'); 
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData); 
      } 
      catch (err) { setValidationMsg({ text: 'Failed to load transaction history.', type: 'error' }); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const triggerCancel = (id) => {
    setCancelDialog({ isOpen: true, orderId: id });
  };

  const confirmCancelOrder = async () => {
    if (!cancelDialog.orderId) return;
    try {
      const { data } = await api.put(`/orders/${cancelDialog.orderId}/status`, { action: 'cancel' });
      setOrders(orders.map(order => order._id === cancelDialog.orderId ? data : order));
      setValidationMsg({ text: '✅ Order cancelled successfully.', type: 'success' });
    } catch (error) { 
      setValidationMsg({ text: `❌ ${error.response?.data?.message || 'Failed to cancel order'}`, type: 'error' });
    } finally {
      setCancelDialog({ isOpen: false, orderId: null });
      setTimeout(() => setValidationMsg({ text: '', type: '' }), 4000);
    }
  };

  const isWithinThreeDays = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 3;
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Property Title', 'Status', 'Amount (Rs)', 'Requested Date'];
    const rows = orders.map(order => [
      order._id, 
      `"${(order.propertyId?.title || 'Unknown').replace(/"/g, '""')}"`, 
      order.status, 
      order.amount, 
      new Date(order.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'My_Real_Estate_Portfolio.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State for filtering and sorting
  const filteredOrders = orders
    .filter(order => {
      const matchSearch = (order.propertyId?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order._id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'All' ? true : order.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading your portfolio...</h2></div>;

  const completedAmount = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.finalSoldPrice || o.amount), 0);
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Approved').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', 
        border: '1px solid rgba(37, 99, 235, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '30px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Investment Portfolio</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Track your purchase requests and completed transactions.</p>
        </div>
        {orders.length > 0 && (
          <button onClick={exportToCSV} style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            📥 Export to CSV
          </button>
        )}
      </div>

      {orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Invested</p>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-color)' }}>Rs. {completedAmount > 0 ? (completedAmount / 1000000).toFixed(1) + 'M' : '0'}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Requests</p>
            <h2 style={{ margin: 0, fontSize: '2rem', color: '#f59e0b' }}>{pendingCount}</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Completed Deals</p>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>{completedCount}</h2>
          </div>
        </div>
      )}

      {validationMsg.text && (
        <div style={{ padding: '15px 20px', marginBottom: '30px', borderRadius: '12px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `2px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          {validationMsg.text}
        </div>
      )}

      {/* SMART SEARCH & FILTER UI */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
              <option value="All">All Transactions</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
            <input 
              type="text" 
              placeholder="Search by property title or Order ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>🧾</div>
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>No transactions yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>When you request to purchase a property, it will appear here.</p>
          <button onClick={() => navigate('/')} style={{ padding: '14px 32px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Browse Properties
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>No transactions match your current search and filter.</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const isPending = order.status === 'Pending';
            const isCancelled = order.status === 'Cancelled';
            const isCompleted = order.status === 'Completed';
            const isApproved = order.status === 'Approved';

            return (
              <div key={order._id} style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', opacity: isCancelled ? 0.7 : 1 }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                
                <div style={{ width: '160px', backgroundColor: 'var(--bg-hover)', display: 'none', '@media (minWidth: 600px)': { display: 'block' } }}>
                  {order.propertyId?.images?.length > 0 ? (
                    <img src={order.propertyId.images[0]} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '2rem' }}>🏚️</div>
                  )}
                </div>

                <div style={{ flex: 1, padding: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 'bold' }}>#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                    </div>

                    <Link to={`/property/${order.propertyId?._id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: 'var(--text-main)', transition: 'color 0.2s', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-main)'}>
                        {order.propertyId?.title || 'Property Unavailable'}
                      </h3>
                    </Link>
                    
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Requested on {new Date(order.createdAt).toLocaleDateString()}</p>
                    
                    {/* VISUAL PROGRESS TRACKER */}
                    <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCancelled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger-color)' }}></span>
                          Cancelled
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)' }}></div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold' }}>Req</span>
                          </div>
                          <div style={{ flex: 1, height: '3px', backgroundColor: isApproved || isCompleted ? 'var(--primary-color)' : 'var(--border-color)', margin: '0 -5px 15px -5px' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: isApproved || isCompleted ? 'var(--primary-color)' : 'var(--border-color)', boxShadow: isApproved || isCompleted ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none' }}></div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold' }}>Appr</span>
                          </div>
                          <div style={{ flex: 1, height: '3px', backgroundColor: isCompleted ? 'var(--accent-color)' : 'var(--border-color)', margin: '0 -5px 15px -5px' }}></div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: isCompleted ? 'var(--accent-color)' : 'var(--border-color)', boxShadow: isCompleted ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none' }}></div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold' }}>Done</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 150px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>{isCompleted ? 'Final Sold Price' : 'Agreed Amount'}</p>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '1.4rem', color: 'var(--accent-color)' }}>Rs. {(isCompleted ? (order.finalSoldPrice || order.amount) : order.amount).toLocaleString()}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/property/${order.propertyId?._id}`)} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>
                      View Property
                    </button>
                    
                    {isCompleted && (
                      <>
                        <button onClick={() => setReceiptDialog({ isOpen: true, order })} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}>
                          🧾 Receipt
                        </button>
                        <button onClick={() => navigate(`/property/${order.propertyId?._id}`, { state: { openReview: true } })} style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                          ⭐ Rate Seller
                        </button>
                      </>
                    )}

                    {isPending && isWithinThreeDays(order.createdAt) && (
                      <button onClick={() => triggerCancel(order._id)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                        Cancel Request
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.6rem' }}>Cancel Purchase Request?</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to cancel this request? The property will be made available to other buyers again.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, orderId: null })} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Keep It</button>
              <button onClick={confirmCancelOrder} style={{ flex: 1, padding: '14px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptDialog.isOpen && receiptDialog.order && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div id="receipt-print-area" style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', color: '#111', fontFamily: '"Courier New", Courier, monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '2rem', letterSpacing: '-1px' }}>RECEIPT</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>LakEstates</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Order #{receiptDialog.order._id.substring(receiptDialog.order._id.length - 8).toUpperCase()}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Date: {new Date(receiptDialog.order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Property Details</p>
              <h3 style={{ margin: '10px 0 5px 0' }}>{receiptDialog.order.propertyId?.title}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Location: {receiptDialog.order.propertyId?.location?.city || 'N/A'}</p>
            </div>

            <div style={{ marginBottom: '40px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Agreed Purchase Amount:</span>
                <span>Rs. {receiptDialog.order.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '10px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                <span>FINAL SOLD PRICE:</span>
                <span>Rs. {(receiptDialog.order.finalSoldPrice || receiptDialog.order.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('receipt-print-area').innerHTML;
                  const printWindow = window.open('', '', 'width=800,height=600');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt - Order #${receiptDialog.order._id.substring(receiptDialog.order._id.length - 8).toUpperCase()}</title>
                        <style>
                          body { font-family: "Courier New", Courier, monospace; padding: 20px; color: #111; }
                          .no-print { display: none !important; }
                          h2, h3, p { margin-top: 0; }
                        </style>
                      </head>
                      <body>${printContent}</body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 250);
                }} 
                style={{ flex: 1, padding: '12px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ Print Receipt
              </button>
              <button onClick={() => setReceiptDialog({ isOpen: false, order: null })} style={{ flex: 1, padding: '12px', backgroundColor: '#eee', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPurchases;