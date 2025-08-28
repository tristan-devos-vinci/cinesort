import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PlayerPageSimple from './pages/PlayerPage_simple';
import AdminPage from './pages/AdminPage';
<<<<<<< HEAD
import React from 'react';

function App() {
  // Use fixed admin path instead of random generation
  const adminPath = 'admin0424';
=======
import React, { useState, useEffect } from 'react';

function App() {
  // Generate a random admin path on app load (changes each session)
  const [adminPath] = useState(() => {
    // Either use stored path or generate new one
    const storedPath = localStorage.getItem('adminSecretPath');
    if (storedPath) return storedPath;
    
    // Generate random string for admin path
    const randomPath = `studio-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('adminSecretPath', randomPath);
    return randomPath;
  });
>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96

  return (
    <Router>
      <div className="app-content pt-20 min-h-screen">
<<<<<<< HEAD
        <Navbar />
        <Routes>
          <Route path="/" element={<PlayerPageSimple />} />
          <Route path={`/${adminPath}`} element={<AdminPage />} />
=======
        <Navbar adminPath={adminPath} />
        <Routes>
          <Route path="/" element={<PlayerPageSimple />} />
          <Route path={`/${adminPath}`} element={<AdminPage />} />
          {/* Add a redirect from the old /admin path for compatibility */}
          <Route path="/admin" element={<AdminRedirect secretPath={adminPath} />} />
>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96
        </Routes>
      </div>
    </Router>
  );
}

<<<<<<< HEAD
=======
// Simple redirect component
function AdminRedirect({ secretPath }) {
  useEffect(() => {
    window.location.replace(`/${secretPath}`);
  }, [secretPath]);
  
  return <div className="p-8 text-center">Redirecting to admin panel...</div>;
}

>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96
export default App;
