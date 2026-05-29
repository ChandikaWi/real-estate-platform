import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  // Form State mapping to Property Schema
  const [formData, setFormData] = useState({
    title: '', description: '', price: '',
    city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '',
    // Predictive Engine Variables
    yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  const [message, setMessage] = useState('');

  // Protect the route- Only allow sellers
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (!storedUser || storedUser.role !== 'seller') {
      navigate('/login');
    } else {
      setUserInfo(storedUser);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Format data to match backend schema expectations
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: { city: formData.city, address: formData.address },
        type: formData.type,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
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
    } catch (err) {
      setMessage('Error listing property: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!userInfo) return null; // Prevent flicker while redirecting

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Seller Dashboard</h2>
      <p>Welcome back, {userInfo.name}! Add a new property below.</p>
      
      {message && <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', marginBottom: '15px' }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        
        {/* Basic Info */}
        <div style={{ gridColumn: '1 / -1' }}>
          <h4>Basic Information</h4>
        </div>
        <input type="text" name="title" placeholder="Property Title" value={formData.title} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="price" placeholder="Price ($)" value={formData.price} onChange={handleChange} required style={{ padding: '8px' }} />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required style={{ padding: '8px', gridColumn: '1 / -1', minHeight: '80px' }} />

        {/* Location & Type */}
        <div style={{ gridColumn: '1 / -1' }}>
          <h4>Location & Details</h4>
        </div>
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

        {/* Predictive Metrics */}
        <div style={{ gridColumn: '1 / -1' }}>
          <h4>Valuation Metrics (For Predictive Engine)</h4>
        </div>
        <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" step="0.1" name="distanceToTransport" placeholder="Distance to Transport (km)" value={formData.distanceToTransport} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="parkingSpaces" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="conditionScore" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={handleChange} style={{ padding: '8px' }} />

        <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
          List Property
        </button>
      </form>
    </div>
  );
};

export default Dashboard;