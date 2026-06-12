import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams(); // Reads the current page from the URL
  const currentTab = tab || 'users';

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    e.stopPropagation(); 
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers(users.filter(user => user._id !== id));
        if (selectedUser && selectedUser._id === id) setSelectedUser(null);
      } catch (err) { alert('Failed to delete user'); }
    }
  };

  const handleDeleteProperty = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm('Are you sure you want to permanently delete this property?')) {
      try {
        await api.delete(`/admin/properties/${id}`);
        setProperties(properties.filter(prop => prop._id !== id));
        if (selectedProperty && selectedProperty._id === id) setSelectedProperty(null);
      } catch (err) { alert('Failed to delete property'); }
    }
  };

  const handleUserStatusToggle = async (id, action) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/status`, { action });
      setUsers(users.map(u => u._id === id ? data : u));
      setSelectedUser(data);
    } catch (error) { alert('Failed to update status'); }
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalStyle = { backgroundColor: '#fff', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' };

  return (
    <div>
      {/* Manage Users */}
      {currentTab === 'users' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Manage Users</h1>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>Click a row to view details and moderation options.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Role</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} onClick={() => setSelectedUser(user)} style={{ borderBottom: '1px solid #ddd' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '15px' }}>{user.name}</td>
                  <td style={{ padding: '15px', textTransform: 'capitalize' }}>{user.role}</td>
                  <td style={{ padding: '15px' }}>
                    {user.isBanned ? <span style={{ color: '#c0392b', fontWeight: 'bold', backgroundColor: '#fdedec', padding: '4px 8px', borderRadius: '4px' }}>Banned</span> : <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Active</span>}
                    {user.isVerified && <span style={{ color: '#0288d1', marginLeft: '10px', backgroundColor: '#e1f5fe', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>✓ Verified</span>}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={(e) => handleDeleteUser(user._id, e)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Manage Properties */}
      {currentTab === 'properties' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Manage Properties</h1>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>Click a row to view full property details.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px' }}>Title</th>
                <th style={{ padding: '15px' }}>Seller</th>
                <th style={{ padding: '15px' }}>Price</th>
                <th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(prop => (
                <tr key={prop._id} onClick={() => setSelectedProperty(prop)} style={{ borderBottom: '1px solid #ddd' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '15px' }}>{prop.title}</td>
                  <td style={{ padding: '15px' }}>{prop.sellerId?.name || 'Unknown'}</td>
                  <td style={{ padding: '15px', color: '#2ecc71', fontWeight: 'bold' }}>${prop.price.toLocaleString()}</td>
                  <td style={{ padding: '15px' }}>
                    <button onClick={(e) => handleDeleteProperty(prop._id, e)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* USER MODAL */}
      {selectedUser && (
        <div style={overlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p style={{ textTransform: 'capitalize' }}><strong>Role:</strong> {selectedUser.role}</p>
            
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