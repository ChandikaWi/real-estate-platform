import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });

  // Add a toast notification
  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Show a confirmation modal
  const showConfirm = useCallback((message, onConfirmCallback) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm: onConfirmCallback
    });
  }, []);

  // Close the confirmation modal
  const closeConfirm = () => {
    setConfirmState({ isOpen: false, message: '', onConfirm: null });
  };

  // Handle yes click
  const handleConfirm = () => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    closeConfirm();
  };

  // Get colors based on toast type
  const getToastColors = (type) => {
    switch(type) {
      case 'success': return { bg: '#10b981', color: '#fff', icon: '✅' };
      case 'error': return { bg: '#ef4444', color: '#fff', icon: '⚠️' };
      case 'warning': return { bg: '#f59e0b', color: '#fff', icon: '⚡' };
      case 'info':
      default: return { bg: 'var(--primary-color)', color: '#fff', icon: 'ℹ️' };
    }
  };

  return (
    <UIContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* GLOBAL TOAST CONTAINER */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {toasts.map(toast => {
          const { bg, color, icon } = getToastColors(toast.type);
          return (
            <div key={toast.id} style={{
              backgroundColor: bg,
              color: color,
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '600',
              animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              pointerEvents: 'auto'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
              <span style={{ maxWidth: '300px', lineHeight: '1.4' }}>{toast.message}</span>
            </div>
          );
        })}
      </div>

      {/* GLOBAL CONFIRM MODAL */}
      {confirmState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span> Action Required
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.5', fontSize: '1.05rem' }}>
              {confirmState.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={closeConfirm} 
                style={{ padding: '10px 18px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                style={{ padding: '10px 18px', backgroundColor: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INJECT ANIMATIONS GLOBALLY JUST FOR THE UI SYSTEM */}
      <style>{`
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </UIContext.Provider>
  );
};
