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
        // Fetch properties based on selected category type
        const { data } = await api.get(`/properties?type=${category}&limit=50`);
        setProperties(data.properties);
        // Reset selections when category changes
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
      if (selectedProps.length >= 3) {
        alert("You can only compare up to 3 properties at a time.");
        return;
      }
      setSelectedProps([...selectedProps, property]);
    }
  };

  if (loading) return <h2>Loading comparison tool...</h2>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Compare Properties</h1>
      <p style={{ color: '#7f8c8d' }}>Select up to 3 properties below to generate a side-by-side analytical matrix.</p>

      {/* Category Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
          <option value="house">Houses</option>
          <option value="apartment">Apartments</option>
          <option value="land">Land</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
        
        {/* Left Side - Property Selection Tray */}
        <div style={{ borderRight: '2px solid #eee', paddingRight: '20px', height: '600px', overflowY: 'auto' }}>
          <h3>Available Listings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {properties.map(prop => {
              const isSelected = selectedProps.some(p => p._id === prop._id);
              return (
                <div 
                  key={prop._id} 
                  onClick={() => toggleSelection(prop)}
                  style={{ border: `2px solid ${isSelected ? '#3498db' : '#eee'}`, padding: '10px', borderRadius: '6px', cursor: 'pointer', backgroundColor: isSelected ? '#ebf5fb' : '#fff' }}
                >
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{prop.title}</p>
                  <p style={{ margin: 0, color: '#2ecc71', fontSize: '0.9rem' }}>${prop.price.toLocaleString()}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side - Analytical Matrix */}
        <div>
          {selectedProps.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa' }}>
              <h2>Select properties from the left to begin comparison.</h2>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #2c3e50' }}>
                    <th style={{ padding: '15px', width: '20%', backgroundColor: '#f4f4f9' }}>Feature</th>
                    {selectedProps.map(prop => (
                      <th key={prop._id} style={{ padding: '15px', width: `${80 / selectedProps.length}%`, position: 'relative' }}>
                        <button onClick={() => toggleSelection(prop)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                        {prop.images && prop.images[0] && <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />}
                        <div style={{ fontSize: '1rem' }}>{prop.title}</div>
                        <button onClick={() => navigate(`/property/${prop._id}`)} style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>View Details</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Financial Metrics */}
                  <tr style={{ backgroundColor: '#fdfefe' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Price</td>
                    {selectedProps.map(prop => (
                      <td key={prop._id} style={{ padding: '15px', fontSize: '1.2rem', color: '#27ae60', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>${prop.price.toLocaleString()}</td>
                    ))}
                  </tr>

                  {/* Core Specs */}
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Location</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>{prop.location.city}</td>)}
                  </tr>
                  <tr style={{ backgroundColor: '#fdfefe' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Area (sqft)</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>{prop.area}</td>)}
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Beds / Baths</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>{prop.bedrooms} / {prop.bathrooms}</td>)}
                  </tr>

                  {/* Valuation Data */}
                  <tr style={{ backgroundColor: '#eaf2f8' }}>
                    <td colSpan={selectedProps.length + 1} style={{ padding: '10px', fontWeight: 'bold', textAlign: 'left', color: '#2980b9' }}>Valuation Metrics</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Condition Score (1-10)</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{prop.valuationMetrics?.conditionScore || 'N/A'}</td>)}
                  </tr>
                  <tr style={{ backgroundColor: '#fdfefe' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Year Built</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>{prop.valuationMetrics?.yearBuilt || 'N/A'}</td>)}
                  </tr>
                  <tr>
                    <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: '#f4f4f9', borderBottom: '1px solid #ddd' }}>Distance to Transport</td>
                    {selectedProps.map(prop => <td key={prop._id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>{prop.valuationMetrics?.distanceToTransport ? `${prop.valuationMetrics.distanceToTransport} km` : 'N/A'}</td>)}
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