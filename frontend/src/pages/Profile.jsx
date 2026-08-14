import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  const [profilePhoto, setProfilePhoto] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const fileInputRef = useRef(null);
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
    e.preventDefault(); 
    setLoading(true); 
    setMessage({ text: '', type: '' });
    
    try {
      let uploadedPhotoUrl = profilePhoto;
      
      if (imageFile) {
        const imageFormData = new FormData(); 
        imageFormData.append('images', imageFile);
        const uploadRes = await api.post('/upload', imageFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploadedPhotoUrl = uploadRes.data[0]; 
      }
      
      const payload = { name: formData.name, email: formData.email, profilePhoto: uploadedPhotoUrl };
      if (formData.password) payload.password = formData.password;
      if (userInfo.role === 'seller') payload.phoneNumber = formData.phoneNumber;

      const { data } = await api.put('/auth/profile', payload);
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      setProfilePhoto(data.profilePhoto); 
      setImageFile(null); 
      setFormData(prev => ({ ...prev, password: '' })); 
      setMessage({ text: '✅ Profile updated successfully!', type: 'success' }); 
    } catch (err) { 
      setMessage({ text: `❌ ${err.response?.data?.message || 'Update failed'}`, type: 'error' }); 
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(''); 
    setImageFile(null);  
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return alert('Please type DELETE to confirm.');
    try {
      await api.delete('/auth/profile'); 
      localStorage.removeItem('userInfo');
      alert('Your account has been deleted.'); 
      navigate('/'); 
      window.location.reload();
    } catch (err) { 
      alert('Failed to delete account.'); 
      setShowDeleteModal(false); 
    }
  };

  const displayImage = imageFile ? URL.createObjectURL(imageFile) : profilePhoto;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      {/* PROFILE BANNER & AVATAR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        
        {/* Gradient Banner */}
        <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }} />
        
        {/* Avatar Wrapper */}
        <div style={{ marginTop: '-60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ width: '130px', height: '130px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', border: '6px solid var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '3rem', fontWeight: 'bold', cursor: 'pointer', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', transition: 'filter 0.2s', zIndex: 2 }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.85)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
              title="Click to change photo"
            >
              {displayImage ? (
                <img src={displayImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                formData.name.charAt(0).toUpperCase()
              )}
              
              {/* Camera Icon Overlay */}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1.2rem', textAlign: 'center', padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
                📷
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={(e) => { if (e.target.files[0]) setImageFile(e.target.files[0]); }} 
              style={{ display: 'none' }} 
            />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', lineHeight: '1', fontWeight: '900' }}>{formData.name || 'Your Name'}</h1>
            <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {userInfo?.role} Account
            </span>
          </div>

        </div>
      </div>

      {message.text && (
        <div style={{ padding: '15px 20px', marginBottom: '30px', borderRadius: '12px', backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)', border: `2px solid ${message.type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          {message.text}
        </div>
      )}

      {/* FORM SECTION */}
      <form onSubmit={handleUpdate} style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Personal Information</h3>
          {(profilePhoto || imageFile) && (
            <button type="button" onClick={handleRemovePhoto} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              🗑️ Remove Photo
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}/>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Email Address</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}/>
          </div>
        </div>

        {userInfo?.role === 'seller' && (
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Public Phone Number <span style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(Visible to buyers on approved visits)</span></label>
            <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+94 77 123 4567" style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} />
          </div>
        )}

        <div style={{ marginBottom: '40px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Update Password <span style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(Leave blank to keep current)</span></label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              placeholder="••••••••"
              style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'} 
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer', fontWeight: '900', fontSize: '1.1rem', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s ease' }} onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}>
          {loading ? 'Saving Changes...' : 'Save Profile Settings'}
        </button>
      </form>

      {/* DANGER ZONE */}
      <div style={{ marginTop: '50px', padding: '30px', border: '1px solid var(--danger-color)', borderRadius: '24px', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--danger-color)', fontSize: '1.4rem' }}>Danger Zone</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '450px', lineHeight: '1.5' }}>Once you delete your account, there is no going back. All your listings, purchases, and messages will be permanently wiped.</p>
        </div>
        <button onClick={() => setShowDeleteModal(true)} style={{ padding: '14px 24px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)' }}>
          Delete Account
        </button>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid var(--danger-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.8rem' }}>Are you absolutely sure?</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 20px 0' }}>This action cannot be undone. This will permanently delete your account, listings, orders, and messages.</p>
            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '12px', marginBottom: '25px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem' }}>Type <span style={{ color: 'var(--danger-color)' }}>DELETE</span> to confirm.</label>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE'} style={{ flex: 1.5, padding: '14px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: deleteConfirmText !== 'DELETE' ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: deleteConfirmText !== 'DELETE' ? 0.5 : 1 }}>Permanently Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;