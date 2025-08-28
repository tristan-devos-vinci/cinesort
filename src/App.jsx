import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PlayerPageSimple from './pages/PlayerPage_simple';
import AdminPage from './pages/AdminPage';
import React from 'react';

function App() {
  // Use fixed admin path instead of random generation
  const adminPath = 'admin0424';

  return (
    <Router>
      <div className="app-content pt-20 min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<PlayerPageSimple />} />
          <Route path={`/${adminPath}`} element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
