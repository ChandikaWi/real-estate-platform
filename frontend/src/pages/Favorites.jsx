import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { data } = await api.get(`/favorites/user/${userInfo._id}`);
        setFavorites(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load favorites');
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

  if (loading) return <h2>Loading favorites...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Your Saved Properties</h1>
      
      {favorites.length === 0 ? (
        <p>You haven't saved any properties yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {favorites.map((fav) => (
            // Check if propertyId exists in case the property was deleted by the seller
            fav.propertyId ? (
              <div key={fav._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>{fav.propertyId.title}</h3>
                <p style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold' }}>
                  ${fav.propertyId.price.toLocaleString()}
                </p>
                <p><strong>Location:</strong> {fav.propertyId.location.city}</p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => navigate(`/property/${fav.propertyId._id}`)}
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleRemove(fav._id)}
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;