import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm your RealEstate Assistant. How can I help you find your dream property today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Quick Prompts to guide the user
  const quickPrompts = [
    "Find houses in Colombo",
    "Show me apartments for rent",
    "Looking for land under 10M"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    
    const userMsg = overrideText || inputText;
    if (!userMsg.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { message: userMsg });
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply, 
        properties: data.properties 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, my connection to the property database is temporarily unavailable." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (id) => {
    setIsOpen(false);
    navigate(`/property/${id}`);
    window.scrollTo(0, 0);
  };

  const resetChat = () => {
    setMessages([{ sender: 'bot', text: "Hi! I'm your RealEstate Assistant. How can I help you find your dream property today?" }]);
  };

  return (
    <>
      {/* FLOATING BUBBLE WITH AGENT ICON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          title="Chat with RealEstate Assistant"
          style={{ position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        >
          {/* Agent Icon */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="15" x2="8" y2="15.01" strokeWidth="3" />
            <line x1="16" y1="15" x2="16" y2="15.01" strokeWidth="3" />
            <path d="M9 18c1.5 1 4.5 1 6 0" />
          </svg>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '380px', height: '600px', maxHeight: '85vh', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
          
          {/* Header */}
          <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Agent Icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="15" x2="8" y2="15.01" strokeWidth="3" />
                  <line x1="16" y1="15" x2="16" y2="15.01" strokeWidth="3" />
                  <path d="M9 18c1.5 1 4.5 1 6 0" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>RealEstate Assistant</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }} /> Online</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={resetChat} title="Restart Chat" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s', padding: 0 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </button>
              <button onClick={() => setIsOpen(false)} title="Close Chat" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s', padding: 0, lineHeight: 1 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                &times;
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ 
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--bg-card)', 
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-main)', 
                  padding: '12px 16px', 
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                  border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.95rem', lineHeight: '1.5', boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.text}
                </div>
                
                {/* Embedded Property Mini-Cards */}
                {msg.properties && msg.properties.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
                    {msg.properties.map(prop => (
                      <div key={prop._id} onClick={() => handlePropertyClick(prop._id)} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s ease, border-color 0.2s ease' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                        <div style={{ height: '120px', backgroundColor: 'var(--bg-hover)', position: 'relative' }}>
                          {prop.images?.length > 0 ? (
                            <img src={prop.images[0]} alt="Prop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Image</div>
                          )}
                          <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#111', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>
                            {prop.type}
                          </span>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</h4>
                          <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: '900', fontSize: '1.05rem' }}>
                            Rs. {prop.price.toLocaleString()}
                            {prop.listingType === 'rent' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/mo</span>}
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {prop.location.city} {prop.type !== 'land' && `• ${prop.bedrooms} Beds`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Quick Prompts */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {quickPrompts.map((prompt, i) => (
                  <button key={i} onClick={(e) => handleSendMessage(e, prompt)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--primary-color)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; }}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }} />
                <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.2s' }} />
                <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.4s' }} />
                <span style={{ marginLeft: '5px' }}>Analyzing market...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => handleSendMessage(e)} style={{ padding: '15px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              placeholder="Ask anything..." 
              disabled={loading}
              style={{ flex: 1, padding: '12px 18px', borderRadius: '24px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }} 
            />
            <button 
              type="submit" 
              disabled={loading || !inputText.trim()}
              style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: (loading || !inputText.trim()) ? 'var(--bg-hover)' : 'var(--primary-color)', color: (loading || !inputText.trim()) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (loading || !inputText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      )}

      {/* Internal CSS for dots animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </>
  );
};

export default AIChatBot;