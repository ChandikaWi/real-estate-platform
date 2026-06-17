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
    if (!userInfo) { navigate('/login'); return; }
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setFormData({ name: data.name, email: data.email, password: '', phoneNumber: data.phoneNumber || '' });
        setProfilePhoto(data.profilePhoto || '');
      } catch (err) { setMessage({ text: 'Failed to load profile data.', type: 'error' }); }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault(); setLoading(true); setMessage({ text: '', type: '' });
    try {
      let uploadedPhotoUrl = profilePhoto;
      if (imageFile) {
        const imageFormData = new FormData(); imageFormData.append('images', imageFile);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedPhotoUrl = uploadRes.data[0]; 
      }
      const payload = { name: formData.name, email: formData.email, profilePhoto: uploadedPhotoUrl };
      if (formData.password) payload.password = formData.password;
      if (userInfo.role === 'seller') payload.phoneNumber = formData.phoneNumber;

      const { data } = await api.put('/auth/profile', payload);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setProfilePhoto(data.profilePhoto); setImageFile(null); setFormData(prev => ({ ...prev, password: '' })); 
      setMessage({ text: 'Profile updated successfully!', type: 'success' }); setLoading(false);
    } catch (err) { setMessage({ text: err.response?.data?.message || 'Update failed', type: 'error' }); setLoading(false); }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(''); // Clear existing photo URL
    setImageFile(null);  // Clear any pending uploads
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return alert('Please type DELETE to confirm.');
    try {
      await api.delete('/auth/profile'); localStorage.removeItem('userInfo');
      alert('Your account has been deleted.'); navigate('/'); window.location.reload();
    } catch (err) { alert('Failed to delete account.'); setShowDeleteModal(false); }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>Manage Profile</h1>

      {message.text && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '6px', backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {formData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Update Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            {/* REMOVE PHOTO BUTTON */}
            {profilePhoto && (
              <button type="button" onClick={handleRemovePhoto} style={{ display: 'block', marginTop: '8px', padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                🗑️ Remove Current Photo
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Full Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email Address</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
        </div>

        {userInfo?.role === 'seller' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Displayed to buyers)</span></label>
            <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>New Password <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Leave blank to keep current)</span></label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? 'Saving Changes...' : 'Update Profile'}
        </button>
      </form>

      {/* Danger Zone */}
      <div style={{ marginTop: '40px', padding: '25px', border: '1px solid var(--danger-color)', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger-color)' }}>Danger Zone</h3>
        <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)' }}>Once you delete your account, there is no going back. All your data will be permanently wiped.</p>
        <button onClick={() => setShowDeleteModal(true)} style={{ padding: '12px 24px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--danger-color)', marginTop: 0 }}>Are you absolutely sure?</h2>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.5' }}>This action cannot be undone. This will permanently delete your account, active listings, orders, and messages.</p>
            <p style={{ color: 'var(--text-muted)' }}>Please type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', boxSizing: 'border-box', borderRadius: '6px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleDeleteAccount} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Deletion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;