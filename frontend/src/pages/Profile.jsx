import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  const [profilePhoto, setProfilePhoto] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setFormData({ name: data.name, email: data.email, password: '', phoneNumber: data.phoneNumber || '' });
        setProfilePhoto(data.profilePhoto || '');
      } catch (err) {
        setMessage({ text: 'Failed to load profile data.', type: 'error' });
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      let uploadedPhotoUrl = profilePhoto;

      // Upload new photo if selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('images', imageFile);
        const uploadConfig = { headers: { 'Content-Type': 'multipart/form-data' } };
        const uploadRes = await api.post('/upload', imageFormData, uploadConfig);
        uploadedPhotoUrl = uploadRes.data[0]; 
      }

      // Update Profile
      const payload = {
        name: formData.name,
        email: formData.email,
        profilePhoto: uploadedPhotoUrl,
      };
      if (formData.password) payload.password = formData.password;
      if (userInfo.role === 'seller') payload.phoneNumber = formData.phoneNumber;

      const { data } = await api.put('/auth/profile', payload);
      
      // Update Local Storage to reflect new name/photo instantly in Navbar
      localStorage.setItem('userInfo', JSON.stringify(data));
      setProfilePhoto(data.profilePhoto);
      setImageFile(null);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setLoading(false);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Update failed', type: 'error' });
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm.');
      return;
    }
    try {
      await api.delete('/auth/profile');
      localStorage.removeItem('userInfo');
      alert('Your account has been successfully deleted.');
      navigate('/');
      window.location.reload();
    } catch (err) {
      alert('Failed to delete account.');
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Manage Profile</h1>

      {message.text && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '4px', backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        
        {/* Photo Upload Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem' }}>
              {formData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Update Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Address</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>

        {userInfo?.role === 'seller' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number <span style={{ color: '#7f8c8d', fontWeight: 'normal' }}>(Displayed to buyers)</span></label>
            <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password <span style={{ color: '#7f8c8d', fontWeight: 'normal' }}>(Leave blank to keep current)</span></label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Saving Changes...' : 'Update Profile'}
        </button>
      </form>

      {/* Danger Zone */}
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #e74c3c', borderRadius: '8px', backgroundColor: '#fdedec' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#c0392b' }}>Danger Zone</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem' }}>Once you delete your account, there is no going back. All your data will be permanently wiped.</p>
        <button onClick={() => setShowDeleteModal(true)} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ color: '#c0392b', marginTop: 0 }}>Are you absolutely sure?</h2>
            <p>This action cannot be undone. This will permanently delete your account, active listings, orders, and messages.</p>
            <p>Please type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px', boxSizing: 'border-box', border: '1px solid #ccc' }} />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteAccount} style={{ flex: 1, padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Deletion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;