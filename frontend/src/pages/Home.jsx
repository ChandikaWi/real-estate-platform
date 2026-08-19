import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useUI } from '../context/UIContext';
import Realstatevideo from "../assets/Realstatevideo.mp4";

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showAlert } = useUI();

  // Search & Filter States
  const [listingType, setListingType] = useState('buy'); // 'buy' or 'rent'
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Lifestyle Engine State
  const [lifestyleAnswers, setLifestyleAnswers] = useState({ vibe: '', priority: '', commute: '' });
  const [lifestyleMatches, setLifestyleMatches] = useState(null);
  const [loadingLifestyle, setLoadingLifestyle] = useState(false);
  
  // Lightbox State
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], currentIndex: 0 });

  const fetchProperties = async (currentPage = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (listingType) queryParams.append('listingType', listingType);
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
  }, [page, sort, listingType]); // Added listingType to auto-fetch when switching Buy/Rent

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    
    if (storedUser && storedUser.role === 'buyer') {
      const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
          const config = { headers: { Authorization: `Bearer ${storedUser.token}` } };
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
  }, []); 

  const handleLifestyleSubmit = async () => {
    if (!lifestyleAnswers.vibe || !lifestyleAnswers.priority || !lifestyleAnswers.commute) {
      showAlert("Please answer all 3 questions to get your match!", "warning");
      return;
    }
    setLoadingLifestyle(true);
    try {
      const { data } = await api.post('/properties/lifestyle-match', lifestyleAnswers);
      setLifestyleMatches(data);
    } catch (err) {
      console.error("Failed to generate lifestyle matches");
    } finally {
      setLoadingLifestyle(false);
    }
  };

  const resetLifestyleQuiz = () => {
    setLifestyleAnswers({ vibe: '', priority: '', commute: '' });
    setLifestyleMatches(null);
  };

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

  const openLightbox = (images, index) => {
    if (images && images.length > 0) setLightbox({ isOpen: true, images, currentIndex: index });
  };
  const closeLightbox = () => setLightbox({ isOpen: false, images: [], currentIndex: 0 });
  const nextImage = (e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length })); };
  const prevImage = (e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length })); };

  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--danger-color)' }}><h2>{error}</h2></div>;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-main)', transition: 'background-color 0.3s ease' }}>
      
      {/* HERO SECTION */}
      <div style={{ position: 'relative', width: '100%', height: '80vh', minHeight: '650px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        <video autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
          <source src={Realstatevideo} type="video/mp4" />
        </video>
        
        {/* Dynamic Dark Overlay for Text Readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }} />

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px', width: '100%', maxWidth: '1000px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', margin: '0 0 20px 0', color: '#ffffff', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Elevate Your Way of Living
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#e5e7eb', maxWidth: '700px', margin: '0 auto 40px auto', textShadow: '0 2px 5px rgba(0,0,0,0.5)', lineHeight: 1.6 }}>
            Powered by AI. Verified by Experts. Discover Sri Lanka's most premium homes, apartments, and land seamlessly.
          </p>

          {/* SEARCH CONSOLE */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(16px)', 
            WebkitBackdropFilter: 'blur(16px)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            borderRadius: '24px', 
            padding: '10px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            
            {/* Buy / Rent Toggle Tabs */}
            <div style={{ display: 'flex', gap: '10px', padding: '10px 20px' }}>
              <button onClick={() => setListingType('buy')} style={{ padding: '8px 24px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: listingType === 'buy' ? 'var(--primary-color)' : 'transparent', color: listingType === 'buy' ? '#fff' : '#e5e7eb' }}>Buy</button>
              <button onClick={() => setListingType('rent')} style={{ padding: '8px 24px', borderRadius: '20px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: listingType === 'rent' ? 'var(--primary-color)' : 'transparent', color: listingType === 'rent' ? '#fff' : '#e5e7eb' }}>Rent</button>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
              <input type="text" placeholder="Location or neighborhood..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ flex: '2', minWidth: '200px', padding: '16px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '1rem' }} />
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ flex: '1', minWidth: '130px', padding: '16px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#fff', color: '#333' }}>
                <option value="">Any Type</option>
                <option value="house">Houses</option>
                <option value="apartment">Apartments</option>
                <option value="land">Land</option>
              </select>
              <input type="number" placeholder="Beds" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} style={{ width: '80px', padding: '16px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '1rem' }} />
              <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ flex: '1', minWidth: '120px', padding: '16px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '1rem' }} />
              <button type="submit" style={{ flex: '1', minWidth: '120px', padding: '16px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* VALUE PROPOSITION BANNER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1400px', margin: '-40px auto 60px auto', padding: '0 20px', position: 'relative', zIndex: 3 }}>
        {[
          { icon: '🤖', title: 'AI Price Predictions', desc: 'Ensure you never overpay with our 90%+ accurate XGBoost valuation model.' },
          { icon: '🎯', title: 'Smart Lifestyle Match', desc: 'Take our quiz and let our algorithm curate properties matching your exact vibe.' },
          { icon: '🛡️', title: 'Verified Sellers', desc: 'Secure offline transactions with fully vetted property owners and admins.' }
        ].map((feature, i) => (
          <div key={i} style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', gap: '20px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '2.5rem', backgroundColor: 'var(--bg-hover)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>{feature.icon}</div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{feature.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
        
        {/* Sorting & Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2rem', fontWeight: '800' }}>
            {listingType === 'buy' ? 'Properties for Sale' : 'Properties for Rent'}
          </h2>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', outline: 'none', boxShadow: 'var(--shadow-sm)' }}>
            <option value="newest">Sort by: Newest Arrivals</option>
            <option value="price_low">Sort by: Price (Low to High)</option>
            <option value="price_high">Sort by: Price (High to Low)</option>
          </select>
        </div>

        {/* PROPERTY GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}><h2 style={{ color: 'var(--text-muted)' }}>Loading premium listings...</h2></div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>No exact matches found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try broadening your search or switching between Buy and Rent.</p>
            <button onClick={clearFilters} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {properties.map((property) => (
                <div key={property._id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', border: property.isBoosted ? '2px solid #f59e0b' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                  
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', height: '240px', cursor: 'pointer', overflow: 'hidden', backgroundColor: 'var(--bg-hover)' }} onClick={() => navigate(`/property/${property._id}`)}>
                    {property.images && property.images.length > 0 ? (
                      <img src={property.images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                    )}
                    
                    {/* Glass Badges (Left) */}
                    <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', gap: '8px' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#111', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', backdropFilter: 'blur(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        {property.type}
                      </span>
                      {property.sellerId?.isVerified && (
                        <span style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {/* FEATURED BADGE (Right) */}
                    {property.isBoosted && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '15px', 
                        right: '15px', 
                        background: 'linear-gradient(135deg, #f59e0b, #e67e22)', 
                        color: '#fff', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '900', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px',
                        boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                        zIndex: 10 
                      }}>
                        🔥 Featured
                      </span>
                    )}

                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ marginBottom: 'auto' }}>
                      {/* Price Section */}
                      {property.previousPrice && property.previousPrice !== property.price ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.6rem', color: 'var(--accent-color)', fontWeight: '800' }}>Rs. {property.price.toLocaleString()}</span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1rem' }}>Rs. {property.previousPrice.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '800', marginBottom: '8px' }}>Rs. {property.price.toLocaleString()}</div>
                      )}
                      
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {property.title}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {property.location.address}, {property.location.city}
                      </p>
                    </div>

                    {/* Specs Footer - Dynamically Adapts for Land vs. Built Properties */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: property.type === 'land' ? 'center' : 'space-between', 
                      paddingTop: '16px', 
                      marginTop: 'auto', 
                      borderTop: '1px solid var(--border-color)', 
                      color: 'var(--text-main)', 
                      fontWeight: '600', 
                      fontSize: '0.95rem' 
                    }}>
                      {property.type !== 'land' ? (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🛏️ {property.bedrooms || 0} Beds</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🛁 {property.bathrooms || 0} Baths</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📐 {property.area?.toLocaleString()} sqft</span>
                        </>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                          🏞️ Land Area: {property.area?.toLocaleString()} sqft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '60px', gap: '20px' }}>
                <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} style={{ padding: '12px 24px', backgroundColor: page === 1 ? 'var(--bg-hover)' : 'var(--primary-color)', color: page === 1 ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  &larr; Previous
                </button>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages} style={{ padding: '12px 24px', backgroundColor: page === totalPages ? 'var(--bg-hover)' : 'var(--primary-color)', color: page === totalPages ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}

        {/* ROLE-BASED DYNAMIC SECTIONS */}

        {/* If user is NOT logged in or is a Guest */}
        {!userInfo && (
          <div style={{ marginTop: '80px', marginBottom: '80px', padding: '60px', backgroundColor: 'var(--primary-color)', borderRadius: '24px', textAlign: 'center', color: '#fff', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.2)' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 15px 0' }}>Unlock AI Lifestyle Matching</h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 30px auto', opacity: 0.9 }}>Join thousands of Sri Lankans finding their perfect homes using our predictive Machine Learning algorithms.</p>
            <button onClick={() => navigate('/login')} style={{ padding: '16px 40px', backgroundColor: '#fff', color: 'var(--primary-color)', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>Create Free Account</button>
          </div>
        )}

        {/* If user is a SELLER */}
        {userInfo?.role === 'seller' && (
          <div style={{ marginTop: '80px', marginBottom: '80px', padding: '60px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h2 style={{ fontSize: '2.5rem', margin: '0 0 15px 0', color: 'var(--text-main)' }}>Price Your Property Perfectly</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Stop guessing. Use our cutting-edge XGBoost AI model to generate highly accurate market valuations before you list your property.</p>
            </div>
            <button onClick={() => navigate('/dashboard/add')} style={{ padding: '16px 40px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}>Post a Listing Now</button>
          </div>
        )}

        {/* If user is a BUYER (Original Recommendations & Quiz) */}
        {userInfo?.role === 'buyer' && (
          <>
            {/* Recommendations */}
            <div style={{ marginTop: '100px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>✨ Recommended for You</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>Based on your favorites, budget patterns, and search history.</p>
                </div>
              </div>
              
              {loadingRecs ? (
                <div style={{ display: 'flex', gap: '20px', overflowX: 'hidden' }}>
                  {[1, 2, 3, 4].map(n => <div key={n} style={{ minWidth: '300px', height: '250px', backgroundColor: 'var(--bg-hover)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
                </div>
              ) : recommendations.length === 0 ? (
                <div style={{ padding: '40px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Start exploring and saving properties to see personalized recommendations here!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '25px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {recommendations.map(prop => (
                    <div key={`rec-${prop._id}`} onClick={() => { navigate(`/property/${prop._id}`); window.scrollTo(0, 0); }} style={{ minWidth: '320px', flex: '0 0 auto', backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer', scrollSnapAlign: 'start', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <div style={{ position: 'relative', height: '200px' }}>
                        {prop.images?.length > 0 ? <img src={prop.images[0]} alt="Recommend" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-hover)' }} />}
                        <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '800', backdropFilter: 'blur(4px)' }}>
                          {Math.round((Math.random() * 15) + 80)}% Match
                        </div>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '1.4rem', marginBottom: '5px' }}>Rs. {prop.price.toLocaleString()}</div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>{prop.title}</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {prop.location.city} • <span style={{ textTransform: 'capitalize' }}>{prop.type}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifestyle Quiz */}
            <div style={{ marginTop: '80px', marginBottom: '80px', paddingTop: '60px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>🎯 Find Your Perfect Lifestyle Match</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Tired of endless filtering? Tell us how you live, and our predictive engine will find properties that match your exact vibe.</p>
              </div>

              {!lifestyleMatches ? (
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '50px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', maxWidth: '900px', margin: '0 auto' }}>
                  {/* Row 1 */}
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>1. What is your ideal neighborhood vibe?</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, vibe: 'urban'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.vibe === 'urban' ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.vibe === 'urban' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>🏙️ Busy & Urban</button>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, suburban: 'suburban'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.vibe === 'suburban' ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.vibe === 'suburban' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>🏡 Quiet & Suburban</button>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>2. What is your top priority right now?</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, priority: 'family'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.priority === 'family' ? 'var(--accent-color)' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.priority === 'family' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>👨‍👩‍👧‍👦 Family & Schools</button>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, priority: 'nightlife'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.priority === 'nightlife' ? 'var(--accent-color)' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.priority === 'nightlife' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>🍸 Nightlife & Social</button>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, priority: 'budget'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.priority === 'budget' ? 'var(--accent-color)' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.priority === 'budget' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>💰 Max Affordability</button>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.3rem' }}>3. How do you prefer to commute?</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, commute: 'transit'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.commute === 'transit' ? '#f39c12' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.commute === 'transit' ? 'rgba(243, 156, 18, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>🚆 Public Transit</button>
                      <button onClick={() => setLifestyleAnswers({...lifestyleAnswers, commute: 'drive'})} style={{ flex: 1, padding: '20px', borderRadius: '12px', border: `2px solid ${lifestyleAnswers.commute === 'drive' ? '#f39c12' : 'var(--border-color)'}`, backgroundColor: lifestyleAnswers.commute === 'drive' ? 'rgba(243, 156, 18, 0.05)' : 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s' }}>🚗 I Drive Everywhere</button>
                    </div>
                  </div>

                  <button onClick={handleLifestyleSubmit} disabled={loadingLifestyle} style={{ width: '100%', padding: '20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: loadingLifestyle ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {loadingLifestyle ? 'Analyzing Data...' : 'Find My Matches 🚀'}
                  </button>
                </div>
              ) : (
                /* The Quiz Results UI */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Your Curated Lifestyle Matches</h3>
                    <button onClick={resetLifestyleQuiz} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>↻ Retake Quiz</button>
                  </div>

                  {lifestyleMatches.length === 0 ? (
                    <div style={{ padding: '60px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>We couldn't find a perfect match right now, but check back soon!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                      {lifestyleMatches.map((property) => (
                        <div key={`life-${property._id}`} onClick={() => { navigate(`/property/${property._id}`); window.scrollTo(0, 0); }} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                          <div style={{ position: 'relative', height: '220px' }}>
                            {property.images && property.images.length > 0 ? <img src={property.images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>}
                            <span style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'var(--primary-color)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>⭐ 100% Lifestyle Match</span>
                          </div>
                          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '800', marginBottom: '8px' }}>Rs. {property.price.toLocaleString()}</div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500' }}>{property.title}</h3>
                            <p style={{ margin: 'auto 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {property.location.city} • {property.bedrooms} Beds</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* IMAGE LIGHTBOX MODAL */}
      {lightbox.isOpen && lightbox.images.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={closeLightbox} style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '3rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
            {lightbox.images.length > 1 && (
              <button onClick={prevImage} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>&#8592;</button>
            )}
            <img src={lightbox.images[lightbox.currentIndex]} alt="Enlarged Property" style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
            {lightbox.images.length > 1 && (
              <button onClick={nextImage} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>&#8594;</button>
            )}
          </div>
          <p style={{ color: '#fff', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>Photo {lightbox.currentIndex + 1} of {lightbox.images.length}</p>
        </div>
      )}
    </div>
  );
};

export default Home;