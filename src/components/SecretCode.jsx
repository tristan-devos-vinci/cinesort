import React, { useState, useEffect } from 'react';

export default function SecretCode({ onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    // Check if there's an existing lockout
    const storedExpiry = localStorage.getItem('adminLockoutExpiry');
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (expiryTime > Date.now()) {
        setIsLocked(true);
        setLockExpiry(expiryTime);
        
        // Start the countdown
        const intervalId = setInterval(() => {
          const remaining = Math.ceil((expiryTime - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsLocked(false);
            setLockExpiry(null);
            localStorage.removeItem('adminLockoutExpiry');
            clearInterval(intervalId);
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
        
        return () => clearInterval(intervalId);
      } else {
        // Lockout expired
        localStorage.removeItem('adminLockoutExpiry');
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // The secret code is "cinesortadmin"
    if (code.toLowerCase() === "cinesortadmin") {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode('');
      
      if (newAttempts >= 3) {
        // Lock out after 3 failed attempts (5 minutes = 300000 ms)
        const expiryTime = Date.now() + 300000;
        setIsLocked(true);
        setLockExpiry(expiryTime);
        localStorage.setItem('adminLockoutExpiry', expiryTime.toString());
        
        // Start countdown
        const intervalId = setInterval(() => {
          const remaining = Math.ceil((expiryTime - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsLocked(false);
            setLockExpiry(null);
            setAttempts(0);
            localStorage.removeItem('adminLockoutExpiry');
            clearInterval(intervalId);
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
      }
    }
  };

  const formatTimeLeft = () => {
    if (!timeLeft) return '';
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm border border-slate-700 animate-slide-in">
        <div className="text-center mb-6">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Studio Access</h2>
          <p className="text-slate-400 text-sm">Enter the secret code to access the admin studio</p>
        </div>
        
        {isLocked ? (
          <div className="text-center">
            <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4">
              <p>Too many incorrect attempts.</p>
              <p>Please try again in {formatTimeLeft()}</p>
            </div>
            <button 
              onClick={onCancel}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter secret code"
                autoFocus
              />
              
              {attempts > 0 && (
                <p className="mt-2 text-red-400 text-sm">
                  Incorrect code. {3 - attempts} attempts remaining.
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Access
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-4 text-center text-xs text-slate-500">
          This area is for authorized administrators only.
        </div>
      </div>
    </div>
  );
}