import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useUI } from '../context/UIContext';

const MockStripeCheckout = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useUI();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Controlled States for Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/payments/session/${paymentId}`);
        if (data.status === 'Completed') navigate('/dashboard/listings');
        else setSession(data);
      } catch (err) {
        showAlert("Session invalid or expired.", "error");
        navigate('/dashboard/listings');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    // Check for saved card details on load
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      const savedCardData = localStorage.getItem(`savedCard_${userInfo._id}`);
      if (savedCardData) {
        const parsedCard = JSON.parse(savedCardData);
        setCardNumber(parsedCard.cardNumber || '');
        setExpiry(parsedCard.expiry || '');
        setCvc(parsedCard.cvc || '');
        setSaveCard(true);
      }
    }
  }, [paymentId, navigate]);

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Save or Remove card details based on checkbox
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) {
      if (saveCard) {
        localStorage.setItem(`savedCard_${userInfo._id}`, JSON.stringify({ cardNumber, expiry, cvc }));
      } else {
        localStorage.removeItem(`savedCard_${userInfo._id}`);
      }
    }

    // Simulate network delay for realism
    setTimeout(async () => {
      try {
        await api.post('/payments/confirm', { paymentId });
        navigate('/dashboard/listings', { state: { message: "🔥 Payment successful! Your property is now boosted." } });
      } catch (err) {
        showAlert("Payment failed.", "error");
        setProcessing(false);
      }
    }, 2000);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}><h2>Loading Checkout Securely...</h2></div>;
  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-main)', flexWrap: 'wrap' }}>
      
      {/* LEFT COLUMN - Order Summary */}
      <div style={{ flex: '1 1 400px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <span style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '1.2rem' }}>P</span> PaySecure Demo
          </div>
          
          <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Order Summary</h2>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 30px 0', color: 'var(--text-main)' }}>Rs. {session.amount.toLocaleString()}</h1>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
            {session.propertyId?.images?.length > 0 ? (
              <img src={session.propertyId.images[0]} alt="Property" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Image</div>
            )}
            
            <div>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{session.propertyId?.title || 'Unknown Property'}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {session.planType === 'lifetime' ? 'Premium Lifetime Boost' : `${session.planType.split('_')[0]} Days Priority Boost`}
              </p>
            </div>
          </div>
          <hr style={{ borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px' }}>Powered by Stripe API Simulation.</p>
        </div>
      </div>

      {/* RIGHT COLUMN - Payment Details */}
      <div style={{ flex: '1 1 400px', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
        <form onSubmit={handlePay} style={{ maxWidth: '450px', width: '100%', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
          
          {saveCard && cardNumber && (
            <div style={{ position: 'absolute', top: '-15px', right: '20px', backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', animation: 'pulse 2s infinite' }}>
              ⚡ Express Checkout Enabled
            </div>
          )}

          <h2 style={{ margin: '0 0 25px 0', color: 'var(--text-main)' }}>Payment Details</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Email Address</label>
            <input type="email" value={session.sellerId?.email || ''} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Cardholder Name</label>
            <input type="text" value={session.sellerId?.name || ''} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Card Information (Demo)</label>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
              <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number (1234 5678 9123 0000)" required style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex' }}>
                <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM / YY" required style={{ width: '50%', padding: '12px 16px', border: 'none', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
                <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="CVC" required style={{ width: '50%', padding: '12px 16px', border: 'none', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Save Card Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
            <input 
              type="checkbox" 
              id="saveCard" 
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
            <label htmlFor="saveCard" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              Securely save card details for 1-click checkout
            </label>
          </div>

          <button 
            type="submit" 
            disabled={processing}
            style={{ width: '100%', padding: '16px', backgroundColor: processing ? 'var(--bg-hover)' : 'var(--primary-color)', color: processing ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: processing ? 'wait' : 'pointer', transition: 'background 0.2s' }}
          >
            {processing ? 'Processing...' : `Pay Rs. ${session.amount.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MockStripeCheckout;