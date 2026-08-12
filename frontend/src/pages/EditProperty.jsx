import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // AI Valuation States
  const [generatingPrice, setGeneratingPrice] = useState(false);
  const [aiEstimatedPrice, setAiEstimatedPrice] = useState(null);

  // Image Upload States
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', previousPrice: '', city: '', address: '', type: 'house', listingType: 'buy',
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
          listingType: data.listingType || 'buy', // Inherit buy/rent status
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.area,
          yearBuilt: data.valuationMetrics?.yearBuilt || '',
          distanceToTransport: data.valuationMetrics?.distanceToTransport || '',
          parkingSpaces: data.valuationMetrics?.parkingSpaces || '',
          conditionScore: data.valuationMetrics?.conditionScore || ''
        });
        
        // Save existing images
        setExistingImages(data.images || []);
        setLoading(false);
      } catch (err) { 
        alert('Failed to load property'); 
        navigate('/dashboard/listings'); 
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleGenerateValuation = async () => {
    if (!formData.city || !formData.area) {
      alert("Please fill in City, Property Type, and Sqft first.");
      return;
    }
    setGeneratingPrice(true);
    try {
      const { data } = await api.post('/properties/predict-price', {
        city: formData.city,
        type: formData.type,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        area: Number(formData.area)
      });
      
      setAiEstimatedPrice(Math.round(data.estimatedPrice));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate AI valuation.");
    } finally {
      setGeneratingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let uploadedImageUrls = existingImages; // Default to current images

      // If seller selected new images, upload them to replace the old ones
      if (images.length > 0) {
        const imageFormData = new FormData();
        for (let i = 0; i < images.length; i++) imageFormData.append('images', images[i]);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedImageUrls = uploadRes.data;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
        location: { city: formData.city, address: formData.address },
        type: formData.type,
        listingType: formData.listingType,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        status: 'Pending Review', 
        images: uploadedImageUrls, 
        valuationMetrics: {
          yearBuilt: Number(formData.yearBuilt),
          distanceToTransport: Number(formData.distanceToTransport),
          parkingSpaces: Number(formData.parkingSpaces),
          conditionScore: Number(formData.conditionScore)
        }
      };
      
      await api.put(`/properties/${id}`, payload);
      
      alert('Property updated successfully! It has been submitted to the Admin for review before going live.');
      navigate('/dashboard/listings');
    } catch (err) { 
      alert('Update failed. Please try again.'); 
      setUploading(false);
    }
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-main)' }}>Loading...</h2>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'var(--text-main)' }}>
      <h1 style={{ marginBottom: '5px' }}>Edit Property</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Note: Saving changes will temporarily hide your listing until an admin approves the updates.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Basic Info */}
        <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Basic Info</h4></div>
        <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
          </select>
          <select value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <option value="buy">For Sale</option><option value="rent">For Rent</option>
          </select>
        </div>
        
        {/* AI Valuator UI */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="number" 
            placeholder={formData.listingType === 'rent' ? "Monthly Rent (Rs.)" : "Selling Price (Rs.)"} 
            value={formData.price} 
            onChange={e => setFormData({...formData, price: e.target.value})} 
            required 
            style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} 
          />
          
          {formData.listingType === 'buy' && (
            <>
              <button 
                type="button" 
                onClick={handleGenerateValuation} 
                disabled={generatingPrice} 
                style={{ padding: '12px 20px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {generatingPrice ? 'Calculating...' : '✨ Generate AI Price'}
              </button>
              {aiEstimatedPrice && (
                <div style={{ padding: '10px 15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '6px', color: 'var(--accent-color)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  AI Suggestion: Rs. {aiEstimatedPrice.toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        <input type="number" placeholder="Previous Price" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '12px', gridColumn: '1 / -1', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '12px', gridColumn: '1 / -1', minHeight: '100px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />

        {/* Details */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Details</h4></div>
        <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />

        {/* Valuation Metrics */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Valuation Metrics (ML Data)</h4></div>
        <input type="number" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" step="0.1" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />

        {/* Image Upload Section */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Update Property Images</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Currently has {existingImages.length} image(s). Leave blank to keep existing.
            </span>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={(e) => { 
              if (e.target.files.length > 5) { 
                alert("Maximum 5 pictures allowed."); 
                e.target.value = ''; 
              } else { 
                setImages(e.target.files); 
              } 
            }} 
            style={{ padding: '8px', width: '100%', color: 'var(--text-main)' }} 
          />
        </div>

        <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '6px', cursor: uploading ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px' }}>
          {uploading ? 'Uploading updates...' : 'Submit Updates for Review'}
        </button>
      </form>
    </div>
  );
};

export default EditProperty;