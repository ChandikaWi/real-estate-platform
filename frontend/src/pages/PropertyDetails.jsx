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

  // Socket Connection and Listeners
  useEffect(() => {
    if (userInfo) {
      socket.connect();
      socket.emit('setup', userInfo);

      socket.on('receive_message', (newMessage) => {
        // Only append if the message belongs to this specific property chat
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

  // Auto-scroll chat to bottom
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
      // Add our own message to the UI instantly
      setChatHistory((prev) => [...prev, data]);
      setMessageText('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleSaveFavorite = async () => { /* Favorite Logic */
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

  const isOwner = userInfo && userInfo._id === property.sellerId._id;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#3498db', marginBottom: '20px', display: 'inline-block' }}>&larr; Back to Listings</Link>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          <h1 style={{ margin: 0 }}>{property.title}</h1>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>${property.price.toLocaleString()}</h2>
        </div>

        {/* Image Gallery */}
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
          </div>

          {/* Right Column - Seller Info & LIVE CHAT */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
            <h3>Seller Information</h3>
            <p><strong>Name:</strong> {property.sellerId?.name}</p>
            
            {!userInfo ? (
              <p style={{ color: '#e74c3c', marginTop: '15px' }}>Please <Link to="/login">login</Link> to contact the seller.</p>
            ) : isOwner ? (
              <p style={{ color: '#27ae60', marginTop: '15px', fontWeight: 'bold' }}>This is your listing.</p>
            ) : (
              <div style={{ marginTop: '15px', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#2c3e50', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  Live Chat with Seller
                </div>
                
                {/* Chat History Window */}
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

                {/* Message Input */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid #ddd' }}>
                  <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." required style={{ flex: 1, padding: '10px', border: 'none', outline: 'none' }} />
                  <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                </form>
              </div>
            )}

            {/* Favorites Button */}
            {!isOwner && (
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