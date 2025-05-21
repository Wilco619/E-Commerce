export const handleAuthSuccess = (delay = 1500) => {
  return new Promise((resolve) => {
    // Dispatch auth state changed event
    window.dispatchEvent(new Event('auth-state-changed'));
    
    // Set a flag in sessionStorage to indicate post-refresh action
    sessionStorage.setItem('justAuthenticated', 'true');
    
    // Delay then refresh
    setTimeout(() => {
      window.location.reload();
      resolve();
    }, delay);
  });
};