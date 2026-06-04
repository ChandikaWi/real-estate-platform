import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '',
    yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        // Populate form with existing data
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          city: data.location.city,
          address: data.location.address,
          type: data.type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.area,
          yearBuilt: data.valuationMetrics?.yearBuilt || '',
          distanceToTransport: data.valuationMetrics?.distanceToTransport || '',
          parkingSpaces: data.valuationMetrics?.parkingSpaces || '',
          conditionScore: data.valuationMetrics?.conditionScore || ''
        });
        setLoading(false);
      } catch (error) {
        setMessage('Failed to load property details.');
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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

      await api.put(`/properties/${id}`, payload);
      navigate('/dashboard'); // Go back to dashboard after saving
    } catch (err) {
      setMessage('Error updating property: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <h2>Loading property data...</h2>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Edit Property</h2>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ padding: '8px', gridColumn: '1 / -1' }} />
        <input type="number" name="price" value={formData.price} onChange={handleChange} required style={{ padding: '8px' }} />
        <textarea name="description" value={formData.description} onChange={handleChange} required style={{ padding: '8px', gridColumn: '1 / -1', minHeight: '80px' }} />
        <input type="text" name="city" value={formData.city} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ padding: '8px' }} />
        <select name="type" value={formData.type} onChange={handleChange} style={{ padding: '8px' }}>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>
        <input type="number" name="area" value={formData.area} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required style={{ padding: '8px' }} />
        <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required style={{ padding: '8px' }} />

        <div style={{ gridColumn: '1 / -1' }}><h4>Valuation Metrics</h4></div>
        <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" step="0.1" name="distanceToTransport" value={formData.distanceToTransport} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} style={{ padding: '8px' }} />
        <input type="number" name="conditionScore" value={formData.conditionScore} onChange={handleChange} style={{ padding: '8px' }} />

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
          <button type="button" onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;