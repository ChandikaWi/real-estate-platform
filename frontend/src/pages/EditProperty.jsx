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

  // Advanced Image Management States
  const [existingImages, setExistingImages] = useState([]); // URLs from database
  const [newImages, setNewImages] = useState([]); // File objects waiting to be uploaded
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
          listingType: data.listingType || 'buy',
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.area,
          yearBuilt: data.valuationMetrics?.yearBuilt || '',
          distanceToTransport: data.valuationMetrics?.distanceToTransport || '',
          parkingSpaces: data.valuationMetrics?.parkingSpaces || '',
          conditionScore: data.valuationMetrics?.conditionScore || ''
        });
        
        // Populate existing images
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
        city: formData.city, type: formData.type, bedrooms: Number(formData.bedrooms) || 0, bathrooms: Number(formData.bathrooms) || 0, area: Number(formData.area)
      });
      setAiEstimatedPrice(Math.round(data.estimatedPrice));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate AI valuation.");
    } finally {
      setGeneratingPrice(false);
    }
  };

  // IMAGE MANAGER HANDLERS
  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = existingImages.length + newImages.length;
    const slotsAvailable = 5 - totalCurrentImages;

    if (files.length > slotsAvailable) {
      alert(`You can only add ${slotsAvailable} more image(s). Maximum 5 allowed in total.`);
    }

    // Only take the files that fit within the 5 image limit
    const allowedFiles = files.slice(0, slotsAvailable);
    setNewImages(prev => [...prev, ...allowedFiles]);
    e.target.value = ''; // Reset input so the same files can be selected again if needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let finalImageUrls = [...existingImages]; // Start with the kept existing images

      // If there are NEW files, upload them and append the resulting URLs
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        for (let i = 0; i < newImages.length; i++) imageFormData.append('images', newImages[i]);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        finalImageUrls = [...finalImageUrls, ...uploadRes.data];
      }

      if (finalImageUrls.length === 0) {
        alert("Please include at least 1 image for your property.");
        setUploading(false);
        return;
      }

      const payload = {
        title: formData.title, description: formData.description, price: Number(formData.price), previousPrice: formData.previousPrice ? Number(formData.previousPrice) : null,
        location: { city: formData.city, address: formData.address }, type: formData.type, listingType: formData.listingType, bedrooms: Number(formData.bedrooms), bathrooms: Number(formData.bathrooms), area: Number(formData.area),
        status: 'Pending Review', 
        images: finalImageUrls, // Send merged array of old + new images
        valuationMetrics: {
          yearBuilt: Number(formData.yearBuilt), distanceToTransport: Number(formData.distanceToTransport), parkingSpaces: Number(formData.parkingSpaces), conditionScore: Number(formData.conditionScore)
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

  const totalImages = existingImages.length + newImages.length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'var(--text-main)' }}>
      <h1 style={{ marginBottom: '5px' }}>Edit Property</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Note: Saving changes will temporarily hide your listing until an admin approves the updates.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Basic Info */}
        <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Basic Info</h4></div>
        <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option>
          </select>
          <select value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
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
            style={{ flex: 1, minWidth: '200px', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} 
          />
          
          {formData.listingType === 'buy' && (
            <>
              <button type="button" onClick={handleGenerateValuation} disabled={generatingPrice} style={{ padding: '14px 20px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                {generatingPrice ? 'Calculating...' : '✨ Check AI Value'}
              </button>
              {aiEstimatedPrice && (
                <div style={{ padding: '12px 15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '8px', color: 'var(--accent-color)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  AI Suggests: Rs. {aiEstimatedPrice.toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        <input type="number" placeholder="Previous Price (Optional)" value={formData.previousPrice} onChange={e => setFormData({...formData, previousPrice: e.target.value})} style={{ padding: '14px', gridColumn: '1 / -1', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '14px', gridColumn: '1 / -1', minHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', resize: 'vertical' }} />

        {/* Details */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Details</h4></div>
        <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Sqft" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Beds" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} required={formData.type !== 'land'} disabled={formData.type === 'land'} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: formData.type === 'land' ? 'var(--bg-hover)' : 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Baths" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} required={formData.type !== 'land'} disabled={formData.type === 'land'} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: formData.type === 'land' ? 'var(--bg-hover)' : 'var(--bg-main)', color: 'var(--text-main)' }} />

        {/* Valuation Metrics */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h4 style={{ margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Valuation Metrics (ML Data)</h4></div>
        <input type="number" placeholder="Year Built" value={formData.yearBuilt} onChange={e => setFormData({...formData, yearBuilt: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" step="0.1" placeholder="Dist. to Transport (km)" value={formData.distanceToTransport} onChange={e => setFormData({...formData, distanceToTransport: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Parking Spaces" value={formData.parkingSpaces} onChange={e => setFormData({...formData, parkingSpaces: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
        <input type="number" placeholder="Condition Score (1-10)" value={formData.conditionScore} onChange={e => setFormData({...formData, conditionScore: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />

        {/* VISUAL IMAGE MANAGER */}
        <div style={{ gridColumn: '1 / -1', marginTop: '10px', backgroundColor: 'var(--bg-hover)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0 }}>Property Gallery</h4>
            <span style={{ fontSize: '0.85rem', color: totalImages === 5 ? 'var(--danger-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>
              {totalImages} / 5 Images Used
            </span>
          </div>

          {/* Visual Grid of All Images */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
            
            {/* Existing Published Images */}
            {existingImages.map((imgUrl, idx) => (
              <div key={`old-${idx}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '2px solid var(--border-color)', overflow: 'hidden' }}>
                <img src={imgUrl} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => handleRemoveExistingImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0' }}>Published</div>
              </div>
            ))}

            {/* Newly Selected Images (Local Previews) */}
            {newImages.map((file, idx) => (
              <div key={`new-${idx}`} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '2px dashed var(--primary-color)', overflow: 'hidden' }}>
                <img src={URL.createObjectURL(file)} alt="New" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => handleRemoveNewImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✕</button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0' }}>New File</div>
              </div>
            ))}
          </div>

          {/* Add More Files Input (Disabled if full) */}
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileSelect} 
            disabled={totalImages >= 5}
            style={{ padding: '10px', width: '100%', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', opacity: totalImages >= 5 ? 0.5 : 1, cursor: totalImages >= 5 ? 'not-allowed' : 'pointer' }} 
          />
        </div>

        <button type="submit" disabled={uploading} style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: uploading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem', marginTop: '10px', transition: 'transform 0.2s' }} onMouseOver={e => !uploading && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => !uploading && (e.currentTarget.style.transform = 'translateY(0)')}>
          {uploading ? 'Uploading securely...' : 'Submit Updates for Review'}
        </button>
      </form>
    </div>
  );
};

export default EditProperty;