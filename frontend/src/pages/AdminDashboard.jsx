import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useUI } from '../context/UIContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const currentTab = tab || 'users';
  const { showAlert, showConfirm } = useUI();

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  const [propSearch, setPropSearch] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState('All');
  const [marketAuditFilter, setMarketAuditFilter] = useState('All');

  // STATES FOR PAYMENTS FILTERING
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        // Fetch all endpoints concurrently
        const [usersRes, propertiesRes, paymentsRes, settingsRes] = await Promise.all([
          api.get('/admin/users'), 
          api.get('/admin/properties'),
          api.get('/admin/payments').catch(() => ({ data: [] })), // Safe fallback if route missing
          api.get('/settings').catch(() => ({ data: { aiValuationThreshold: 15 } }))
        ]);
        
        const propertiesWithValuation = await Promise.all(
          propertiesRes.data.map(async (p) => {
            try {
              const res = await api.post('/properties/predict-price', {
                city: p.location.city, type: p.type, bedrooms: p.bedrooms || 0, bathrooms: p.bathrooms || 0, area: p.area
              });
              return { ...p, aiPrice: res.data.estimatedPrice };
            } catch {
              return { ...p, aiPrice: null }; 
            }
          })
        );

        setUsers(usersRes.data); 
        setProperties(propertiesWithValuation); 
        setPayments(paymentsRes.data);
        setSettings(settingsRes.data);
        setLoading(false);
      } catch (err) { 
        setError(err.response?.data?.message || 'Failed to load data'); 
        setLoading(false); 
      }
    };
    fetchAdminData();
  }, [navigate]);

  const handleDeleteUser = async (id, e) => {
    e.stopPropagation(); 
    showConfirm('Delete this user?', async () => {
      try { 
        await api.delete(`/admin/users/${id}`); 
        setUsers(users.filter(u => u._id !== id)); 
        setSelectedUser(null); 
      } catch (err) { 
        showAlert('Failed', 'error'); 
      }
    });
  };

  const handleDeleteProperty = async (id, e) => {
    e.stopPropagation(); 
    showConfirm('Delete this property?', async () => {
      try { 
        await api.delete(`/admin/properties/${id}`); 
        setProperties(properties.filter(p => p._id !== id)); 
        setSelectedProperty(null); 
      } catch (err) { 
        showAlert('Failed', 'error'); 
      }
    });
  };

  const handleUserStatusToggle = async (id, action) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/status`, { action });
      setUsers(users.map(u => u._id === id ? data : u)); setSelectedUser(data);
    } catch (error) { showAlert('Failed', 'error'); }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                        user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'All' ? true : user.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'All' ? true :
                        userStatusFilter === 'Active' ? !user.isBanned :
                        userStatusFilter === 'Banned' ? user.isBanned :
                        userStatusFilter === 'Verified' ? user.isVerified : true;
    return matchSearch && matchRole && matchStatus;
  });

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return showAlert('No users to export', 'error');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Role,Status,Verified\n";
    filteredUsers.forEach(u => {
      csvContent += `"${u.name}","${u.email}",${u.role},${u.isBanned ? 'Banned' : 'Active'},${u.isVerified ? 'Yes' : 'No'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAvatarColor = (name) => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22'];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  // Demographics stats
  const totalUsers = users.length;
  const totalSellers = users.filter(u => u.role === 'seller').length;
  const totalBuyers = users.filter(u => u.role === 'buyer').length;
  const bannedUsers = users.filter(u => u.isBanned).length;

  const totalProps = properties.length;
  const sysThreshold = settings?.aiValuationThreshold || 15;
  const overpricedProps = properties.filter(p => p.aiPrice && p.price > p.aiPrice * (1 + sysThreshold / 100)).length;
  const fairValueProps = properties.filter(p => p.aiPrice && p.price <= p.aiPrice * (1 + sysThreshold / 100) && p.price >= p.aiPrice * (1 - sysThreshold / 100)).length;
  const pendingProps = properties.filter(p => p.status === 'Pending Review').length;

  const handleExportPropertiesCSV = () => {
    if (properties.length === 0) return showAlert('No properties to export', 'error');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Title,Seller,Listed Price,AI Valuation,Market Audit,Status\n";
    properties.forEach(p => {
      const threshold = settings?.aiValuationThreshold || 15;
      const isOverpriced = p.aiPrice && p.price > p.aiPrice * (1 + threshold / 100); 
      const isUnderpriced = p.aiPrice && p.price < p.aiPrice * (1 - threshold / 100);
      const audit = isOverpriced ? 'Overpriced' : isUnderpriced ? 'Underpriced' : (p.aiPrice ? 'Fair Value' : 'N/A');
      csvContent += `"${p.title}","${p.sellerId?.name || 'Unknown'}",${p.price},${p.aiPrice || 'N/A'},${audit},${p.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "property_audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
  const totalBoostsSold = payments.filter(p => p.status === 'Completed').length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'Pending').length;

  const handleExportPaymentsCSV = () => {
    if (filteredPayments.length === 0) return showAlert('No payments to export', 'error');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Transaction ID,Seller,Property,Plan,Amount,Status\n";
    filteredPayments.forEach(pay => {
      csvContent += `"${new Date(pay.createdAt).toLocaleString()}","${pay._id}","${pay.sellerId?.name || 'Unknown'}","${pay.propertyId?.title || 'Unknown'}","${pay.planType}",${pay.amount},${pay.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revenue_ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProperties = properties.filter(prop => {
    const matchSearch = prop.title.toLowerCase().includes(propSearch.toLowerCase()) || 
                        prop.location.city.toLowerCase().includes(propSearch.toLowerCase()) ||
                        (prop.sellerId?.name || '').toLowerCase().includes(propSearch.toLowerCase());
    const matchStatus = propStatusFilter === 'All' ? true : prop.status === propStatusFilter;
    
    const threshold = settings?.aiValuationThreshold || 15;
    const price = (prop.status === 'Sold' && prop.soldPrice) ? prop.soldPrice : prop.price;
    const isOverpriced = prop.aiPrice && price > prop.aiPrice * (1 + threshold / 100);
    const isUnderpriced = prop.aiPrice && price < prop.aiPrice * (1 - threshold / 100);
    const auditStatus = isOverpriced ? 'Overpriced' : isUnderpriced ? 'Underpriced' : 'Fair Value';
    
    const matchAudit = marketAuditFilter === 'All' ? true : auditStatus === marketAuditFilter;

    return matchSearch && matchStatus && matchAudit;
  });

  // Filtering for Payments
  const filteredPayments = payments.filter(pay => {
    const matchSearch = (pay.sellerId?.name || '').toLowerCase().includes(paymentSearch.toLowerCase()) || 
                        (pay.propertyId?.title || '').toLowerCase().includes(paymentSearch.toLowerCase()) ||
                        pay._id.toLowerCase().includes(paymentSearch.toLowerCase());
    const matchStatus = paymentStatusFilter === 'All' ? true : pay.status === paymentStatusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading System Analysis...</h2></div>;
  if (error) return <div style={{ maxWidth: '1200px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--danger-color)' }}>{error}</h2></div>;

  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' };
  const modalStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', padding: '40px', borderRadius: '24px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', 
        border: '1px solid rgba(243, 156, 18, 0.2)', 
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
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>System Administration</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage marketplace users, moderate listings, and track platform revenue.</p>
        </div>
      </div>

      {currentTab === 'users' && (
        <section>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>Manage Users</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click any user row to view details and moderation options.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleExportCSV}
                style={{ padding: '10px 20px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                📥 Export CSV
              </button>
              <button 
                onClick={() => setShowCreateAdmin(true)}
                style={{ padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Create Admin
              </button>
            </div>
          </div>

          {/* Demographics Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--primary-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Users</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{totalUsers}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--accent-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Sellers</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{totalSellers}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #f39c12' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Registered Buyers</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{totalBuyers}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--danger-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Banned Accounts</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{bannedUsers}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Role</label>
              <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Roles</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
              <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Banned">Banned</option>
                <option value="Verified">Verified Sellers</option>
              </select>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Name & Email</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Role</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No users match your criteria.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id} onClick={() => setSelectedUser(user)} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: getAvatarColor(user.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{user.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px', textTransform: 'capitalize', fontWeight: '600' }}>
                        {user.role} 
                        {user.role === 'admin' && <span style={{ marginLeft: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '900', verticalAlign: 'middle' }}>🛡️ SYSTEM</span>}
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {user.isBanned ? <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900' }}>BANNED</span> : <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900' }}>ACTIVE</span>}
                          {user.isVerified && <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900' }}>✓ VERIFIED</span>}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }} onClick={e => e.stopPropagation()}>
                        {user.role === 'admin' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Protected Account</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {user.role === 'seller' && (
                              <button onClick={() => handleUserStatusToggle(user._id, user.isVerified ? 'unverify' : 'verify')} style={{ backgroundColor: user.isVerified ? 'var(--bg-main)' : 'rgba(37, 99, 235, 0.1)', color: user.isVerified ? 'var(--text-muted)' : 'var(--primary-color)', border: user.isVerified ? '1px solid var(--border-color)' : 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {user.isVerified ? 'Undo' : '✅ Verify'}
                              </button>
                            )}
                            <button onClick={() => handleUserStatusToggle(user._id, user.isBanned ? 'unban' : 'ban')} style={{ backgroundColor: user.isBanned ? 'var(--bg-main)' : 'rgba(239, 68, 68, 0.1)', color: user.isBanned ? 'var(--accent-color)' : 'var(--danger-color)', border: user.isBanned ? '1px solid var(--border-color)' : 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {user.isBanned ? '✅ Unban' : '🛡️ Ban'}
                            </button>
                            <button onClick={(e) => handleDeleteUser(user._id, e)} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {currentTab === 'properties' && (
        <section>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>Properties & AI Market Audit</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Compare Listed Prices against the XGBoost AI Valuation model.</p>
            </div>
            <button 
              onClick={handleExportPropertiesCSV}
              style={{ padding: '10px 20px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📥 Export Audit
            </button>
          </div>

          {/* AI Audit Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--primary-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Audited</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{totalProps}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--accent-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Fair Value Properties</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{fairValueProps}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--danger-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Flagged Overpriced</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{overpricedProps}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #f39c12' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Pending Review</p>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{pendingProps}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
              <select value={propStatusFilter} onChange={(e) => setPropStatusFilter(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Audit</label>
              <select value={marketAuditFilter} onChange={(e) => setMarketAuditFilter(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Audits</option>
                <option value="Fair Value">Fair Value</option>
                <option value="Overpriced">Overpriced</option>
                <option value="Underpriced">Underpriced</option>
              </select>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
              <input 
                type="text" 
                placeholder="Search by title, city, or seller..." 
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', cursor: 'pointer' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Property Title</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Seller</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Listed Price</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>AI Valuation</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Market Audit</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>System Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No properties match your criteria.</td>
                  </tr>
                ) : (
                  filteredProperties.map(prop => {
                    const threshold = settings?.aiValuationThreshold || 15;
                    const price = (prop.status === 'Sold' && prop.soldPrice) ? prop.soldPrice : prop.price;
                    const isOverpriced = prop.aiPrice && price > prop.aiPrice * (1 + threshold / 100); 
                    const isUnderpriced = prop.aiPrice && price < prop.aiPrice * (1 - threshold / 100); 
                    const isPending = prop.status === 'Pending Review';
                    let varianceText = '';
                    if (prop.aiPrice) {
                      const diff = ((price - prop.aiPrice) / prop.aiPrice) * 100;
                      varianceText = diff > 0 ? `+${diff.toFixed(1)}% Over` : `${diff.toFixed(1)}% Under`;
                    }
                    
                    return (
                      <tr key={prop._id} onClick={() => setSelectedProperty(prop)} style={{ backgroundColor: isPending ? 'rgba(245, 158, 11, 0.05)' : 'transparent', borderBottom: '1px solid var(--border-color)', borderLeft: isPending ? '4px solid #f59e0b' : '4px solid transparent', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = isPending ? 'rgba(245, 158, 11, 0.05)' : 'transparent'}>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0, backgroundColor: 'var(--bg-main)' }}>
                              {prop.images?.length > 0 ? <img src={prop.images[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>N/A</div>}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prop.title}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{prop.sellerId?.name || 'Unknown'}</td>
                        <td style={{ padding: '20px', color: 'var(--accent-color)', fontWeight: '900', fontSize: '1.1rem' }}>Rs.{((prop.status === 'Sold' && prop.soldPrice) ? prop.soldPrice : prop.price).toLocaleString()}</td>
                        
                        <td style={{ padding: '20px', fontWeight: '900', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                          {prop.aiPrice ? `Rs. ${Math.round(prop.aiPrice).toLocaleString()}` : 'N/A'}
                        </td>
                        
                        <td style={{ padding: '20px' }}>
                          {prop.aiPrice && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                              <span style={{ 
                                padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase',
                                backgroundColor: isOverpriced ? 'rgba(239, 68, 68, 0.1)' : isUnderpriced ? 'rgba(243, 156, 18, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: isOverpriced ? 'var(--danger-color)' : isUnderpriced ? '#f39c12' : 'var(--accent-color)'
                              }}>
                                {isOverpriced ? '⚠️ Overpriced' : isUnderpriced ? '📉 Underpriced' : '✅ Fair Value'}
                              </span>
                              {(isOverpriced || isUnderpriced) && (
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isOverpriced ? 'var(--danger-color)' : '#f39c12' }}>{varianceText}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '20px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{ 
                              backgroundColor: prop.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : prop.status === 'Pending Review' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              color: prop.status === 'Active' ? 'var(--accent-color)' : prop.status === 'Pending Review' ? '#f59e0b' : 'var(--danger-color)', 
                              padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase'
                            }}>
                              {prop.status}
                            </span>
                            
                            {prop.status === 'Pending Review' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation(); 
                                    try {
                                      await api.put(`/properties/${prop._id}/status`, { status: 'Active' });
                                      setProperties(properties.map(p => p._id === prop._id ? { ...p, status: 'Active' } : p));
                                    } catch (err) { showAlert('Failed to approve property.', 'error'); }
                                  }} 
                                  style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >Approve</button>
                                
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation(); 
                                    try {
                                      await api.put(`/properties/${prop._id}/status`, { status: 'Rejected' });
                                      setProperties(properties.map(p => p._id === prop._id ? { ...p, status: 'Rejected' } : p));
                                    } catch (err) { showAlert('Failed to reject property.', 'error'); }
                                  }} 
                                  style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                >Reject</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REVENUE & BOOSTS */}
      {currentTab === 'boosts' && (
        <section>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>Revenue & Boosts Ledger</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Track platform monetization, property boosts, and seller payments.</p>
            </div>
            <button 
              onClick={handleExportPaymentsCSV}
              style={{ padding: '10px 20px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📥 Export Ledger
            </button>
          </div>

          {/* Revenue Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Lifetime Revenue</p>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#10b981', textShadow: '0 0 10px rgba(16,185,129,0.2)' }}>Rs. {totalRevenue.toLocaleString()}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--primary-color)' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Boosts Sold</p>
              <h3 style={{ margin: 0, fontSize: '2rem' }}>{totalBoostsSold}</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Pending Payments</p>
              <h3 style={{ margin: 0, fontSize: '2rem' }}>{pendingPaymentsCount}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap', backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Status</label>
              <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="All">All Transactions</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Smart Search</label>
              <input 
                type="text" 
                placeholder="Search by Seller Name, Property Title, or Transaction ID..." 
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Transaction Date</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Seller</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Property & Plan</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Amount</th>
                  <th style={{ padding: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No payment records found.</td>
                  </tr>
                ) : (
                  filteredPayments.map(pay => {
                    const isToday = new Date(pay.createdAt) > new Date(Date.now() - 86400000);
                    return (
                      <tr key={pay._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', backgroundColor: isToday ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = isToday ? 'rgba(16, 185, 129, 0.03)' : 'transparent'}>
                        <td style={{ padding: '20px', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {new Date(pay.createdAt).toLocaleString()}
                            {isToday && <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>🔥 NEW</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💳 ID: {pay._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontWeight: 'bold' }}>{pay.sellerId?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pay.sellerId?.email}</div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{pay.propertyId?.title || 'Unknown Property'}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {pay.planType.split('_')[0]} Days Boost
                          </div>
                        </td>
                        <td style={{ padding: '20px', color: pay.status === 'Completed' ? '#10b981' : 'var(--text-muted)', fontWeight: '900', fontSize: '1.1rem', textShadow: pay.status === 'Completed' ? '0 0 8px rgba(16,185,129,0.3)' : 'none' }}>
                          Rs. {pay.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '20px' }}>
                          <span style={{ 
                            backgroundColor: pay.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : pay.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: pay.status === 'Completed' ? 'var(--accent-color)' : pay.status === 'Pending' ? '#f59e0b' : 'var(--danger-color)', 
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase'
                          }}>
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedUser && (
        <div style={overlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 'bold', flexShrink: 0 }}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>{selectedUser.name}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Role</span>
                <p style={{ margin: '5px 0 0 0', textTransform: 'capitalize', fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedUser.role}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Account Status</span>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '1.1rem', color: selectedUser.isBanned ? 'var(--danger-color)' : 'var(--accent-color)' }}>
                  {selectedUser.isBanned ? 'Banned' : 'Active'}
                </p>
              </div>
            </div>

            {selectedUser.role === 'seller' && (
              <div style={{ marginBottom: '25px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '16px', backgroundColor: 'var(--bg-hover)' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>Seller Moderation Controls</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleUserStatusToggle(selectedUser._id, selectedUser.isVerified ? 'unverify' : 'verify')} style={{ padding: '12px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', flex: 1, cursor: 'pointer', fontWeight: 'bold' }}>{selectedUser.isVerified ? 'Remove Verification' : 'Verify Seller'}</button>
                  <button onClick={() => handleUserStatusToggle(selectedUser._id, selectedUser.isBanned ? 'unban' : 'ban')} style={{ padding: '12px 20px', backgroundColor: selectedUser.isBanned ? 'var(--accent-color)' : 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '10px', flex: 1, cursor: 'pointer', fontWeight: 'bold' }}>{selectedUser.isBanned ? 'Undo Ban' : 'Ban Seller'}</button>
                </div>
              </div>
            )}

            <button onClick={() => setSelectedUser(null)} style={{ padding: '14px', width: '100%', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem' }}>Close Details</button>
          </div>
        </div>
      )}

      {showCreateAdmin && (
        <div style={overlayStyle} onClick={() => setShowCreateAdmin(false)}>
          <div style={{ ...modalStyle, maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create Master Admin</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { data } = await api.post('/admin/users', newAdmin);
                setUsers([...users, data]);
                setShowCreateAdmin(false);
                setNewAdmin({ name: '', email: '', password: '' });
                showAlert('Admin created successfully', 'success');
              } catch (err) {
                showAlert(err.response?.data?.message || 'Failed to create admin', 'error');
              }
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Name</label>
                <input required type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Email</label>
                <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Password</label>
                <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Create Admin</button>
                <button type="button" onClick={() => setShowCreateAdmin(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProperty && (
        <div style={overlayStyle} onClick={() => setSelectedProperty(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Property Audit Details</h2>
              <button onClick={() => setSelectedProperty(null)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            <div style={{ height: '220px', backgroundColor: 'var(--bg-hover)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
              {selectedProperty.images?.length > 0 ? (
                <img src={selectedProperty.images[0]} alt="Prop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
              )}
              <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#111', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>
                {selectedProperty.type}
              </span>
            </div>
            
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>{selectedProperty.title}</h3>
            
            <div style={{ display: 'flex', gap: '15px', backgroundColor: 'var(--bg-main)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Listed Price</span>
                <p style={{ margin: '5px 0 0 0', color: 'var(--accent-color)', fontWeight: '900', fontSize: '1.3rem' }}>Rs.{selectedProperty.price.toLocaleString()}</p>
              </div>
              {selectedProperty.aiPrice && (
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '15px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>AI Valuation</span>
                  <p style={{ margin: '5px 0 0 0', color: 'var(--text-main)', fontWeight: '900', fontSize: '1.3rem' }}>Rs.{Math.round(selectedProperty.aiPrice).toLocaleString()}</p>
                </div>
              )}
            </div>

            <p style={{ margin: '0 0 10px 0' }}><strong>Seller:</strong> {selectedProperty.sellerId?.name || 'Unknown'}</p>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', lineHeight: '1.6' }}><strong>Description:</strong> {selectedProperty.description}</p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setSelectedProperty(null); navigate(`/property/${selectedProperty._id}`); }} style={{ flex: 1, padding: '14px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>View Live Page</button>
              <button onClick={() => setSelectedProperty(null)} style={{ flex: 1, padding: '14px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;