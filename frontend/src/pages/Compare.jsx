import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Compare = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProps, setSelectedProps] = useState([]);
  const [category, setCategory] = useState('house');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/properties?type=${category}&limit=50`);
        setProperties(data.properties); setSelectedProps([]); setLoading(false);
      } catch (err) { setLoading(false); }
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

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading comparison tool...</h2>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 10px 0' }}>Compare Properties</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Select up to 3 properties below to generate an analytical matrix.</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px' }}>
          <option value="house">Houses</option><option value="apartment">Apartments</option><option value="land">Land</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
        {/* Selection Tray */}
        <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '20px', height: '600px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Available Listings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {properties.map(prop => {
              const isSelected = selectedProps.some(p => p._id === prop._id);
              return (
                <div key={prop._id} onClick={() => toggleSelection(prop)} style={{ border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`, padding: '15px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{prop.title}</p>
                  <p style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>${prop.price.toLocaleString()}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Matrix */}
        <div>
          {selectedProps.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              <h2>Select properties from the left to begin.</h2>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid var(--border-color)' }}>
                    <th style={{ padding: '15px', width: '20%', backgroundColor: 'var(--bg-hover)' }}>Feature</th>
                    {selectedProps.map(prop => (
                      <th key={prop._id} style={{ padding: '15px', width: `${80 / selectedProps.length}%`, position: 'relative' }}>
                        <button onClick={() => toggleSelection(prop)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--bg-hover)', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 'bold', borderRadius: '50%', width: '25px', height: '25px' }}>X</button>
                        {prop.images && prop.images[0] && <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />}
                        <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{prop.title}</div>
                        <button onClick={() => navigate(`/property/${prop._id}`)} style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>View Details</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Price</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', fontSize: '1.2rem', color: 'var(--accent-color)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>${prop.price.toLocaleString()}</td>)}
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Location</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{prop.location.city}</td>)}
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Area (sqft)</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{prop.area}</td>)}
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Beds / Baths</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{prop.bedrooms} / {prop.bathrooms}</td>)}
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <td colSpan={selectedProps.length + 1} style={{ padding: '10px', fontWeight: 'bold', textAlign: 'left', color: 'var(--primary-color)' }}>Valuation Metrics</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Condition Score</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>{prop.valuationMetrics?.conditionScore || 'N/A'}</td>)}
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Year Built</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{prop.valuationMetrics?.yearBuilt || 'N/A'}</td>)}
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>Transport Dist.</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>{prop.valuationMetrics?.distanceToTransport ? `${prop.valuationMetrics.distanceToTransport} km` : 'N/A'}</td>)}
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