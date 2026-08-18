import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const MyVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, visitId: null });
  const [validationMsg, setValidationMsg] = useState({ text: '', type: '' });

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const { data } = await api.get('/visits/buyer');
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setVisits(sortedData);
      } catch (err) { 
        setValidationMsg({ text: 'Failed to load your itinerary.', type: 'error' });
      } finally { 
        setLoading(false); 
      }
    };
    fetchVisits();
  }, []);

  const triggerCancel = (id) => {
    setCancelDialog({ isOpen: true, visitId: id });
  };

  const confirmCancelVisit = async () => {
    if (!cancelDialog.visitId) return;
    try {
      await api.delete(`/visits/${cancelDialog.visitId}`);
      setVisits(visits.filter(v => v._id !== cancelDialog.visitId));
      setValidationMsg({ text: '✅ Viewing cancelled successfully.', type: 'success' });
      setTimeout(() => setValidationMsg({ text: '', type: '' }), 4000);
    } catch (err) { 
      setValidationMsg({ text: '❌ Failed to cancel the visit. Please try again.', type: 'error' });
      setTimeout(() => setValidationMsg({ text: '', type: '' }), 4000);
    } finally {
      setCancelDialog({ isOpen: false, visitId: null });
    }
  };

  const formatCalendarDate = (dateString) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      day: date.getDate(),
      year: date.getFullYear(),
      isPast: date < new Date().setHours(0,0,0,0)
    };
  };

  // 🌟 State for filtering and searching
  const filteredVisits = visits.filter(visit => {
    const matchSearch = (visit.propertyId?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (visit.sellerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' ? true : visit.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading your schedule...</h2></div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', 
        border: '1px solid rgba(245, 158, 11, 0.2)', 
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
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Your Viewing Itinerary</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your upcoming property tours and seller meetings.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '15px 25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b' }}>{visits.length}</span>
          <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Scheduled</span>
        </div>
      </div>

      {validationMsg.text && (
        <div style={{ padding: '15px 20px', marginBottom: '30px', borderRadius: '12px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `2px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          {validationMsg.text}
        </div>
      )}

      {/* SMART SEARCH & FILTER UI */}
      {visits.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
              <option value="All">All Visits</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
            <input 
              type="text" 
              placeholder="Search by property title or seller name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
            />
          </div>
        </div>
      )}
      
      {visits.length === 0 ? (
        <div style={{ padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>📅</div>
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Your calendar is open</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>You haven't requested any property viewings yet.</p>
          <button onClick={() => navigate('/')} style={{ padding: '14px 32px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Explore Properties
          </button>
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
              <div key={visit._id} style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', opacity: calDate.isPast || isRejected ? 0.7 : 1 }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                
                <div style={{ width: '120px', backgroundColor: isAccepted ? 'var(--accent-color)' : isPending ? '#f39c12' : 'var(--bg-hover)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: isAccepted || isPending ? '#fff' : 'var(--text-muted)' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{calDate.month}</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: '1' }}>{calDate.day}</span>
                  <span style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.9 }}>{calDate.year}</span>
                </div>

                <div style={{ flex: 1, padding: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ 
                        backgroundColor: isPending ? 'rgba(243, 156, 18, 0.1)' : isAccepted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        color: isPending ? '#f39c12' : isAccepted ? 'var(--accent-color)' : 'var(--danger-color)', 
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' 
                      }}>
                        {visit.status}
                      </span>
                      {calDate.isPast && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>(Past Date)</span>}
                    </div>

                    <Link to={`/property/${visit.propertyId?._id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: 'var(--text-main)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-main)'}>
                        {visit.propertyId?.title || 'Property Unavailable'}
                      </h3>
                    </Link>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '1.05rem', marginTop: '10px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {visit.timeSlot}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 200px', backgroundColor: 'var(--bg-main)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Meeting With</p>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>{visit.sellerId?.name || 'Seller'}</p>
                    
                    {isAccepted ? (
                      <a href={`tel:${visit.sellerId?.phoneNumber}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.95rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        {visit.sellerId?.phoneNumber || 'Number not provided'}
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Contact details unlock upon approval</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <button 
                      onClick={() => triggerCancel(visit._id)} 
                      style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '2px solid var(--danger-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--danger-color)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--danger-color)'; }}
                    >
                      {isRejected || calDate.isPast ? 'Remove Log' : 'Cancel Visit'}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.6rem' }}>Cancel Viewing?</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to cancel this scheduled visit? The seller will be notified of this change.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, visitId: null })} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Keep It</button>
              <button onClick={confirmCancelVisit} style={{ flex: 1, padding: '14px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyVisits;