import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          previousPrice: data.previousPrice || '',
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
      } catch (err) { alert('Failed to load property'); navigate('/dashboard/listings'); }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
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
      alert('Property updated successfully!');
      navigate('/dashboard/listings');
    } catch (err) { alert('Update failed'); }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Edit Property</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px' }}>
        
        {/* Basic Info */}
        <div style={{ gridColumn: '1 / -1' }}><h4>Basic Info</h4></div>
        <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '12px' }} />
        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '12px' }}>
          <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
        </select>
        <input type="number" placeholder="Price (Rs.)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ padding: '12px' }} />
        <input type="number" placeholder="Previous Price" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '12px' }} />
        <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '12px', gridColumn: '1 / -1', minHeight: '100px' }} />

        {/* Details */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4>Details</h4></div>
        <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '12px' }} />
        <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '12px' }} />
        <input type="number" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '12px' }} />
        <input type="number" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '12px' }} />
        <input type="number" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '12px' }} />

        {/* ML / Valuation Metrics */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4>Valuation Metrics (ML Data)</h4></div>
        <input type="number" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '12px' }} />
        <input type="number" step="0.1" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '12px' }} />
        <input type="number" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '12px' }} />
        <input type="number" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '12px' }} />

        <button type="submit" style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Update Property
        </button>
      </form>
    </div>
  );
};

export default EditProperty;