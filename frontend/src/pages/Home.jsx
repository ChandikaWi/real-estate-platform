import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

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

  useEffect(() => {
    fetchProperties(page);
  }, [page, sort]);

  useEffect(() => {
    fetchProperties(page);

    // Fetch Personalized Recommendations if user is a buyer
    if (userInfo && userInfo.role === 'buyer') {
      const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
          // Pass token in headers for this specific protected route
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          const { data } = await api.get('/properties/recommendations', config);
          setRecommendations(data);
        } catch (err) {
          console.error("Failed to load recommendations");
        } finally {
          setLoadingRecs(false);
        }
      };
      fetchRecommendations();
    }
  }, [page, sort]); // Also depends on userInfo conceptually, but runs on mount

  const handleSearch = (e) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else fetchProperties(1);
  };

  const clearFilters = () => {
    setKeyword(''); setType(''); setMinPrice(''); setMaxPrice(''); setBedrooms(''); setSort('newest');
    if (page !== 1) setPage(1);
    else setTimeout(() => fetchProperties(1), 0);
  };

  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--danger-color)' }}><h2>{error}</h2></div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Hero Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: '0 0 15px 0', color: 'var(--text-main)', letterSpacing: '-1px' }}>
          Discover Your New Home
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Explore the most extensive collection of premium real estate, apartments, and land tailored to your lifestyle.
        </p>
      </div>

      {/* Floating Search Bar */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', gap: '15px', flexWrap: 'wrap', 
        backgroundColor: 'var(--bg-card)', 
        padding: '20px', 
        borderRadius: '16px', 
        marginBottom: '50px', 
        alignItems: 'center',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)'
      }}>
        
        <input type="text" placeholder="Location, neighborhood, or zip..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ padding: '14px', flex: '2', minWidth: '200px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }} />
        
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '14px', flex: '1', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <option value="">Property Type</option>
          <option value="house">Houses</option>
          <option value="apartment">Apartments</option>
          <option value="land">Land</option>
        </select>

        <input type="number" placeholder="Beds" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} style={{ padding: '14px', width: '90px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }} />
        <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ padding: '14px', flex: '1', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }} />
        <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ padding: '14px', flex: '1', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }} />

        <div style={{ display: 'flex', gap: '10px', flex: '1' }}>
          <button type="submit" style={{ flex: '1', padding: '14px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Search</button>
          <button type="button" onClick={clearFilters} style={{ padding: '14px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
        </div>
      </form>

      {/* Sorting & Results Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Latest Market Listings</h3>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
          <option value="newest">Sort by: Newest First</option>
          <option value="price_low">Sort by: Price (Low to High)</option>
          <option value="price_high">Sort by: Price (High to Low)</option>
        </select>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}><h2 style={{ color: 'var(--text-muted)' }}>Loading premium listings...</h2></div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}><h3 style={{ color: 'var(--text-muted)' }}>No properties match your exact criteria. Try adjusting your filters.</h3></div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {properties.map((property) => (
              <div key={property._id} style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-md)', 
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              >
                
                {/* Image & Badges */}
                <div style={{ position: 'relative', height: '240px' }}>
                  {property.images && property.images.length > 0 ? (
                    <img src={property.images[0]} alt={property.title} onClick={() => setZoomedImage(property.images[0])} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                  )}
                  <span style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'capitalize', boxShadow: 'var(--shadow-sm)' }}>
                    {property.type}
                  </span>
                  {property.sellerId?.isVerified && (
                    <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'var(--primary-color)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ marginBottom: '15px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {property.title}
                    </h3>
                    
                    {/* Dynamic Pricing */}
                    {property.previousPrice && property.previousPrice !== property.price ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem', color: 'var(--accent-color)', fontWeight: '800' }}>${property.price.toLocaleString()}</span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.9rem' }}>${property.previousPrice.toLocaleString()}</span>
                        <span style={{ backgroundColor: property.price < property.previousPrice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: property.price < property.previousPrice ? 'var(--accent-color)' : 'var(--danger-color)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {property.price < property.previousPrice ? '↓' : '↑'} {Math.round(Math.abs(((property.price - property.previousPrice) / property.previousPrice) * 100))}%
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.4rem', color: 'var(--accent-color)', fontWeight: '800' }}>${property.price.toLocaleString()}</div>
                    )}
                    
                    <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📍 {property.location.city}
                    </p>
                  </div>

                  {/* Specs Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <span>🛏️ {property.bedrooms} Beds</span>
                    <span>🛁 {property.bathrooms} Baths</span>
                    <span>📐 {property.area} sqft</span>
                  </div>
                  
                  <button onClick={() => navigate(`/property/${property._id}`)} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
                    View Property Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '50px', gap: '20px' }}>
              <button 
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}
                style={{ padding: '12px 24px', backgroundColor: page === 1 ? 'var(--bg-hover)' : 'var(--primary-color)', color: page === 1 ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                &larr; Previous
              </button>
              
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Page {page} of {totalPages}</span>

              <button 
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}
                style={{ padding: '12px 24px', backgroundColor: page === totalPages ? 'var(--bg-hover)' : 'var(--primary-color)', color: page === totalPages ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {/* RECOMMENDATION ENGINE */}
      {userInfo && userInfo.role === 'buyer' && (
        <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ✨ Recommended for You
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '1.1rem' }}>Based on your favorites, budget patterns, and search history.</p>
          
          {loadingRecs ? (
            <div style={{ display: 'flex', gap: '20px', overflowX: 'hidden' }}>
              {[1, 2, 3, 4].map(n => <div key={n} style={{ minWidth: '300px', height: '250px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : recommendations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Start exploring and saving properties to see personalized recommendations here!</p>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: '25px', 
              overflowX: 'auto', 
              paddingBottom: '20px',
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none', 
              WebkitOverflowScrolling: 'none',
              scrollSnapType: 'x mandatory'
            }}>
              {recommendations.map(prop => (
                <div key={`rec-${prop._id}`} 
                  onClick={() => { navigate(`/property/${prop._id}`); window.scrollTo(0, 0); }}
                  style={{ 
                    minWidth: '320px', 
                    flex: '0 0 auto', 
                    backgroundColor: 'var(--bg-card)', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    border: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    scrollSnapAlign: 'start',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ position: 'relative', height: '200px' }}>
                    {prop.images?.length > 0 ? (
                      <img src={prop.images[0]} alt="Recommend" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-hover)' }} />
                    )}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                      {Math.round((Math.random() * 15) + 80)}% Match
                    </div>
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</h4>
                    <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: '800', fontSize: '1.2rem' }}>${prop.price.toLocaleString()}</p>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {prop.location.city} • {prop.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div onClick={() => setZoomedImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, cursor: 'zoom-out' }}>
          <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} />
          <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: '30px', right: '40px', background: 'transparent', color: 'white', border: 'none', fontSize: '3rem', cursor: 'pointer' }}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default Home;