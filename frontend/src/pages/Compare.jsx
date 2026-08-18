import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Compare = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProps, setSelectedProps] = useState([]);
  const [category, setCategory] = useState('house');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties?type=${category}&limit=50`);
        setProperties(data.properties); 
        setSelectedProps([]); 
        setLoading(false);
      } catch (err) { 
        setLoading(false); 
      }
    };
    fetchProperties();
  }, [category]);

  const toggleSelection = (property) => {
    if (selectedProps.find(p => p._id === property._id)) {
      setSelectedProps(selectedProps.filter(p => p._id !== property._id));
    } else {
      if (selectedProps.length >= 3) return alert("You can only compare up to 3 properties at a time.");
      setSelectedProps([...selectedProps, property]);
    }
  };

  const filteredProperties = properties.filter(prop => 
    prop.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    prop.location.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading analytics engine...</h2></div>;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      {/* HEADER */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', 
        border: '1px solid rgba(139, 92, 246, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '30px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Comparison Matrix</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Evaluate up to 3 properties side-by-side to make the best investment decision.</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '15px 25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: selectedProps.length === 3 ? 'var(--danger-color)' : '#8b5cf6' }}>{selectedProps.length}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-muted)' }}> / 3</span>
          <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Selected</span>
        </div>
      </div>

      {/* SEARCH & CONTROLS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Property Type</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
            <option value="house">Houses</option>
            <option value="apartment">Apartments</option>
            <option value="land">Land</option>
          </select>
        </div>
        <div style={{ flex: '2 1 300px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
          <input 
            type="text" 
            placeholder="Search by property title or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* SELECTION TRAY (LEFT COLUMN) */}
        <div style={{ flex: '1 1 350px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Available Listings <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>({filteredProperties.length})</span></h3>
          </div>
          
          <div style={{ height: '600px', overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', scrollbarWidth: 'thin' }}>
            {filteredProperties.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>No properties match your search.</p>}
            
            {filteredProperties.map(prop => {
              const isSelected = selectedProps.some(p => p._id === prop._id);
              return (
                <div 
                  key={prop._id} 
                  onClick={() => toggleSelection(prop)} 
                  style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                    padding: '12px', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-main)', 
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none'
                  }}
                  onMouseOver={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--text-muted)')}
                  onMouseOut={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  {/* Thumbnail */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-hover)', flexShrink: 0 }}>
                    {prop.images && prop.images[0] ? (
                      <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Img</div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prop.title}</p>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--accent-color)', fontSize: '1rem', fontWeight: '900' }}>Rs. {prop.price.toLocaleString()}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {prop.location.city}</p>
                      
                      {/* Interactive Chip */}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold', 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--bg-hover)', 
                        color: isSelected ? '#fff' : 'var(--text-main)' 
                      }}>
                        {isSelected ? '✓ Added' : '+ Add'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ANALYTICS MATRIX (RIGHT COLUMN) */}
        <div style={{ flex: '2 1 700px' }}>
          {selectedProps.length === 0 ? (
            <div style={{ height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px dashed var(--border-color)', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>⚖️</div>
              <h2 style={{ color: 'var(--text-main)', margin: '0 0 10px 0' }}>Ready to Compare</h2>
              <p style={{ fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.5' }}>Select between 1 to 3 properties from the list on the left to generate your side-by-side analytical matrix.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '20px', width: '20%', backgroundColor: 'var(--bg-hover)', borderRight: '1px solid var(--border-color)' }}>
                      <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '800' }}>Features</div>
                    </th>
                    
                    {selectedProps.map(prop => (
                      <th key={prop._id} style={{ padding: '20px', width: `${80 / selectedProps.length}%`, position: 'relative', verticalAlign: 'top', borderRight: '1px solid var(--border-color)' }}>
                        {/* Remove Button */}
                        <button 
                          onClick={() => toggleSelection(prop)} 
                          style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 2 }}
                        >✕</button>
                        
                        {/* Header Image */}
                        <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px', backgroundColor: 'var(--bg-hover)', position: 'relative' }}>
                          {prop.images && prop.images[0] ? (
                            <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                          )}
                          <span style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#111', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>
                            {prop.type}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '800', lineHeight: '1.3', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prop.title}</div>
                        
                        <button onClick={() => navigate(`/property/${prop._id}`)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>View Full Details</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {/* Price Row */}
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Price</td>
                    {selectedProps.map(prop => (
                      <td key={prop._id} style={{ padding: '20px', fontSize: '1.3rem', color: 'var(--accent-color)', fontWeight: '900', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                        Rs. {prop.price.toLocaleString()}
                        {prop.listingType === 'rent' && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> / mo</span>}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Location Row */}
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>City Location</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontSize: '1.05rem', fontWeight: '600' }}>📍 {prop.location.city}</td>)}
                  </tr>
                  
                  {/* Area Row */}
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Area (sqft)</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontSize: '1.05rem', fontWeight: '600' }}>📐 {prop.area.toLocaleString()}</td>)}
                  </tr>
                  
                  {/* Beds / Baths Row (Adaptive) */}
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Beds / Baths</td>
                    {selectedProps.map(prop => (
                      <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontSize: '1.05rem', fontWeight: '600', color: prop.type === 'land' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {prop.type === 'land' ? 'N/A (Land)' : `🛏️ ${prop.bedrooms} / 🛁 ${prop.bathrooms}`}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Valuation Header Row */}
                  <tr style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                    <td colSpan={selectedProps.length + 1} style={{ padding: '15px 20px', fontWeight: '900', textAlign: 'left', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)' }}>
                      Machine Learning Metrics
                    </td>
                  </tr>
                  
                  {/* Condition Score */}
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Condition Score</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '1.1rem', color: prop.valuationMetrics?.conditionScore ? 'var(--primary-color)' : 'var(--text-muted)' }}>{prop.valuationMetrics?.conditionScore ? `${prop.valuationMetrics.conditionScore} / 10` : 'N/A'}</td>)}
                  </tr>
                  
                  {/* Year Built */}
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Year Built</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontSize: '1.05rem' }}>{prop.valuationMetrics?.yearBuilt || 'N/A'}</td>)}
                  </tr>
                  
                  {/* Transport */}
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <td style={{ padding: '20px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', textAlign: 'left' }}>Transport Dist.</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', fontSize: '1.05rem' }}>{prop.valuationMetrics?.distanceToTransport ? `${prop.valuationMetrics.distanceToTransport} km` : 'N/A'}</td>)}
                  </tr>

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compare;