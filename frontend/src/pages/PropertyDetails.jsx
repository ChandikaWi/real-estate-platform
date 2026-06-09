import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../api/socket';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favStatus, setFavStatus] = useState('');
  
  // Real-Time Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchPropertyAndChats = async () => {
      try {
        const { data: propData } = await api.get(`/properties/${id}`);
        setProperty(propData);
        
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
    fetchPropertyAndChats();
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
      const { data } = await api.post('/messages', {
        receiverId: property.sellerId._id,
        propertyId: property._id,
        message: messageText
      });
      setChatHistory((prev) => [...prev, data]);
      setMessageText('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleSaveFavorite = async () => { 
    if (!userInfo) {
      setFavStatus('Please login to save favorites.');
      return;
    }
    try {
      await api.post('/favorites', { propertyId: property._id });
      setFavStatus('Saved to favorites!');
    } catch (err) {
      setFavStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) return <h2>Loading property details...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!property) return <h2>Property not found.</h2>;

  // Role Checks
  const isOwner = userInfo && userInfo._id === property.sellerId._id;
  const isAdmin = userInfo && userInfo.role === 'admin';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
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
                {property.sellerId?.phoneNumber && (
                  <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>📞 {property.sellerId.phoneNumber}</p>
                )}
              </div>
            </div>
            
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

            {/* Favorites Button is hidden if the user is the Owner OR an Admin */}
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
      </div>
    </div>
  );
};

export default PropertyDetails;