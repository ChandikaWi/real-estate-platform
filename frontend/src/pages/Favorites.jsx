import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Custom UI Validation State
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
      setValidationMsg({ text: '✅ Purchase Request Submitted successfully! The seller will be notified.', type: 'success' });
      
      setTimeout(() => navigate('/purchases'), 2500); // Wait 2.5s to read the success message before redirecting
    } catch (err) { 
      setProcessing(false); 
      setCheckoutItem(null);
      setValidationMsg({ text: `❌ ${err.response?.data?.message || 'Request failed. Please try again.'}`, type: 'error' });
    }
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading favorites...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>Your Saved Properties</h1>
      
      {/* Custom UI Validation Banner */}
      {validationMsg.text && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '8px', backgroundColor: validationMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `1px solid ${validationMsg.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold' }}>
          {validationMsg.text}
        </div>
      )}

      {favorites.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You haven't saved any properties yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {favorites.map((fav) => fav.propertyId && (
            <div key={fav._id} style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ height: '180px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                 {fav.propertyId.images && fav.propertyId.images.length > 0 ? (
                   <img src={fav.propertyId.images[0]} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                 )}
                 {fav.propertyId.status !== 'Active' && (
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                       {fav.propertyId.status}
                     </span>
                   </div>
                 )}
              </div>

              <h3 style={{ marginTop: 0, marginBottom: '5px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{fav.propertyId.title}</h3>
              <p style={{ fontSize: '1.4rem', color: 'var(--accent-color)', fontWeight: 'bold', margin: '5px 0' }}>Rs. {fav.propertyId.price.toLocaleString()}</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>📍 {fav.propertyId.location.city}</p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(`/property/${fav.propertyId._id}`)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>View</button>
                {fav.propertyId.status === 'Active' ? (
                  <button onClick={() => setCheckoutItem(fav.propertyId)} style={{ flex: 1, padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Buy Now</button>
                ) : (
                  <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Unavailable</div>
                )}
                <button onClick={() => handleRemove(fav._id)} style={{ padding: '10px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove from Favorites">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {checkoutItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', textAlign: 'center' }}>Request to Purchase</h2>
            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Property:</p>
              <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{checkoutItem.title}</h3>
              <p style={{ margin: '10px 0 0 0', color: 'var(--accent-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>Rs. {checkoutItem.price.toLocaleString()}</p>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 25px 0', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'center' }}>
              By confirming, this property will be temporarily reserved. The seller will be notified to contact you to arrange the offline payment and legal documentation.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCheckoutItem(null)} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleCheckoutSubmit} disabled={processing} style={{ flex: 2, padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {processing ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;