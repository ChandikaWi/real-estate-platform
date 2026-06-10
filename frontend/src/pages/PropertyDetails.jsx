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
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewError, setReviewError] = useState('');

  // Seller Profile Modal State
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerListings, setSellerListings] = useState([]);
  const [loadingSellerListings, setLoadingSellerListings] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const { data: propData } = await api.get(`/properties/${id}`);
        setProperty(propData);
        
        if (propData.sellerId) {
          const { data: reviewData } = await api.get(`/reviews/seller/${propData.sellerId._id}`);
          setReviews(reviewData);
        }

        if (userInfo) {
          const { data: chatData } = await api.get(`/messages/${id}`);
          setChatHistory(chatData);
        }
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
        if (newMessage.propertyId._id === id || newMessage.propertyId === id) {
          setChatHistory((prev) => [...prev, newMessage]);
        }
      });
    }
    return () => {
      socket.off('receive_message');
      socket.disconnect();
    };
  }, [userInfo, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      const { data } = await api.post('/messages', { receiverId: property.sellerId._id, propertyId: property._id, message: messageText });
      setChatHistory((prev) => [...prev, data]);
      setMessageText('');
    } catch (err) { alert('Failed to send message'); }
  };

  const handleSaveFavorite = async () => { 
    if (!userInfo) return setFavStatus('Please login to save favorites.');
    try {
      await api.post('/favorites', { propertyId: property._id });
      setFavStatus('Saved to favorites!');
    } catch (err) { setFavStatus(err.response?.data?.message || 'Failed to save'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      if (editingReviewId) {
        const { data } = await api.put(`/reviews/${editingReviewId}`, reviewFormData);
        setReviews(reviews.map(r => r._id === editingReviewId ? data : r));
        setEditingReviewId(null);
      } else {
        const { data } = await api.post('/reviews', { sellerId: property.sellerId._id, ...reviewFormData });
        setReviews([data, ...reviews]);
      }
      setReviewFormData({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      try {
        await api.delete(`/reviews/${reviewId}`);
        setReviews(reviews.filter(r => r._id !== reviewId));
      } catch (err) { alert('Failed to delete review'); }
    }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review._id);
    setReviewFormData({ rating: review.rating, comment: review.comment });
  };

  // Seller Profile Handler
  const handleOpenSellerProfile = async () => {
    setShowSellerModal(true);
    setLoadingSellerListings(true);
    try {
      const { data } = await api.get(`/properties/user/${property.sellerId._id}`);
      setSellerListings(data);
    } catch (err) {
      console.error("Failed to fetch seller listings");
    } finally {
      setLoadingSellerListings(false);
    }
  };

  const navigateToProperty = (propId) => {
    setShowSellerModal(false); // Close modal
    navigate(`/property/${propId}`); // Route to new property
    window.scrollTo(0, 0); // Scroll to top
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < rating ? '#f1c40f' : '#e0e0e0', fontSize: '1.2rem' }}>★</span>
    ));
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  if (loading) return <h2>Loading property details...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!property) return <h2>Property not found.</h2>;

  const isOwner = userInfo && userInfo._id === property.sellerId._id;
  const isAdmin = userInfo && userInfo.role === 'admin';
  const myExistingReview = reviews.find(r => r.buyerId._id === userInfo?._id);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#3498db', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Listings</Link>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          <h1 style={{ margin: 0 }}>{property.title}</h1>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>${property.price.toLocaleString()}</h2>
        </div>

        {property.images && property.images.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {property.images.map((imgUrl, index) => (
              <img key={index} src={imgUrl} alt="Gallery" style={{ height: '300px', width: 'auto', objectFit: 'cover', borderRadius: '8px' }} />
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          <div>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6' }}>{property.description}</p>
            
            <h3>Property Details</h3>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{property.type}</span></li>
              <li><strong>Location:</strong> {property.location.address}, {property.location.city}</li>
              <li><strong>Size:</strong> {property.area} sqft</li>
              <li><strong>Bedrooms:</strong> {property.bedrooms}</li>
              <li><strong>Bathrooms:</strong> {property.bathrooms}</li>
            </ul>
            
            {property.valuationMetrics && (
              <>
                <h3>Valuation Data</h3>
                <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '5px' }}>
                  <li><strong>Year Built:</strong> {property.valuationMetrics.yearBuilt || 'N/A'}</li>
                  <li><strong>Distance to Transport:</strong> {property.valuationMetrics.distanceToTransport ? `${property.valuationMetrics.distanceToTransport} km` : 'N/A'}</li>
                  <li><strong>Parking Spaces:</strong> {property.valuationMetrics.parkingSpaces || 'N/A'}</li>
                  <li><strong>Condition Score:</strong> {property.valuationMetrics.conditionScore ? `${property.valuationMetrics.conditionScore}/10` : 'N/A'}</li>
                </ul>
              </>
            )}
          </div>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
            <h3>Seller Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              {property.sellerId?.profilePhoto ? (
                <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>
                  {property.sellerId?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {property.sellerId?.name}
                  {property.sellerId?.isVerified && (
                    <span style={{ backgroundColor: '#e1f5fe', color: '#0288d1', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem' }}>✓ Verified</span>
                  )}
                </p>
                <div style={{ margin: '2px 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  {renderStars(Math.round(avgRating))} 
                  <span style={{ marginLeft: '5px' }}>({reviews.length === 0 ? 'No reviews' : `${avgRating} / 5`})</span>
                </div>
                {property.sellerId?.phoneNumber && (
                  <p style={{ margin: '2px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>📞 {property.sellerId.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* View Seller Profile Button */}
            <button 
              onClick={handleOpenSellerProfile} 
              style={{ width: '100%', padding: '10px', backgroundColor: '#fdfefe', color: '#3498db', border: '2px solid #3498db', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}
            >
              View Full Profile
            </button>
            
            {!userInfo ? (
              <p style={{ color: '#e74c3c', marginTop: '15px' }}>Please <Link to="/login">login</Link> to contact the seller.</p>
            ) : isOwner ? (
              <p style={{ color: '#27ae60', marginTop: '15px', fontWeight: 'bold' }}>This is your listing.</p>
            ) : isAdmin ? (
              <p style={{ color: '#f39c12', marginTop: '15px', fontWeight: 'bold' }}>Admin View</p>
            ) : (
              <div style={{ marginTop: '15px', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#2c3e50', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  Live Chat with Seller
                </div>
                <div style={{ height: '250px', overflowY: 'auto', padding: '10px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.9rem', marginTop: 'auto', marginBottom: 'auto' }}>No messages yet. Say hello!</p>
                  ) : (
                    chatHistory.map((msg, index) => {
                      const isMe = msg.senderId._id === userInfo._id;
                      return (
                        <div key={index} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', backgroundColor: isMe ? '#3498db' : '#e0e0e0', color: isMe ? '#fff' : '#333', padding: '8px 12px', borderRadius: '15px', maxWidth: '80%' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{msg.message}</p>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid #ddd' }}>
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." required style={{ flex: 1, padding: '10px', border: 'none', outline: 'none' }} />
                  <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                </form>
              </div>
            )}

            {!isOwner && !isAdmin && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <button onClick={handleSaveFavorite} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#2c3e50', border: '1px solid #2c3e50', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save to Favorites
                </button>
                {favStatus && <p style={{ marginTop: '10px', textAlign: 'center', color: favStatus.includes('Saved') ? 'green' : 'red' }}>{favStatus}</p>}
              </div>
            )}
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
          <h2>Seller Ratings & Reviews</h2>
          {userInfo?.role === 'buyer' && (!myExistingReview || editingReviewId) && (
            <div style={{ backgroundColor: '#f4f4f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0 }}>{editingReviewId ? 'Edit Your Review' : 'Rate Your Experience'}</h4>
              {reviewError && <p style={{ color: '#e74c3c', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{reviewError}</p>}
              
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Rating:</label>
                  <select value={reviewFormData.rating} onChange={(e) => setReviewFormData({...reviewFormData, rating: Number(e.target.value)})} style={{ padding: '5px', borderRadius: '4px' }}>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terrible</option>
                  </select>
                </div>
                <textarea 
                  required 
                  value={reviewFormData.comment} 
                  onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})} 
                  placeholder="Write your review about this seller here..." 
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '80px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }} 
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {editingReviewId ? 'Update Review' : 'Submit Review'}
                  </button>
                  {editingReviewId && (
                    <button type="button" onClick={() => setEditingReviewId(null)} style={{ padding: '8px 20px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <p style={{ color: '#7f8c8d' }}>This seller currently has no reviews.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map((review) => (
                <div key={review._id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {review.buyerId?.profilePhoto ? (
                        <img src={review.buyerId.profilePhoto} alt="Buyer" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                          {review.buyerId?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{review.buyerId?.name}</p>
                        <div style={{ margin: '2px 0' }}>{renderStars(review.rating)}</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {userInfo && userInfo._id === review.buyerId?._id && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEditClick(review)} style={{ padding: '4px 10px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                        <button onClick={() => handleDeleteReview(review._id)} style={{ padding: '4px 10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p style={{ marginTop: '15px', color: '#333', lineHeight: '1.5' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SELLER PROFILE MODAL */}
      {showSellerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '30px', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {property.sellerId?.profilePhoto ? (
                  <img src={property.sellerId.profilePhoto} alt="Seller" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2.5rem', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    {property.sellerId?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {property.sellerId?.name}
                    {property.sellerId?.isVerified && (
                      <span style={{ backgroundColor: '#e1f5fe', color: '#0288d1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Verified Seller</span>
                    )}
                  </h2>
                  <div style={{ marginBottom: '5px', fontSize: '1rem', color: '#7f8c8d' }}>
                    {renderStars(Math.round(avgRating))} 
                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{avgRating} / 5</span> ({reviews.length} Reviews)
                  </div>
                  {property.sellerId?.phoneNumber && <p style={{ margin: 0, color: '#555' }}>📞 {property.sellerId.phoneNumber}</p>}
                  <p style={{ margin: 0, color: '#555' }}>✉️ {property.sellerId?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowSellerModal(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#95a5a6', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Modal Body - Seller's Listings */}
            <div style={{ padding: '30px' }}>
              <h3 style={{ margin: '0 0 20px 0' }}>Active Listings ({sellerListings.length})</h3>
              
              {loadingSellerListings ? (
                <p>Loading properties...</p>
              ) : sellerListings.length === 0 ? (
                <p style={{ color: '#7f8c8d' }}>This seller has no other active listings.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {sellerListings.map(item => (
                    <div 
                      key={item._id} 
                      onClick={() => navigateToProperty(item._id)}
                      style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '140px', backgroundColor: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdc3c7' }}>No Image</div>
                      )}
                      <div style={{ padding: '15px' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                        <p style={{ margin: 0, color: '#2ecc71', fontWeight: 'bold' }}>${item.price.toLocaleString()}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#7f8c8d' }}>{item.location.city}</p>
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