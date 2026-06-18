import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({ name: '', number: '', exp: '', cvc: '' });
  const [saveCard, setSaveCard] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) { navigate('/login'); return; }
    
    const savedCard = localStorage.getItem(`mockBilling_${userInfo._id}`);
    if (savedCard) { setCardData(JSON.parse(savedCard)); setSaveCard(true); } 
    else { setCardData(prev => ({ ...prev, name: userInfo.name })); }

    const fetchFavorites = async () => {
      try { 
        const { data } = await api.get(`/favorites/user/${userInfo._id}`); 
        setFavorites(data); 
        setLoading(false); 
      } catch (err) { 
        setLoading(false); 
      }
    };
    fetchFavorites();
  }, [navigate, userInfo?._id, userInfo?.name]);

  const handleRemove = async (favoriteId) => {
    try { 
      await api.delete(`/favorites/${favoriteId}`); 
      setFavorites(favorites.filter(fav => fav._id !== favoriteId)); 
    } catch (err) { 
      alert('Failed to remove favorite'); 
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault(); setProcessing(true);
    try {
      await api.post('/orders/checkout', { propertyId: checkoutItem._id, cardName: cardData.name, cardNumber: cardData.number });
      if (saveCard) localStorage.setItem(`mockBilling_${userInfo._id}`, JSON.stringify(cardData));
      else localStorage.removeItem(`mockBilling_${userInfo._id}`);

      const favItem = favorites.find(f => f.propertyId._id === checkoutItem._id);
      if (favItem) await handleRemove(favItem._id);

      setProcessing(false); setCheckoutItem(null);
      alert('Payment Successful! Check your email for the receipt.');
      navigate('/purchases');
    } catch (err) { 
      // If the atomic lock fails (someone else bought it), show the specific error message
      alert(err.response?.data?.message || 'Payment failed'); 
      setProcessing(false); 
      setCheckoutItem(null);
      // Refresh to get the latest status
      window.location.reload();
    }
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading favorites...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>Your Saved Properties</h1>
      
      {favorites.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You haven't saved any properties yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {favorites.map((fav) => fav.propertyId && (
            <div key={fav._id} style={{ border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Image Thumbnail */}
              <div style={{ height: '180px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                 {fav.propertyId.images && fav.propertyId.images.length > 0 ? (
                   <img src={fav.propertyId.images[0]} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                 )}
                 
                 {/* STATUS BADGE FOR INACTIVE PROPERTIES */}
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
                
                {/* ONLY SHOW 'BUY NOW' IF PROPERTY IS ACTIVE */}
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

      {/* Checkout Modal */}
      {checkoutItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>Secure Checkout</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 20px 0' }}>Paying <strong>Rs. {checkoutItem.price.toLocaleString()}</strong> for {checkoutItem.title}</p>
            
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Cardholder Name</label>
                <input type="text" value={cardData.name} onChange={e => setCardData({...cardData, name: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} required maxLength="16" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Exp Date</label>
                  <input type="text" placeholder="MM/YY" value={cardData.exp} onChange={e => setCardData({...cardData, exp: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>CVC</label>
                  <input type="text" placeholder="123" value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value})} required maxLength="3" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input type="checkbox" id="saveCard" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <label htmlFor="saveCard" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>Securely save this card</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCheckoutItem(null)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" disabled={processing} style={{ flex: 2, padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {processing ? 'Processing...' : `Pay Rs. ${checkoutItem.price.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;