import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useUI } from '../context/UIContext';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(true);
  
  // Valuation States
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
        showAlert('Failed to load property', 'error'); 
        navigate('/dashboard/listings'); 
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleGenerateValuation = async () => {
    if (!formData.city || !formData.area) {
      showAlert("Please fill in City, Property Type, and Sqft first.", "warning");
      return;
    }
    setGeneratingPrice(true);
    try {
      const { data } = await api.post('/properties/predict-price', {
        city: formData.city, type: formData.type, bedrooms: Number(formData.bedrooms) || 0, bathrooms: Number(formData.bathrooms) || 0, area: Number(formData.area)
      });
      setAiEstimatedPrice(Math.round(data.estimatedPrice));
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to generate AI valuation.", "error");
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
      showAlert(`You can only add ${slotsAvailable} more image(s). Maximum 5 allowed in total.`, "warning");
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
        showAlert("Please include at least 1 image for your property.", "warning");
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
      showAlert('Property updated successfully! It has been submitted to the Admin for review before going live.', 'success');
      navigate('/dashboard/listings');
    } catch (err) { 
      showAlert('Update failed. Please try again.', 'error'); 
      setUploading(false);
    }
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-main)' }}>Loading...</h2>;

  const totalImages = existingImages.length + newImages.length;

  const calculateCompleteness = () => {
    const baseFields = ['title', 'description', 'price', 'city', 'address', 'area'];
    const totalFields = formData.type === 'land' ? 7 : 9;
    let filled = baseFields.filter(f => formData[f] !== '' && formData[f] !== 0 && formData[f] !== null).length;
    if (formData.type !== 'land') {
      if (formData.bedrooms !== '' && formData.bedrooms !== 0) filled++;
      if (formData.bathrooms !== '' && formData.bathrooms !== 0) filled++;
    }
    if (totalImages > 0) filled++;
    return Math.min(100, Math.round((filled / totalFields) * 100));
  };
  const completeness = calculateCompleteness();

  const getPriceVariance = () => {
    if (!formData.price || !formData.previousPrice) return null;
    const current = Number(formData.price);
    const prev = Number(formData.previousPrice);
    if (prev === 0 || current === prev) return null;
    const diff = current - prev;
    const percentage = Math.abs((diff / prev) * 100).toFixed(1);
    if (diff < 0) return { text: `📉 Dropped by ${percentage}%`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    return { text: `📈 Hiked by ${percentage}%`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  };
  const variance = getPriceVariance();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 100px 20px', color: 'var(--text-main)', position: 'relative' }}>
      <h1 style={{ marginBottom: '5px' }}>Edit Property</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Note: Saving changes will temporarily hide your listing until an admin approves the updates.</p>
      
      {/* Completeness Tracker */}
      <div style={{ marginBottom: '25px', backgroundColor: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>Listing Completeness</strong>
          <span style={{ color: completeness === 100 ? '#10b981' : 'var(--primary-color)', fontWeight: 'bold' }}>{completeness}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${completeness}%`, height: '100%', backgroundColor: completeness === 100 ? '#10b981' : 'var(--primary-color)', transition: 'width 0.4s ease-out', borderRadius: '4px' }}></div>
        </div>
      </div>
      
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
        
        {/* Price & Variance */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input 
              type="number" 
              placeholder={formData.listingType === 'rent' ? "Monthly Rent (Rs.)" : "Selling Price (Rs.)"} 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
              required 
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} 
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input 
              type="number" 
              placeholder="Previous Price (Optional)" 
              value={formData.previousPrice} 
              onChange={e => setFormData({...formData, previousPrice: e.target.value})} 
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} 
            />
            {variance && (
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: variance.bg, color: variance.color, padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', pointerEvents: 'none' }}>
                {variance.text}
              </div>
            )}
          </div>
        </div>

        {/* Valuator UI */}
        {formData.listingType === 'buy' && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.05)' }}>
            <button type="button" onClick={handleGenerateValuation} disabled={generatingPrice} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', transform: generatingPrice ? 'scale(0.95)' : 'scale(1)' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)'}>
              {generatingPrice ? '🧠 Analyzing Market Data...' : '✨ Generate AI Valuation'}
            </button>
            {aiEstimatedPrice && (
              <div style={{ padding: '12px 20px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
                🎯 AI Value: Rs. {aiEstimatedPrice.toLocaleString()}
              </div>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>*Powered by 10k+ local LakEstates data points.</span>
          </div>
        )}
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

        {/* Sticky Action Bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '15px 20px', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 15px rgba(0,0,0,0.1)', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={() => navigate('/dashboard/listings')} style={{ padding: '14px 24px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
            <button type="submit" disabled={uploading} style={{ padding: '14px 30px', backgroundColor: uploading ? 'var(--bg-hover)' : 'var(--primary-color)', color: uploading ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '8px', cursor: uploading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }} onMouseOver={e => !uploading && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => !uploading && (e.currentTarget.style.transform = 'translateY(0)')}>
              {uploading ? 'Uploading securely...' : 'Submit Updates for Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;