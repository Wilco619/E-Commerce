import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(() => {
    // Try to get existing session ID from localStorage
    const stored = localStorage.getItem('userSessionId');
    if (stored) return stored;
    
    // Generate new session ID if none exists
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userSessionId', newSessionId);
    return newSessionId;
  });

  // Expose session management functions
  const resetSession = () => {
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userSessionId', newSessionId);
    setSessionId(newSessionId);
  };

  const clearSession = () => {
    localStorage.removeItem('userSessionId');
    setSessionId(null);
  };

  return (
    <SessionContext.Provider value={{ sessionId, resetSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};