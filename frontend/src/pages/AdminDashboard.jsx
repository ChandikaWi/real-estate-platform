import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, propertiesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/properties')
      ]);
      setUsers(usersRes.data);
      setProperties(propertiesRes.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, e) => {
    e.stopPropagation(); // Prevents row click from opening modal
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers(users.filter(user => user._id !== id));
        if (selectedUser && selectedUser._id === id) setSelectedUser(null);
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const handleDeleteProperty = async (id, e) => {
    e.stopPropagation(); // Prevents row click from opening modal
    if (window.confirm('Are you sure you want to permanently delete this property?')) {
      try {
        await api.delete(`/admin/properties/${id}`);
        setProperties(properties.filter(prop => prop._id !== id));
        if (selectedProperty && selectedProperty._id === id) setSelectedProperty(null);
      } catch (err) {
        alert('Failed to delete property');
      }
    }
  };

  const handleUserStatusToggle = async (id, action) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/status`, { action });
      // Update UI list
      setUsers(users.map(u => u._id === id ? data : u));
      // Update Modal if open
      setSelectedUser(data);
    } catch (error) {
      // Show the error message from the backend
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Failed to update status: ${errorMsg}`);
      console.error("Full error details:", error);
    }
  };

  if (loading) return <h2>Loading Admin Dashboard...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  // Modal Overlay Styles
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  };
  const modalStyle = {
    backgroundColor: '#fff', padding: '30px', borderRadius: '8px',
    maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      <h1>Admin Dashboard</h1>

      {/* Users Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Manage Users</h2>
        <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Click a row to view details and moderation options.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Role</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} onClick={() => setSelectedUser(user)} style={{ borderBottom: '1px solid #ddd' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '10px' }}>{user.name}</td>
                <td style={{ padding: '10px', textTransform: 'capitalize' }}>{user.role}</td>
                <td style={{ padding: '10px' }}>
                  {user.isBanned ? <span style={{ color: 'red', fontWeight: 'bold' }}>Banned</span> : 'Active'}
                  {user.isVerified && <span style={{ color: 'blue', marginLeft: '10px' }}>✓ Verified</span>}
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={(e) => handleDeleteUser(user._id, e)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Properties Section */}
      <section>
        <h2>Manage Properties</h2>
        <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Click a row to view full property details.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Title</th>
              <th style={{ padding: '10px' }}>Seller</th>
              <th style={{ padding: '10px' }}>Price</th>
              <th style={{ padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(prop => (
              <tr key={prop._id} onClick={() => setSelectedProperty(prop)} style={{ borderBottom: '1px solid #ddd' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '10px' }}>{prop.title}</td>
                <td style={{ padding: '10px' }}>{prop.sellerId?.name || 'Unknown'}</td>
                <td style={{ padding: '10px' }}>${prop.price.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={(e) => handleDeleteProperty(prop._id, e)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* USER MODAL */}
      {selectedUser && (
        <div style={overlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p style={{ textTransform: 'capitalize' }}><strong>Role:</strong> {selectedUser.role}</p>
            
            {/* Moderation Controls (Only for Sellers) */}
            {selectedUser.role === 'seller' && (
              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ marginTop: 0 }}>Moderation Controls</h3>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  {selectedUser.isVerified ? (
                    <button onClick={() => handleUserStatusToggle(selectedUser._id, 'unverify')} style={{ padding: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Remove Verification</button>
                  ) : (
                    <button onClick={() => handleUserStatusToggle(selectedUser._id, 'verify')} style={{ padding: '10px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Verify Seller</button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  {selectedUser.isBanned ? (
                    <button onClick={() => handleUserStatusToggle(selectedUser._id, 'unban')} style={{ padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Undo Ban (Restore Access)</button>
                  ) : (
                    <button onClick={() => handleUserStatusToggle(selectedUser._id, 'ban')} style={{ padding: '10px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>Ban Seller</button>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedUser(null)} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', cursor: 'pointer' }}>Close Modal</button>
          </div>
        </div>
      )}

      {/* PROPERTY MODAL */}
      {selectedProperty && (
        <div style={overlayStyle} onClick={() => setSelectedProperty(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Property Details</h2>
            
            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <img src={selectedProperty.images[0]} alt="Property" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
            ) : (
               <div style={{ width: '100%', height: '200px', backgroundColor: '#eee', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
            )}

            <h3 style={{ margin: '0 0 10px 0' }}>{selectedProperty.title}</h3>
            <p style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.2rem', marginTop: 0 }}>${selectedProperty.price.toLocaleString()}</p>
            
            <p><strong>Seller:</strong> {selectedProperty.sellerId?.name || 'Unknown'}</p>
            <p><strong>Description:</strong> {selectedProperty.description}</p>
            
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
              <li style={{ textTransform: 'capitalize' }}><strong>Type:</strong> {selectedProperty.type}</li>
              <li><strong>Location:</strong> {selectedProperty.location.address}, {selectedProperty.location.city}</li>
              <li><strong>Specs:</strong> {selectedProperty.bedrooms} Beds | {selectedProperty.bathrooms} Baths | {selectedProperty.area} sqft</li>
            </ul>

            <button onClick={() => setSelectedProperty(null)} style={{ marginTop: '20px', padding: '10px 20px', width: '100%', cursor: 'pointer' }}>Close Modal</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;