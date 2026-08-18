import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const [validationMsg, setValidationMsg] = useState({ text: '', type: '' });

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) { navigate('/login'); return; }
    const fetchFavorites = async () => {
      try { 
        const { data } = await api.get(`/favorites/user/${userInfo._id}`); 
        setFavorites(data); 
        setLoading(false); 
      } catch (err) { setLoading(false); }
    };
    fetchFavorites();
  }, [navigate, userInfo?._id]);

  const handleRemove = async (favoriteId) => {
    try { 
      await api.delete(`/favorites/${favoriteId}`); 
      setFavorites(favorites.filter(fav => fav._id !== favoriteId)); 
    } catch (err) { 
      setValidationMsg({ text: 'Failed to remove from favorites.', type: 'error' });
      setTimeout(() => setValidationMsg({ text: '', type: '' }), 3000);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault(); 
    setProcessing(true);
    setValidationMsg({ text: '', type: '' });
    
    try {
      await api.post('/orders/checkout', { propertyId: checkoutItem._id });
      
      const favItem = favorites.find(f => f.propertyId._id === checkoutItem._id);
      if (favItem) await handleRemove(favItem._id);

      setProcessing(false); 
      setCheckoutItem(null);
      setValidationMsg({ text: '✅ Request submitted successfully! The seller will be notified.', type: 'success' });
      
      setTimeout(() => navigate('/purchases'), 2500);
    } catch (err) { 
      setProcessing(false); 
      setCheckoutItem(null);
      setValidationMsg({ text: `❌ ${err.response?.data?.message || 'Request failed. Please try again.'}`, type: 'error' });
    }
  };

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading your collection...</h2></div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      {/* HEADER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', 
        border: '1px solid rgba(239, 68, 68, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Your Personal Collection</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Properties you've saved for later. Keep track of your favorites here.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '15px 25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--danger-color)' }}>{favorites.length}</span>
          <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Saved</span>
        </div>
      </div>
      
      {/* UI Validation Banner */}
      {validationMsg.text && (
        <div style={{ padding: '15px 20px', marginBottom: '30px', borderRadius: '12px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `2px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          {validationMsg.text}
        </div>
      )}

      {favorites.length === 0 ? (
        <div style={{ padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>🏚️</div>
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>You haven't saved any properties yet. Start exploring the market to build your collection.</p>
          <button onClick={() => navigate('/')} style={{ padding: '14px 32px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Explore Market
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {favorites.map((fav) => fav.propertyId && (
            <div key={fav._id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', display: 'flex', flexDirection: 'column' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              
              {/* Image Section */}
              <div style={{ height: '220px', backgroundColor: 'var(--bg-hover)', position: 'relative', overflow: 'hidden' }}>
                 {fav.propertyId.images && fav.propertyId.images.length > 0 ? (
                   <img src={fav.propertyId.images[0]} alt={fav.propertyId.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                 )}
                 
                 {/* Badges */}
                 <span style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#111', padding: '6px 14px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}>
                   {fav.propertyId.type}
                 </span>
                 
                 {/* Status Overlay */}
                 {fav.propertyId.status !== 'Active' && (
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                     <span style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                       {fav.propertyId.status}
                     </span>
                   </div>
                 )}
              </div>

              {/* Content Section */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '900', marginBottom: '8px' }}>
                  Rs. {fav.propertyId.price.toLocaleString()}
                  {fav.propertyId.listingType === 'rent' && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}> / mo</span>}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500' }}>
                  {fav.propertyId.title}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 {fav.propertyId.location.city}
                </p>
                
                {/* Dynamic Specs Footer */}
                <div style={{ display: 'flex', justifyContent: fav.propertyId.type === 'land' ? 'center' : 'space-between', paddingTop: '15px', marginTop: '15px', borderTop: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {fav.propertyId.type !== 'land' ? (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>🛏️ {fav.propertyId.bedrooms || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>🛁 {fav.propertyId.bathrooms || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📐 {fav.propertyId.area?.toLocaleString()} sqft</span>
                    </>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)' }}>
                      🏞️ {fav.propertyId.area?.toLocaleString()} sqft Area
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <button onClick={() => navigate(`/property/${fav.propertyId._id}`)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>View</button>
                  
                  {fav.propertyId.status === 'Active' ? (
                    <button onClick={() => setCheckoutItem(fav.propertyId)} style={{ flex: 1.5, padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}>
                      {fav.propertyId.listingType === 'rent' ? 'Request Rent' : 'Request Buy'}
                    </button>
                  ) : (
                    <div style={{ flex: 1.5, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Unavailable</div>
                  )}
                  
                  <button onClick={() => handleRemove(fav._id)} style={{ width: '45px', padding: '0', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Remove from Favorites" onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'var(--danger-color)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>Confirm Request</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>You are about to request this property.</p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '16px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Property Details</p>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{checkoutItem.title}</h3>
              <p style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.6rem', fontWeight: '900' }}>
                Rs. {checkoutItem.price.toLocaleString()}
                {checkoutItem.listingType === 'rent' && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}> / mo</span>}
              </p>
            </div>

            <p style={{ color: 'var(--text-muted)', margin: '0 0 30px 0', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'center', padding: '0 10px' }}>
              By confirming, this property will be marked as <strong style={{ color: 'var(--text-main)' }}>Reserved</strong>. The seller will be notified to contact you to arrange the offline payment and finalize legal documentation.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setCheckoutItem(null)} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Cancel</button>
              
              <button onClick={handleCheckoutSubmit} disabled={processing} style={{ flex: 1.5, padding: '14px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}>
                {processing ? 'Processing...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;