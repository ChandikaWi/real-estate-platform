import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favStatus, setFavStatus] = useState('');
  
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

  // Similar Properties
  const [similarProperties, setSimilarProperties] = useState([]);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const { data: propData } = await api.get(`/properties/${id}`);
        setProperty(propData);
        
        // Parallel requests for speed
        const requests = [
          api.get(`/properties/${id}/similar`) // Fetch similar properties
        ];

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
    return () => { socket.off('receive_message'); socket.disconnect(); };
  }, [userInfo, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

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

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visits', { propertyId: property._id, date: visitDate, timeSlot });
      setVisitMessage('Visit requested! Check your dashboard for updates.');
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

  if (loading) return <div style={{ maxWidth: '1000px', margin: '50px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading property details...</h2></div>;
  if (error) return <h2 style={{ color: 'var(--danger-color)' }}>{error}</h2>;
  if (!property) return <h2 style={{ color: 'var(--text-main)' }}>Property not found.</h2>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const isOwner = userInfo && userInfo._id === property.sellerId._id;
  const isAdmin = userInfo && userInfo.role === 'admin';
  const myExistingReview = reviews.find(r => r.buyerId._id === userInfo?._id);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', color: 'var(--text-main)' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', padding: 0 }}>&larr; Back</button>
      
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ margin: 0 }}>{property.title}</h1>
            {/* LIFECYCLE BADGE */}
            {property.status !== 'Active' && (
              <span style={{ backgroundColor: 'var(--danger-color)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {property.status}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Rs. {property.price.toLocaleString()}</h2>
        </div>

        {property.images && property.images.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {property.images.map((imgUrl, index) => (
              <img key={index} src={imgUrl} alt="Gallery" style={{ height: '300px', width: 'auto', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          {/* LEFT COLUMN */}
          <div>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>{property.description}</p>
            
            <h3>Property Details</h3>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', color: 'var(--text-main)' }}>
              <li><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{property.type}</span></li>
              <li><strong>Location:</strong> {property.location.address}, {property.location.city}</li>
              <li><strong>Size:</strong> {property.area} sqft</li>
              <li><strong>Bedrooms:</strong> {property.bedrooms}</li>
              <li><strong>Bathrooms:</strong> {property.bathrooms}</li>
            </ul>
            
            {property.valuationMetrics && (
              <>
                <h3>Valuation Data</h3>
                <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <li><strong>Year Built:</strong> {property.valuationMetrics.yearBuilt || 'N/A'}</li>
                  <li><strong>Distance to Transport:</strong> {property.valuationMetrics.distanceToTransport ? `${property.valuationMetrics.distanceToTransport} km` : 'N/A'}</li>
                  <li><strong>Parking Spaces:</strong> {property.valuationMetrics.parkingSpaces || 'N/A'}</li>
                  <li><strong>Condition Score:</strong> {property.valuationMetrics.conditionScore ? `${property.valuationMetrics.conditionScore}/10` : 'N/A'}</li>
                </ul>
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
            <h3>Seller Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              {property.sellerId?.profilePhoto ? (
                <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {property.sellerId?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {property.sellerId?.name}
                  {property.sellerId?.isVerified && <span style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>✓ Verified</span>}
                </p>
                <div style={{ margin: '2px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {renderStars(Math.round(avgRating))} <span style={{ marginLeft: '5px' }}>({reviews.length === 0 ? 'No reviews' : `${avgRating} / 5`})</span>
                </div>
              </div>
            </div>
            <button onClick={handleOpenSellerProfile} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: 'var(--primary-color)', border: '2px solid var(--primary-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>View Full Profile</button>
            
            {!userInfo ? (
              <p style={{ color: 'var(--danger-color)', marginTop: '15px' }}>Please <Link to="/login" style={{ color: 'var(--primary-color)' }}>login</Link> to contact the seller.</p>
            ) : isOwner ? (
              <p style={{ color: 'var(--accent-color)', marginTop: '15px', fontWeight: 'bold' }}>This is your listing.</p>
            ) : isAdmin ? (
              <p style={{ color: '#f39c12', marginTop: '15px', fontWeight: 'bold' }}>Admin View</p>
            ) : (
              <div style={{ marginTop: '15px', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Live Chat with Seller</div>
                <div style={{ height: '250px', overflowY: 'auto', padding: '10px', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatHistory.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', margin: 'auto' }}>No messages yet. Say hello!</p> : (
                    chatHistory.map((msg, index) => {
                      const isMe = msg.senderId._id === userInfo._id;
                      return (
                        <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', backgroundColor: isMe ? 'var(--primary-color)' : 'var(--bg-hover)', color: isMe ? '#fff' : 'var(--text-main)', padding: '8px 12px', borderRadius: '15px', maxWidth: '80%', boxShadow: 'var(--shadow-sm)' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.message}</p>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." required style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }} />
                  <button type="submit" style={{ padding: '10px 15px', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                </form>
              </div>
            )}

            {/* Visit Scheduling UI */}
            {userInfo && userInfo.role === 'buyer' && !isOwner && !isAdmin && property.status === 'Active' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>📅 Schedule a Visit</h4>
                {visitMessage && <p style={{ fontSize: '0.85rem', color: visitMessage.includes('requested') ? 'var(--accent-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>{visitMessage}</p>}
                
                <form onSubmit={handleScheduleVisit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }} />
                  <select required value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }}>
                    <option value="">Select a Time Slot</option><option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option><option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option><option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option><option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option><option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option><option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option><option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                  </select>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>Request Viewing</button>
                </form>
              </div>
            )}

            {!isOwner && !isAdmin && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={handleSaveFavorite} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>Save to Favorites</button>
                {favStatus && <p style={{ marginTop: '10px', textAlign: 'center', color: favStatus.includes('Saved') ? 'var(--accent-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>{favStatus}</p>}
              </div>
            )}
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid var(--border-color)' }}>
          <h2>Seller Ratings & Reviews</h2>
          {userInfo?.role === 'buyer' && (!myExistingReview || editingReviewId) && (
            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0 }}>{editingReviewId ? 'Edit Your Review' : 'Rate Your Experience'}</h4>
              {reviewError && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{reviewError}</p>}
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Rating:</label>
                  <select value={reviewFormData.rating} onChange={(e) => setReviewFormData({...reviewFormData, rating: Number(e.target.value)})} style={{ padding: '8px', borderRadius: '4px' }}>
                    <option value="5">5 - Excellent</option><option value="4">4 - Very Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option>
                  </select>
                </div>
                <textarea required value={reviewFormData.comment} onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})} placeholder="Write your review here..." style={{ width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '80px', borderRadius: '6px', marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '8px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{editingReviewId ? 'Update Review' : 'Submit Review'}</button>
                  {editingReviewId && <button type="button" onClick={() => setEditingReviewId(null)} style={{ padding: '8px 20px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>}
                </div>
              </form>
            </div>
          )}

          {reviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>This seller currently has no reviews.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map((review) => (
                <div key={review._id} style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {review.buyerId?.profilePhoto ? (
                        <img src={review.buyerId.profilePhoto} alt="Buyer" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>{review.buyerId?.name?.charAt(0).toUpperCase()}</div>
                      )}
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{review.buyerId?.name}</p>
                        <div style={{ margin: '2px 0' }}>{renderStars(review.rating)}</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {userInfo && userInfo._id === review.buyerId?._id && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEditClick(review)} style={{ padding: '4px 10px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                        <button onClick={() => handleDeleteReview(review._id)} style={{ padding: '4px 10px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p style={{ marginTop: '15px', color: 'var(--text-main)', lineHeight: '1.5' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIMILAR PROPERTIES SECTION */}
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', color: 'var(--text-main)' }}>Similar Properties You Might Like</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>Based on your current viewing preferences.</p>
          
          {similarProperties.length === 0 ? (
            <div style={{ padding: '30px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No similar properties available on the market right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {similarProperties.map(prop => (
                <div key={prop._id} 
                  onClick={() => navigateToProperty(prop._id)}
                  style={{ minWidth: '280px', flex: '0 0 auto', backgroundColor: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ height: '160px', backgroundColor: 'var(--bg-hover)' }}>
                    {prop.images?.length > 0 ? (
                      <img src={prop.images[0]} alt="Similar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                    )}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</h4>
                    <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>Rs.{prop.price.toLocaleString()}</p>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {prop.location.city} • {prop.bedrooms} Beds</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SELLER PROFILE MODAL */}
      {showSellerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            
            <div style={{ padding: '30px', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {property.sellerId?.profilePhoto ? (
                  <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-card)', boxShadow: 'var(--shadow-sm)' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2.5rem', border: '3px solid var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                    {property.sellerId?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {property.sellerId?.name}
                    {property.sellerId?.isVerified && <span style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Verified Seller</span>}
                  </h2>
                  <div style={{ marginBottom: '5px', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    {renderStars(Math.round(avgRating))} 
                    <span style={{ marginLeft: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>{avgRating} / 5</span> ({reviews.length} Reviews)
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSellerModal(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '30px' }}>
              <h3 style={{ margin: '0 0 20px 0' }}>Active Listings ({sellerListings.length})</h3>
              {loadingSellerListings ? <p style={{ color: 'var(--text-muted)' }}>Loading properties...</p> : sellerListings.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>This seller has no other active listings.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {sellerListings.map(item => (
                    <div key={item._id} onClick={() => navigateToProperty(item._id)} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', backgroundColor: 'var(--bg-main)', boxShadow: 'var(--shadow-sm)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      {item.images?.length > 0 ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '140px', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>}
                      <div style={{ padding: '15px' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                        <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: 'bold' }}>${item.price.toLocaleString()}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.location.city}</p>
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