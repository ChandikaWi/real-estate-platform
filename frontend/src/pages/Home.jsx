import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await api.get('/properties');
        setProperties(data.properties);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) return <h2>Loading properties...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  return (
    <div>
      <h1>Available Properties</h1>
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {properties.map((property) => (
          <div key={property._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{property.title}</h3>
            <p><strong>Price:</strong> ${property.price.toLocaleString()}</p>
            <p><strong>Location:</strong> {property.location.city}</p>
            <p>{property.bedrooms} Beds | {property.bathrooms} Baths | {property.area} sqft</p>
            <button style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;