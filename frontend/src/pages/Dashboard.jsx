import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [myProperties, setMyProperties] = useState([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '',
    city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '',
    yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });
  
  // State for images
  const [images, setImages] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Messages State
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser || storedUser.role !== 'seller') {
      navigate('/login');
    } else {
      setUserInfo(storedUser);
      fetchInquiries();
      fetchMyProperties(); 
    }
  }, [navigate]);

  const fetchMyProperties = async () => {
    try {
      const { data } = await api.get('/properties/seller/me');
      setMyProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties");
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/properties/${id}`);
        // Remove the deleted property from the UI without reloading
        setMyProperties(myProperties.filter((prop) => prop._id !== id));
      } catch (err) {
        alert('Failed to delete property');
      }
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get('/messages');
      setMessages(data);
      setLoadingMessages(false);
    } catch (error) {
      console.error("Failed to fetch messages");
      setLoadingMessages(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setUploading(true);

    try {
      let uploadedImageUrls = [];

      // Upload Images to Cloudinary
      if (images.length > 0) {
        const imageFormData = new FormData();
        for (let i = 0; i < images.length; i++) {
          imageFormData.append('images', images[i]);
        }

        // Override headers for FormData
        const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
        const uploadRes = await api.post('/upload', imageFormData, uploadConfig);
        uploadedImageUrls = uploadRes.data;
      }

      // Submit Property Data
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: { city: formData.city, address: formData.address },
        type: formData.type,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        images: uploadedImageUrls,
        valuationMetrics: {
          yearBuilt: Number(formData.yearBuilt),
          distanceToTransport: Number(formData.distanceToTransport),
          parkingSpaces: Number(formData.parkingSpaces),
          conditionScore: Number(formData.conditionScore)
        }
      };

      await api.post('/properties', payload);
      setMessage('Property successfully listed!');
      
      // Reset form
      setFormData({
        title: '', description: '', price: '', city: '', address: '', type: 'house',
        bedrooms: '', bathrooms: '', area: '',
        yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
      });
      setImages([]);
      setUploading(false);
    } catch (err) {
      setMessage('Error listing property: ' + (err.response?.data?.message || err.message));
      setUploading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Seller Dashboard</h2>
      <p>Welcome back, {userInfo.name}! Add a new property below.</p>
      
      {message && <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '15px' }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        
        <div style={{ gridColumn: '1 / -1' }}><h4>Basic Information</h4></div>
        <input type="text" name="title" placeholder="Property Title" value={formData.title} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="price" placeholder="Price ($)" value={formData.price} onChange={handleChange} required style={{ padding: '8px' }} />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required style={{ padding: '8px', gridColumn: '1 / -1', minHeight: '80px' }} />

        <div style={{ gridColumn: '1 / -1' }}><h4>Location & Details</h4></div>
        <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="text" name="address" placeholder="Street Address" value={formData.address} onChange={handleChange} required style={{ padding: '8px' }} />
        <select name="type" value={formData.type} onChange={handleChange} style={{ padding: '8px' }}>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>
        <input type="number" name="area" placeholder="Area (sqft)" value={formData.area} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="bedrooms" placeholder="Bedrooms" value={formData.bedrooms} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="bathrooms" placeholder="Bathrooms" value={formData.bathrooms} onChange={handleChange} required style={{ padding: '8px' }} />

        <div style={{ gridColumn: '1 / -1' }}><h4>Valuation Metrics</h4></div>
        <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" step="0.1" name="distanceToTransport" placeholder="Distance to Transport (km)" value={formData.distanceToTransport} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="parkingSpaces" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="conditionScore" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={handleChange} style={{ padding: '8px' }} />

        <div style={{ gridColumn: '1 / -1' }}>
          <h4>Property Images</h4>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ padding: '8px', width: '100%' }} />
          <small style={{ color: '#7f8c8d' }}>You can upload up to 5 images.</small>
        </div>

        <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: uploading ? '#95a5a6' : '#2c3e50', color: 'white', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
          {uploading ? 'Uploading & Listing...' : 'List Property'}
        </button>
      </form>

      {/* Active Listings Section */}
      <div style={{ marginTop: '40px' }}>
        <h3>Your Active Listings</h3>
        {myProperties.length === 0 ? (
          <p>You have no active properties.</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {myProperties.map((prop) => (
              <div key={prop._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                {prop.images && prop.images.length > 0 ? (
                  <img src={prop.images[0]} alt="thumbnail" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '100%', height: '150px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                )}
                <h4 style={{ margin: '10px 0 5px 0' }}>{prop.title}</h4>
                <p style={{ margin: '0 0 15px 0', color: '#2ecc71', fontWeight: 'bold' }}>${prop.price.toLocaleString()}</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => navigate(`/edit-property/${prop._id}`)} style={{ flex: 1, padding: '8px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteProperty(prop._id)} style={{ flex: 1, padding: '8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages Section */}
      <div style={{ marginTop: '40px' }}>
        <h3>Your Inquiries</h3>
        {loadingMessages ? <p>Loading messages...</p> : messages.length === 0 ? <p>No messages yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg) => (
              <div key={msg._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                  <strong>From:</strong> {msg.senderId?.name} ({msg.senderId?.email})<br/>
                  <strong>Regarding:</strong> {msg.propertyId?.title}<br/>
                  <strong>Date:</strong> {new Date(msg.createdAt).toLocaleString()}
                </p>
                <p style={{ margin: 0, padding: '10px', backgroundColor: '#f4f4f9', borderRadius: '4px' }}>{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;