import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house',
    bedrooms: '', bathrooms: '', area: '', yearBuilt: '', distanceToTransport: '', parkingSpaces: '', conditionScore: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setFormData({
          title: data.title, description: data.description, price: data.price, previousPrice: data.previousPrice || '',
          city: data.location.city, address: data.location.address, type: data.type,
          bedrooms: data.bedrooms, bathrooms: data.bathrooms, area: data.area,
          yearBuilt: data.valuationMetrics?.yearBuilt || '', distanceToTransport: data.valuationMetrics?.distanceToTransport || '',
          parkingSpaces: data.valuationMetrics?.parkingSpaces || '', conditionScore: data.valuationMetrics?.conditionScore || ''
        });
        setExistingImages(data.images || []);
        setLoading(false);
      } catch (err) {
        setMessage('Failed to load property details.');
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true); setMessage('');
    try {
      let uploadedImageUrls = [...existingImages];
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        for (let i = 0; i < newImages.length; i++) imageFormData.append('images', newImages[i]);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedImageUrls = [...uploadedImageUrls, ...uploadRes.data];
      }

      const payload = {
        title: formData.title, description: formData.description, price: Number(formData.price), previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
        location: { city: formData.city, address: formData.address }, type: formData.type, bedrooms: Number(formData.bedrooms), bathrooms: Number(formData.bathrooms), area: Number(formData.area),
        images: uploadedImageUrls,
        valuationMetrics: { yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore) }
      };

      await api.put(`/properties/${id}`, payload);
      alert('Property updated successfully!');
      navigate('/dashboard/listings');
    } catch (err) {
      setMessage('Error updating property: ' + (err.response?.data?.message || err.message));
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading property details...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 5px 0' }}>Edit Property</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Update your listing details below.</p>
      
      {message && <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', marginBottom: '15px', borderRadius: '6px', fontWeight: 'bold' }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Basic Info</h4></div>
        <input type="text" name="title" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }}>
          <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
        </select>
        <input type="number" name="price" placeholder="Current Price (Rs.)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="number" name="previousPrice" placeholder="Previous Price (Rs. Optional)" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '12px', gridColumn: '1 / -1', minHeight: '100px', borderRadius: '6px' }} />

        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Details</h4></div>
        <input type="text" name="city" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="text" name="address" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="number" name="area" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="number" name="bedrooms" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="number" name="bathrooms" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', gridColumn: '1 / -1' }} />

        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Valuation Metrics</h4></div>
        <input type="number" name="yearBuilt" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />
        <input type="number" step="0.1" name="distanceToTransport" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '12px', borderRadius: '6px' }} />

        <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Manage Images</h4>
          
          {existingImages.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '10px' }}>
              {existingImages.map((img, index) => (
                <div key={index} style={{ position: 'relative', minWidth: '100px' }}>
                  <img src={img} alt="Property" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                  <button type="button" onClick={() => handleRemoveImage(index)} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                </div>
              ))}
            </div>
          )}

          <input type="file" multiple accept="image/*" onChange={(e) => setNewImages(e.target.files)} style={{ padding: '8px', width: '100%' }} />
          <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>Upload additional high-quality images.</small>
        </div>

        <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {uploading ? 'Updating Listing...' : '💾 Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProperty;