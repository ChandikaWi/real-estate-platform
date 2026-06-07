import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({ name: '', number: '', exp: '', cvc: '' });

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) { navigate('/login'); return; }
    
    // Auto-fill the card name with the user's registered name
    setCardData(prev => ({ ...prev, name: userInfo.name }));

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
  }, [navigate, userInfo]);

  const handleRemove = async (favoriteId) => {
    try {
      await api.delete(`/favorites/${favoriteId}`);
      setFavorites(favorites.filter(fav => fav._id !== favoriteId));
    } catch (err) {
      alert('Failed to remove favorite');
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      // Process mock payment
      await api.post('/orders/checkout', {
        propertyId: checkoutItem._id,
        cardName: cardData.name,
        cardNumber: cardData.number
      });
      
      // Auto-remove from favorites after buying
      const favItem = favorites.find(f => f.propertyId._id === checkoutItem._id);
      if (favItem) await handleRemove(favItem._id);

      setProcessing(false);
      setCheckoutItem(null);
      alert('Payment Successful! Check your email for the receipt.');
      navigate('/purchases'); // Redirect to manage page
    } catch (err) {
      alert('Payment failed');
      setProcessing(false);
    }
  };

  if (loading) return <h2>Loading favorites...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      <h1>Your Saved Properties</h1>
      
      {favorites.length === 0 ? (
        <p>You haven't saved any properties yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {favorites.map((fav) => (
            fav.propertyId ? (
              <div key={fav._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>{fav.propertyId.title}</h3>
                <p style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold' }}>
                  ${fav.propertyId.price.toLocaleString()}
                </p>
                <p><strong>Location:</strong> {fav.propertyId.location.city}</p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate(`/property/${fav.propertyId._id}`)} style={{ flex: 1, padding: '10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View</button>
                  <button onClick={() => setCheckoutItem(fav.propertyId)} style={{ flex: 1, padding: '10px', backgroundColor: '#6772e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Checkout</button>
                  <button onClick={() => handleRemove(fav._id)} style={{ flex: 1, padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Demo Stripe Checkout Modal */}
      {checkoutItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 5px 0' }}>Demo Checkout</h2>
            <p style={{ color: '#7f8c8d', margin: '0 0 20px 0', fontSize: '0.9rem' }}>Paying <strong>${checkoutItem.price.toLocaleString()}</strong> for {checkoutItem.title}</p>
            
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Email Address</label>
                <input type="email" value={userInfo.email} readOnly style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Cardholder Name</label>
                <input type="text" value={cardData.name} onChange={e => setCardData({...cardData, name: e.target.value})} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Card Number (Demo)</label>
                <input type="text" placeholder="4242 4242 4242 4242" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} required maxLength="16" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>Exp Date</label>
                  <input type="text" placeholder="MM/YY" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>CVC</label>
                  <input type="text" placeholder="123" required maxLength="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCheckoutItem(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={processing} style={{ flex: 2, padding: '12px', backgroundColor: '#6772e5', color: '#fff', border: 'none', borderRadius: '4px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {processing ? 'Processing...' : `Pay $${checkoutItem.price.toLocaleString()}`}
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