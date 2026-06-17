import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
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
    const fetchAdminData = async () => {
      try {
        const [usersRes, propertiesRes] = await Promise.all([api.get('/admin/users'), api.get('/admin/properties')]);
        setUsers(usersRes.data); setProperties(propertiesRes.data); setLoading(false);
      } catch (err) { setError(err.response?.data?.message || 'Failed to load data'); setLoading(false); }
    };
    fetchAdminData();
  }, [navigate]);

  const handleDeleteUser = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm('Delete this user?')) {
      try { await api.delete(`/admin/users/${id}`); setUsers(users.filter(u => u._id !== id)); setSelectedUser(null); } catch (err) { alert('Failed'); }
    }
  };

  const handleDeleteProperty = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm('Delete this property?')) {
      try { await api.delete(`/admin/properties/${id}`); setProperties(properties.filter(p => p._id !== id)); setSelectedProperty(null); } catch (err) { alert('Failed'); }
    }
  };

  const handleUserStatusToggle = async (id, action) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/status`, { action });
      setUsers(users.map(u => u._id === id ? data : u)); setSelectedUser(data);
    } catch (error) { alert('Failed'); }
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading...</h2>;
  if (error) return <h2 style={{ color: 'var(--danger-color)' }}>{error}</h2>;

  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)' };

  return (
    <div style={{ color: 'var(--text-main)' }}>
      {currentTab === 'users' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Manage Users</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Click a row to view details.</p>
          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '15px' }}>Name</th><th style={{ padding: '15px' }}>Role</th><th style={{ padding: '15px' }}>Status</th><th style={{ padding: '15px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} onClick={() => setSelectedUser(user)} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px' }}>{user.name}</td><td style={{ padding: '15px', textTransform: 'capitalize' }}>{user.role}</td>
                    <td style={{ padding: '15px' }}>
                      {user.isBanned ? <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Banned</span> : <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Active</span>}
                      {user.isVerified && <span style={{ color: 'var(--primary-color)', marginLeft: '10px', fontWeight: 'bold' }}>✓ Verified</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button onClick={(e) => handleDeleteUser(user._id, e)} style={{ backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {currentTab === 'properties' && (
        <section>
          <h1 style={{ margin: '0 0 5px 0' }}>Manage Properties</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Click a row to view full details.</p>
          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '15px' }}>Title</th><th style={{ padding: '15px' }}>Seller</th><th style={{ padding: '15px' }}>Price</th><th style={{ padding: '15px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(prop => (
                  <tr key={prop._id} onClick={() => setSelectedProperty(prop)} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px' }}>{prop.title}</td><td style={{ padding: '15px' }}>{prop.sellerId?.name || 'Unknown'}</td>
                    <td style={{ padding: '15px', color: 'var(--accent-color)', fontWeight: 'bold' }}>Rs. {prop.price.toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>
                      <button onClick={(e) => handleDeleteProperty(prop._id, e)} style={{ backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedUser && (
        <div style={overlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p><p><strong>Email:</strong> {selectedUser.email}</p><p style={{ textTransform: 'capitalize' }}><strong>Role:</strong> {selectedUser.role}</p>
            {selectedUser.role === 'seller' && (
              <div style={{ marginTop: '20px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-hover)' }}>
                <h3 style={{ marginTop: 0 }}>Moderation</h3>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <button onClick={() => handleUserStatusToggle(selectedUser._id, selectedUser.isVerified ? 'unverify' : 'verify')} style={{ padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', flex: 1 }}>{selectedUser.isVerified ? 'Remove Verification' : 'Verify Seller'}</button>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => handleUserStatusToggle(selectedUser._id, selectedUser.isBanned ? 'unban' : 'ban')} style={{ padding: '10px', backgroundColor: selectedUser.isBanned ? 'var(--accent-color)' : 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '6px', flex: 1 }}>{selectedUser.isBanned ? 'Undo Ban' : 'Ban Seller'}</button>
                </div>
              </div>
            )}
            <button onClick={() => setSelectedUser(null)} style={{ marginTop: '20px', padding: '12px', width: '100%', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>Close</button>
          </div>
        </div>
      )}

      {selectedProperty && (
        <div style={overlayStyle} onClick={() => setSelectedProperty(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Property Details</h2>
            {selectedProperty.images?.length > 0 ? <img src={selectedProperty.images[0]} alt="Prop" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} /> : <div style={{ width: '100%', height: '200px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>}
            <h3 style={{ margin: '0 0 10px 0' }}>{selectedProperty.title}</h3>
            <p style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.2rem', marginTop: 0 }}>Rs. {selectedProperty.price.toLocaleString()}</p>
            <p><strong>Seller:</strong> {selectedProperty.sellerId?.name || 'Unknown'}</p>
            <p><strong>Description:</strong> {selectedProperty.description}</p>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
              <li style={{ textTransform: 'capitalize' }}><strong>Type:</strong> {selectedProperty.type}</li>
              <li><strong>Location:</strong> {selectedProperty.location.address}, {selectedProperty.location.city}</li>
              <li><strong>Specs:</strong> {selectedProperty.bedrooms} Beds | {selectedProperty.bathrooms} Baths | {selectedProperty.area} sqft</li>
            </ul>
            <button onClick={() => setSelectedProperty(null)} style={{ marginTop: '20px', padding: '12px', width: '100%', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;