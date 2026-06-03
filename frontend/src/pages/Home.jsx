import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Search and Filter State
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Extracted fetch function
  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Build the query string dynamically
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append('keyword', keyword);
      if (type) queryParams.append('type', type);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);

      const { data } = await api.get(`/properties?${queryParams.toString()}`);
      setProperties(data.properties);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  // Handle clearing filters
  const clearFilters = () => {
    setKeyword('');
    setType('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Find Your Dream Property</h1>

      {/* Search and Filter Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', backgroundColor: '#f4f4f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search by city or title..." 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)}
          style={{ padding: '10px', flex: '1', minWidth: '200px' }}
        />
        
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '10px' }}>
          <option value="">All Types</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>

        <input 
          type="number" 
          placeholder="Min Price" 
          value={minPrice} 
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ padding: '10px', width: '120px' }}
        />
        
        <input 
          type="number" 
          placeholder="Max Price" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ padding: '10px', width: '120px' }}
        />

        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Search
        </button>
        
        <button type="button" onClick={clearFilters} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Clear
        </button>
      </form>

      {/* Property Grid */}
      {loading ? (
        <h2>Loading properties...</h2>
      ) : properties.length === 0 ? (
        <h3>No properties found matching your criteria.</h3>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {properties.map((property) => (
            <div key={property._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
              {property.images && property.images.length > 0 ? (
                <img 
                    src={property.images[0]} 
                    alt={property.title} 
                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }} 
                />
                ) : (
                <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    No Image Available
                </div>
                )}
                <h3 style={{ marginTop: 0 }}>{property.title}</h3>
              <p style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold' }}>
                ${property.price.toLocaleString()}
              </p>
              <p><strong>Location:</strong> {property.location.city}</p>
              <p style={{ textTransform: 'capitalize' }}><strong>Type:</strong> {property.type}</p>
              <p>{property.bedrooms} Beds | {property.bathrooms} Baths | {property.area} sqft</p>
              
              <button 
                onClick={() => navigate(`/property/${property._id}`)}
                style={{ marginTop: '10px', width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;