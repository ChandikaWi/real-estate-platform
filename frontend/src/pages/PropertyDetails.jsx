import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favStatus, setFavStatus] = useState('');
  
  // Refs for In-Page Navigation
  const overviewRef = useRef(null);
  const specsRef = useRef(null);
  const reviewsRef = useRef(null);
  const similarRef = useRef(null);
  
  const [chatHistory, setChatHistory] = useState([]);
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState('');

  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerListings, setSellerListings] = useState([]);
  const [loadingSellerListings, setLoadingSellerListings] = useState(false);

  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [visitMessage, setVisitMessage] = useState('');

  const [buyerAiValuation, setBuyerAiValuation] = useState(null);
  const [generatingValuation, setGeneratingValuation] = useState(false);

  const [similarProperties, setSimilarProperties] = useState([]);

  // INTERACTIVE GALLERY STATES
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
  const [isZoomed, setIsZoomed] = useState(false); // Controls click-to-zoom in lightbox

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const { data: propData } = await api.get(`/properties/${id}`);
        setProperty(propData);
        
        const requests = [api.get(`/properties/${id}/similar`)];
        if (propData.sellerId) requests.push(api.get(`/reviews/seller/${propData.sellerId._id}`));
        if (userInfo) requests.push(api.get(`/messages/${id}`));

        const results = await Promise.all(requests);
        
        setSimilarProperties(results[0].data);
        if (propData.sellerId) setReviews(results[1].data);
        if (userInfo) setChatHistory(results[propData.sellerId ? 2 : 1].data);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchPropertyData();
  }, [id, userInfo?._id]);

  useEffect(() => {
    if (userInfo) {
      socket.connect();
      socket.emit('setup', userInfo);
      socket.on('receive_message', (newMessage) => {
        if (newMessage.propertyId._id === id || newMessage.propertyId === id) setChatHistory((prev) => [...prev, newMessage]);
      });
    }

    socket.on('property_status_updated', (data) => {
      if (data.propertyId === id) setProperty((prev) => ({ ...prev, status: data.status }));
    });

    return () => { 
      socket.off('receive_message'); 
      socket.off('property_status_updated'); 
      if (userInfo) socket.disconnect(); 
    };
  }, [userInfo, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  useEffect(() => {
    if (!loading && property && location.state?.openReview && reviewsRef.current) {
      setTimeout(() => scrollToSection(reviewsRef), 500);
    }
  }, [loading, property, location.state]);

  // AUTO-SLIDE EFFECT FOR GALLERY
  useEffect(() => {
    // Only auto-slide if the lightbox is closed and there are multiple images
    if (!property || !property.images || property.images.length <= 1 || lightbox.isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }, 4500); // Changes image every 4.5 seconds
    
    return () => clearInterval(interval);
  }, [property, lightbox.isOpen]);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 160; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // GALLERY NAVIGATION HANDLERS
  const nextImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const openLightbox = (index) => {
    setLightbox({ isOpen: true, index });
    setIsZoomed(false); 
  };

  const closeLightbox = () => {
    setLightbox({ isOpen: false, index: 0 });
    setIsZoomed(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      const { data } = await api.post('/messages', { receiverId: property.sellerId._id, propertyId: property._id, message: messageText });
      setChatHistory((prev) => [...prev, data]); setMessageText('');
    } catch (err) { alert('Failed to send message'); }
  };

  const handleSaveFavorite = async () => { 
    if (!userInfo) return setFavStatus('Please login to save favorites.');
    try { await api.post('/favorites', { propertyId: property._id }); setFavStatus('Saved to favorites!'); } 
    catch (err) { setFavStatus(err.response?.data?.message || 'Failed to save'); }
  };

  const fetchPropertyValuation = async () => {
    setGeneratingValuation(true);
    try {
      const { data } = await api.post('/properties/predict-price', {
        city: property.location.city, type: property.type, bedrooms: property.bedrooms || 0, bathrooms: property.bathrooms || 0, area: property.area
      });
      setBuyerAiValuation(data.estimatedPrice);
    } catch (err) {
      alert("AI Valuation engine is currently unavailable.");
    } finally {
      setGeneratingValuation(false);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visits', { propertyId: property._id, date: visitDate, timeSlot });
      setVisitMessage('Visit requested! Check dashboard for updates.');
      setVisitDate(''); setTimeSlot('');
    } catch (err) { setVisitMessage(err.response?.data?.message || 'Failed to schedule visit.'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault(); setReviewError('');
    try {
      if (editingReviewId) {
        const { data } = await api.put(`/reviews/${editingReviewId}`, reviewFormData);
        setReviews(reviews.map(r => r._id === editingReviewId ? data : r)); setEditingReviewId(null);
      } else {
        const { data } = await api.post('/reviews', { sellerId: property.sellerId._id, ...reviewFormData });
        setReviews([data, ...reviews]);
      }
      setReviewFormData({ rating: 5, comment: '' });
    } catch (err) { setReviewError(err.response?.data?.message || 'Failed to submit review'); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      try { await api.delete(`/reviews/${reviewId}`); setReviews(reviews.filter(r => r._id !== reviewId)); } 
      catch (err) { alert('Failed to delete review'); }
    }
  };

  const handleEditClick = (review) => { setEditingReviewId(review._id); setReviewFormData({ rating: review.rating, comment: review.comment }); };

  const handleOpenSellerProfile = async () => {
    setShowSellerModal(true); setLoadingSellerListings(true);
    try { const { data } = await api.get(`/properties/user/${property.sellerId._id}`); setSellerListings(data); } 
    catch (err) { console.error("Failed to fetch seller listings"); } finally { setLoadingSellerListings(false); }
  };

  const navigateToProperty = (propId) => { setShowSellerModal(false); navigate(`/property/${propId}`); window.scrollTo(0, 0); };

  const renderStars = (rating) => [...Array(5)].map((_, i) => (<span key={i} style={{ color: i < rating ? '#f1c40f' : 'var(--border-color)', fontSize: '1.2rem' }}>★</span>));

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading premium details...</h2></div>;
  if (error) return <h2 style={{ color: 'var(--danger-color)', textAlign: 'center', marginTop: '100px' }}>{error}</h2>;
  if (!property) return <h2 style={{ color: 'var(--text-main)', textAlign: 'center', marginTop: '100px' }}>Property not found.</h2>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const isOwner = userInfo && userInfo._id === property.sellerId._id;
  const isAdmin = userInfo && userInfo.role === 'admin';
  const myExistingReview = reviews.find(r => r.buyerId._id === userInfo?._id);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', color: 'var(--text-main)' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          &larr; Back to search
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <span style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: 'var(--shadow-sm)' }}>{property.type}</span>
              <span style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>For {property.listingType === 'rent' ? 'Rent' : 'Sale'}</span>
              {property.status !== 'Active' && <span style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: 'var(--shadow-sm)' }}>{property.status}</span>}
            </div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: '800', lineHeight: '1.2' }}>{property.title}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 {property.location.address}, {property.location.city}</p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SLIDER & THUMBNAILS */}
      {property.images && property.images.length > 0 ? (
        <div style={{ marginBottom: '40px' }}>
          {/* Main Hero Slider */}
          <div style={{ position: 'relative', width: '100%', height: 'clamp(300px, 55vh, 600px)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            <img 
              src={property.images[currentImageIndex]} 
              alt="Property Visual" 
              onClick={() => openLightbox(currentImageIndex)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', transition: 'opacity 0.3s ease-in-out' }} 
            />

            {/* In-Picture Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'background 0.2s', backdropFilter: 'blur(5px)' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
                >&#8592;</button>
                <button 
                  onClick={nextImage} 
                  style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'background 0.2s', backdropFilter: 'blur(5px)' }}
                  onMouseOver={e => e.currentTarget.style.background = '#fff'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
                >&#8594;</button>
              </>
            )}

            {/* Picture Counter Badge */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {property.images.length > 1 && (
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginTop: '20px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
              {property.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{ minWidth: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: currentImageIndex === idx ? '3px solid var(--primary-color)' : '3px solid transparent', opacity: currentImageIndex === idx ? 1 : 0.6, transition: 'all 0.2s ease' }}
                >
                  <img src={img} alt={`Thumbnail ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: '300px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', marginBottom: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>No images available</h3>
        </div>
      )}

      {/* In-Page Sticky Navigation Bar */}
      <div style={{ position: 'sticky', top: '70px', zIndex: 90, backgroundColor: 'rgba(var(--bg-card-rgb), 0.9)', backdropFilter: 'blur(10px)', padding: '15px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '40px', display: 'flex', gap: '25px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {[
          { label: 'Overview', ref: overviewRef },
          { label: 'Specifications', ref: specsRef },
          { label: 'Reviews', ref: reviewsRef },
          { label: 'Similar Properties', ref: similarRef }
        ].map((item) => (
          <button key={item.label} onClick={() => scrollToSection(item.ref)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            {item.label}
          </button>
        ))}
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ flex: '1 1 650px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
          <div ref={overviewRef}>
            <div style={{ display: 'flex', gap: '20px', paddingBottom: '30px', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', flexWrap: 'wrap' }}>
              {property.type !== 'land' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '1.8rem', padding: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '16px' }}>🛏️</div><div><p style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>{property.bedrooms || 0}</p><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Bedrooms</p></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '1.8rem', padding: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '16px' }}>🛁</div><div><p style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>{property.bathrooms || 0}</p><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Bathrooms</p></div></div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ fontSize: '1.8rem', padding: '12px', backgroundColor: 'var(--bg-hover)', borderRadius: '16px' }}>📐</div><div><p style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>{property.area?.toLocaleString()}</p><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>{property.type === 'land' ? 'Plot Area (sqft)' : 'Square Feet'}</p></div></div>
            </div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '15px' }}>About this property</h3>
            <p style={{ lineHeight: '1.8', color: 'var(--text-muted)', fontSize: '1.1rem', whiteSpace: 'pre-line' }}>{property.description}</p>
          </div>
          
          <div ref={specsRef}>
            {property.valuationMetrics && (
              <>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '25px' }}>Property Specifications</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.8rem' }}>🏗️</span><div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Year Built</p><p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{property.valuationMetrics.yearBuilt || 'N/A'}</p></div></div>
                  <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.8rem' }}>🚆</span><div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Transit Distance</p><p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{property.valuationMetrics.distanceToTransport ? `${property.valuationMetrics.distanceToTransport} km` : 'N/A'}</p></div></div>
                  <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.8rem' }}>🚗</span><div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Parking Spaces</p><p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{property.valuationMetrics.parkingSpaces || 'N/A'}</p></div></div>
                  <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.8rem' }}>✨</span><div><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Condition Score</p><p style={{ margin: 0, fontWeight: '900', color: 'var(--primary-color)', fontSize: '1.1rem' }}>{property.valuationMetrics.conditionScore ? `${property.valuationMetrics.conditionScore}/10` : 'N/A'}</p></div></div>
                </div>
              </>
            )}
          </div>

          <div ref={reviewsRef} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 25px 0', color: 'var(--text-main)' }}>Seller Ratings & Reviews</h2>
            {userInfo?.role === 'buyer' && (!myExistingReview || editingReviewId) && (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '40px', boxShadow: 'var(--shadow-md)' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>{editingReviewId ? 'Edit Your Review' : 'Rate Your Experience'}</h4>
                {reviewError && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', margin: '0 0 15px 0' }}>{reviewError}</p>}
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginRight: '15px', fontSize: '1.1rem' }}>Rating:</label>
                    <select value={reviewFormData.rating} onChange={(e) => setReviewFormData({...reviewFormData, rating: Number(e.target.value)})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem', cursor: 'pointer' }}>
                      <option value="5">5 - Excellent ★★★★★</option><option value="4">4 - Very Good ★★★★</option><option value="3">3 - Average ★★★</option><option value="2">2 - Poor ★★</option><option value="1">1 - Terrible ★</option>
                    </select>
                  </div>
                  <textarea required value={reviewFormData.comment} onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})} placeholder="Share your experience with this seller..." style={{ width: '100%', padding: '18px', boxSizing: 'border-box', minHeight: '120px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', fontSize: '1.05rem', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button type="submit" style={{ padding: '14px 28px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' }}>{editingReviewId ? 'Update Review' : 'Submit Review'}</button>
                    {editingReviewId && <button type="button" onClick={() => setEditingReviewId(null)} style={{ padding: '14px 28px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' }}>Cancel</button>}
                  </div>
                </form>
              </div>
            )}

            {reviews.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>This seller currently has no reviews.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {reviews.map((review) => (
                  <div key={review._id} style={{ backgroundColor: 'transparent', padding: '0', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {review.buyerId?.profilePhoto ? (
                          <img src={review.buyerId.profilePhoto} alt="Buyer" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.4rem' }}>{review.buyerId?.name?.charAt(0).toUpperCase()}</div>
                        )}
                        <div><p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '1.15rem' }}>{review.buyerId?.name}</p><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div>{renderStars(review.rating)}</div><span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</span></div></div>
                      </div>
                      {userInfo && userInfo._id === review.buyerId?._id && (
                        <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => handleEditClick(review)} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Edit</button><button onClick={() => handleDeleteReview(review._id)} style={{ padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Delete</button></div>
                      )}
                    </div>
                    <p style={{ marginTop: '20px', color: 'var(--text-main)', lineHeight: '1.7', fontSize: '1.05rem' }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Sticky Conversion Card */}
        <div style={{ flex: '1 1 380px', position: 'sticky', top: '160px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '35px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: '35px' }}>
              <div style={{ fontSize: '2.4rem', color: 'var(--accent-color)', fontWeight: '900', lineHeight: 1.2, letterSpacing: '-0.5px' }}>Rs. {property.price.toLocaleString()}{property.listingType === 'rent' && <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'normal' }}> / mo</span>}</div>
              {property.listingType !== 'rent' && (
                <div style={{ marginTop: '20px' }}>
                  {!buyerAiValuation ? (
                    <button onClick={fetchPropertyValuation} disabled={generatingValuation} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--bg-hover)', color: 'var(--primary-color)', border: '2px solid var(--primary-color)', borderRadius: '14px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: '800' }}>{generatingValuation ? 'Analyzing Market Data...' : '🤖 Check AI Fair Value'}</button>
                  ) : (
                    <div style={{ padding: '18px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '2px solid var(--accent-color)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}><span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600' }}>AI Est. Value:</span><span style={{ fontSize: '1.3rem', color: 'var(--accent-color)', fontWeight: '900' }}>Rs. {Math.round(buyerAiValuation).toLocaleString()}</span></div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '25px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Listed by</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {property.sellerId?.profilePhoto ? (
                  <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{property.sellerId?.name?.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem' }}>{property.sellerId?.name}</p><div style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>⭐ {avgRating} ({reviews.length} reviews) {property.sellerId?.isVerified && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>• Verified</span>}</div></div>
              </div>
              <button onClick={handleOpenSellerProfile} style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>View Seller Profile</button>
            </div>

            {!userInfo ? (
              <div style={{ textAlign: 'center' }}><p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '1.05rem' }}>Login to contact the seller or schedule a visit.</p><button onClick={() => navigate('/login')} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer' }}>Sign In / Register</button></div>
            ) : isOwner ? (
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(52, 152, 219, 0.1)', borderRadius: '14px', color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem' }}>This is your active listing.</div>
            ) : isAdmin ? (
              <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(243, 156, 18, 0.1)', borderRadius: '14px', color: '#f39c12', fontWeight: '800', fontSize: '1.1rem' }}>Admin Preview Mode</div>
            ) : (
              <>
                <div style={{ marginBottom: '30px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: 'var(--bg-hover)', padding: '15px 20px', fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid var(--border-color)' }}>💬 Direct Message</div>
                  <div style={{ height: '220px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chatHistory.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', margin: 'auto' }}>Send a message to start negotiating!</p> : (
                      chatHistory.map((msg, index) => {
                        const isMe = msg.senderId._id === userInfo._id;
                        return (<div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', backgroundColor: isMe ? 'var(--primary-color)' : 'var(--bg-card)', color: isMe ? '#fff' : 'var(--text-main)', border: isMe ? 'none' : '1px solid var(--border-color)', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', maxWidth: '85%', fontSize: '0.95rem', lineHeight: '1.5', boxShadow: 'var(--shadow-sm)' }}>{msg.message}</div>)
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '12px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}><input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." required style={{ flex: 1, padding: '12px 18px', border: '1px solid var(--border-color)', borderRadius: '24px', outline: 'none', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem' }} /><button type="submit" style={{ marginLeft: '10px', padding: '0 20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button></form>
                </div>
                {property.status === 'Active' && (
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>📅 Schedule a Viewing</h4>
                    {visitMessage && <p style={{ fontSize: '0.95rem', color: visitMessage.includes('requested') ? 'var(--accent-color)' : 'var(--danger-color)', margin: '0 0 15px 0', fontWeight: 'bold' }}>{visitMessage}</p>}
                    <form onSubmit={handleScheduleVisit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><input type="date" required min={new Date().toISOString().split('T')[0]} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', fontSize: '1rem' }} /><select required value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit', fontSize: '1rem' }}><option value="">Select a Time Slot</option><option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option><option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option><option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option><option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option><option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option><option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option><option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option></select><button type="submit" style={{ width: '100%', padding: '16px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '2px solid var(--text-main)', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' }}>Request Viewing</button></form>
                  </div>
                )}
                <button onClick={handleSaveFavorite} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '2px solid var(--danger-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>❤️ Save to Favorites</button>
                {favStatus && <p style={{ marginTop: '15px', textAlign: 'center', color: favStatus.includes('Saved') ? 'var(--accent-color)' : 'var(--danger-color)', fontWeight: 'bold', fontSize: '0.95rem' }}>{favStatus}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* SIMILAR PROPERTIES */}
      <div ref={similarRef} style={{ marginTop: '80px', paddingTop: '50px', borderTop: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2.2rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>Similar Properties You Might Like</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.15rem' }}>Based on your current viewing preferences.</p>
        {similarProperties.length === 0 ? (
          <div style={{ padding: '50px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', textAlign: 'center', border: '1px dashed var(--border-color)' }}><p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.15rem' }}>No similar properties available on the market right now.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '35px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {similarProperties.map(prop => (
              <div key={prop._id} onClick={() => navigateToProperty(prop._id)} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s ease', display: 'flex', flexDirection: 'column' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'}} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'}}>
                <div style={{ height: '220px', backgroundColor: 'var(--bg-hover)', position: 'relative' }}>
                  {prop.images?.length > 0 ? <img src={prop.images[0]} alt="Similar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>}
                  <span style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#111', padding: '6px 14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)' }}>{prop.type}</span>
                </div>
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '900', marginBottom: '10px' }}>Rs. {prop.price.toLocaleString()} {prop.listingType === 'rent' ? '/ mo' : ''}</div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>{prop.title}</h4>
                  <p style={{ margin: 'auto 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>📍 {prop.location.city} {prop.type !== 'land' && `• ${prop.bedrooms} Beds`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL WITH ZOOM */}
      {lightbox.isOpen && property.images && property.images.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          
          <button onClick={closeLightbox} style={{ position: 'absolute', top: '25px', right: '35px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 10001 }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--danger-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>&times;</button>
          
          <div style={{ position: 'relative', width: '90vw', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: isZoomed ? 'auto' : 'hidden' }}>
            {/* Main Lightbox Image (Click to Zoom) */}
            <img 
              src={property.images[lightbox.index]} 
              alt={`View ${lightbox.index + 1}`} 
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
              style={{ 
                maxWidth: isZoomed ? 'none' : '100%', 
                maxHeight: isZoomed ? 'none' : '100%', 
                width: isZoomed ? 'auto' : 'auto', 
                height: isZoomed ? 'auto' : 'auto', 
                objectFit: 'contain', 
                cursor: isZoomed ? 'zoom-out' : 'zoom-in', 
                transform: isZoomed ? 'scale(1.5)' : 'scale(1)', 
                transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                borderRadius: isZoomed ? '0' : '12px',
                boxShadow: isZoomed ? 'none' : '0 20px 50px rgba(0,0,0,0.5)'
              }} 
            />

            {/* Navigation Arrows */}
            {!isZoomed && property.images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index - 1 + property.images.length) % property.images.length })); }} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}>&#8592;</button>
                <button onClick={(e) => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index + 1) % property.images.length })); }} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: '60px', height: '60px', borderRadius: '50%', cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}>&#8594;</button>
              </>
            )}
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '20px', fontSize: '1.1rem', fontWeight: '500', letterSpacing: '1px' }}>
            {isZoomed ? 'Click to zoom out' : `Photo ${lightbox.index + 1} of ${property.images.length} (Click to zoom)`}
          </p>
        </div>
      )}

      {/* SELLER PROFILE MODAL */}
      {showSellerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '40px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                {property.sellerId?.profilePhoto ? (
                  <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)' }} />
                ) : (
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3rem', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)' }}>{property.sellerId?.name?.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>{property.sellerId?.name}{property.sellerId?.isVerified && <span style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Verified</span>}</h2>
                  <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>{renderStars(Math.round(avgRating))} <span style={{ marginLeft: '10px', fontWeight: 'bold', color: 'var(--text-main)' }}>{avgRating} / 5</span> <span style={{ fontSize: '0.9rem' }}>({reviews.length} Reviews)</span></div>
                </div>
              </div>
              <button onClick={() => setShowSellerModal(false)} style={{ background: 'var(--bg-hover)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            <div style={{ padding: '40px' }}>
              <h3 style={{ margin: '0 0 25px 0', fontSize: '1.5rem' }}>Active Listings ({sellerListings.length})</h3>
              {loadingSellerListings ? <p style={{ color: 'var(--text-muted)' }}>Loading portfolio...</p> : sellerListings.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>This seller has no other active listings.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }}>
                  {sellerListings.map(item => (
                    <div key={item._id} onClick={() => navigateToProperty(item._id)} style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                      {item.images?.length > 0 ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '160px', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>}
                      <div style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '1.2rem', marginBottom: '5px' }}>Rs. {item.price.toLocaleString()}</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'normal' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {item.location.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;