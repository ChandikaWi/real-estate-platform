import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Search, Filter, and Sort State
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sort, setSort] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProperties = async (currentPage = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append('keyword', keyword);
      if (type) queryParams.append('type', type);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (bedrooms) queryParams.append('bedrooms', bedrooms);
      if (sort) queryParams.append('sort', sort);
      
      queryParams.append('page', currentPage);
      // Limit is handled by the backend default (10 per page)

      const { data } = await api.get(`/properties?${queryParams.toString()}`);
      setProperties(data.properties);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Fetch properties on initial load, or when 'page' / 'sort' state changes
  useEffect(() => {
    fetchProperties(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  // Handle manual search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (page !== 1) {
      setPage(1); // Reset to first page, useEffect will trigger fetch
    } else {
      fetchProperties(1); // Fetch directly if already on page 1
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setSort('newest');
    if (page !== 1) {
      setPage(1); 
    } else {
      // Small timeout ensures states are cleared before fetching manually
      setTimeout(() => fetchProperties(1), 0); 
    }
  };

  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Find Your Dream Property</h1>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', backgroundColor: '#f4f4f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', alignItems: 'center' }}>
        
        <input type="text" placeholder="Search by city or title..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ padding: '10px', flex: '1', minWidth: '200px' }} />
        
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '10px' }}>
          <option value="">All Types</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>

        <input type="number" placeholder="Beds" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} style={{ padding: '10px', width: '80px' }} />
        
        <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ padding: '10px', width: '110px' }} />
        <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ padding: '10px', width: '110px' }} />

        {/* Sort Dropdown triggers an automatic re-fetch */}
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '10px', marginLeft: 'auto' }}>
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
          <button type="button" onClick={clearFilters} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
        </div>
      </form>

      {/* Property Grid */}
      {loading ? (
        <h2>Loading properties...</h2>
      ) : properties.length === 0 ? (
        <h3>No properties found matching your criteria.</h3>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {properties.map((property) => (
              <div key={property._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                
                {/* Thumbnail Display */}
                {property.images && property.images.length > 0 ? (
                  <img src={property.images[0]} alt={property.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    No Image
                  </div>
                )}

                <h3 style={{ marginTop: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{property.title}</h3>
                <p style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold' }}>${property.price.toLocaleString()}</p>
                <p><strong>Location:</strong> {property.location.city}</p>
                <p style={{ textTransform: 'capitalize' }}><strong>Type:</strong> {property.type}</p>
                <p>{property.bedrooms} Beds | {property.bathrooms} Baths | {property.area} sqft</p>
                
                <button onClick={() => navigate(`/property/${property._id}`)} style={{ marginTop: '10px', width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px', gap: '20px' }}>
              <button 
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                style={{ padding: '10px 20px', backgroundColor: page === 1 ? '#ccc' : '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                &larr; Previous
              </button>
              
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                Page {page} of {totalPages}
              </span>

              <button 
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                style={{ padding: '10px 20px', backgroundColor: page === totalPages ? '#ccc' : '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;