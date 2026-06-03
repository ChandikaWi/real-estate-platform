import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favStatus, setFavStatus] = useState('');
  
  // Messaging State
  const [messageText, setMessageText] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setProperty(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchPropertyDetails();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setMessageStatus('');
    try {
      await api.post('/messages', {
        receiverId: property.sellerId._id,
        propertyId: property._id,
        message: messageText
      });
      setMessageStatus('Message sent successfully!');
      setMessageText('');
    } catch (err) {
      setMessageStatus('Failed to send: ' + (err.response?.data?.message || err.message));
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

  // Check if the logged-in user is the owner of this property
  const isOwner = userInfo && userInfo._id === property.sellerId._id;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#3498db', marginBottom: '20px', display: 'inline-block' }}>
        &larr; Back to Listings
      </Link>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          <h1 style={{ margin: 0 }}>{property.title}</h1>
            {/* Image Gallery */}
            {property.images && property.images.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                {property.images.map((imgUrl, index) => (
                <img 
                    key={index} 
                    src={imgUrl} 
                    alt={`Property ${index + 1}`} 
                    style={{ height: '300px', width: 'auto', objectFit: 'cover', borderRadius: '8px' }} 
                />
                ))}
            </div>
            )}
          <h2 style={{ margin: 0, color: '#2c3e50' }}>${property.price.toLocaleString()}</h2>
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Left Column */}
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

          {/* Right Column */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
            <h3>Seller Information</h3>
            <p><strong>Name:</strong> {property.sellerId?.name}</p>
            
            {!userInfo ? (
              <p style={{ color: '#e74c3c', marginTop: '15px' }}>Please <Link to="/login">login</Link> to contact the seller.</p>
            ) : isOwner ? (
              <p style={{ color: '#27ae60', marginTop: '15px', fontWeight: 'bold' }}>This is your listing.</p>
            ) : (
              <form onSubmit={handleSendMessage} style={{ marginTop: '15px' }}>
                <h4>Send an Inquiry</h4>
                <textarea 
                  rows="4" 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="I am interested in this property..." 
                  required 
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} 
                />
                <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Send Message
                </button>
                {messageStatus && <p style={{ marginTop: '10px', color: messageStatus.includes('successfully') ? 'green' : 'red' }}>{messageStatus}</p>}
              </form>
            )}

            {/* Save to Favorites Button - Hidden if the user owns the property */}
            {!isOwner && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <button 
                  onClick={handleSaveFavorite} 
                  style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#2c3e50', border: '1px solid #2c3e50', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
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