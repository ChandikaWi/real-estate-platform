import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setProperty(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id]);

  if (loading) return <h2>Loading property details...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!property) return <h2>Property not found.</h2>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#3498db', marginBottom: '20px', display: 'inline-block' }}>
        &larr; Back to Listings
      </Link>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          <h1 style={{ margin: 0 }}>{property.title}</h1>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>${property.price.toLocaleString()}</h2>
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Left Column- Description & Details */}
          <div>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6' }}>{property.description}</p>
            
            <h3>Property Details</h3>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{property.type}</span></li>
              <li><strong>Location:</strong> {property.location.address}, {property.location.city}</li>
              <li><strong>Size:</strong> {property.area} sqft</li>
              <li><strong>Bedrooms:</strong> {property.bedrooms}</li>
              <li><strong>Bathrooms:</strong> {property.bathrooms}</li>
            </ul>

            {/* Valuation Metrics (Future ML Data) */}
            {property.valuationMetrics && (
              <>
                <h3>Valuation Data</h3>
                <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '5px' }}>
                  <li><strong>Year Built:</strong> {property.valuationMetrics.yearBuilt || 'N/A'}</li>
                  <li><strong>Distance to Transport:</strong> {property.valuationMetrics.distanceToTransport ? `${property.valuationMetrics.distanceToTransport} km` : 'N/A'}</li>
                  <li><strong>Parking Spaces:</strong> {property.valuationMetrics.parkingSpaces || 'N/A'}</li>
                  <li><strong>Condition Score:</strong> {property.valuationMetrics.conditionScore ? `${property.valuationMetrics.conditionScore}/10` : 'N/A'}</li>
                </ul>
              </>
            )}
          </div>

          {/* Right Column- Seller Info & Actions */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', height: 'fit-content' }}>
            <h3>Contact Seller</h3>
            <p><strong>Name:</strong> {property.sellerId?.name}</p>
            <p><strong>Email:</strong> {property.sellerId?.email}</p>
            
            <button style={{ width: '100%', padding: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px', fontWeight: 'bold' }}>
              Send Inquiry
            </button>
            <button style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#2c3e50', border: '1px solid #2c3e50', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>
              Save to Favorites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;