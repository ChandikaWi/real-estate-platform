import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm your AI Real Estate Assistant. How can I help you find your dream property today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
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
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting to my database right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (id) => {
    setIsOpen(false);
    navigate(`/property/${id}`);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✨
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '350px', height: '500px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ padding: '15px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✨</span> AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ 
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--bg-card)', 
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-main)', 
                  padding: '10px 15px', 
                  borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0', 
                  border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.9rem', lineHeight: '1.4', boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.text}
                </div>
                
                {/* Embedded Property Cards from AI */}
                {msg.properties && msg.properties.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {msg.properties.map(prop => (
                      <div key={prop._id} onClick={() => handlePropertyClick(prop._id)} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ height: '100px', backgroundColor: 'var(--bg-hover)' }}>
                          {prop.images?.length > 0 && <img src={prop.images[0]} alt="Prop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ padding: '10px' }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</h4>
                          <p style={{ margin: 0, color: 'var(--accent-color)', fontWeight: 'bold' }}>Rs.{prop.price.toLocaleString()}</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prop.location.city} • {prop.bedrooms} Beds</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--bg-card)', padding: '10px 15px', borderRadius: '15px 15px 15px 0', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Searching...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} style={{ padding: '15px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              placeholder="E.g., 2 bed apartment in Colombo..." 
              style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }} 
            />
            <button type="submit" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatBot;