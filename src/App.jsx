import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlayerPageSimple from './pages/PlayerPage_simple';
import AdminPage from './pages/AdminPage';
import React from 'react';

function App() {
  return (
    <Router>
      <div className="app-content min-h-screen">
        <Routes>
          <Route path="/" element={<PlayerPageSimple />} />
          <Route path="/admin0424" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
