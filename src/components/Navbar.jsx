import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';

<<<<<<< HEAD
const Navbar = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
=======
const Navbar = ({ adminPath }) => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

<<<<<<< HEAD
=======
  const checkAdminCode = () => {
    // Secret code to access admin panel - simple example
    if (adminCode === "cinesortadmin") {
      window.location.href = `/${adminPath}`;
    } else {
      setWrongAttempts(prev => prev + 1);
      if (wrongAttempts >= 2) {
        alert("Incorrect access code. Please try again later.");
        setShowAdminCode(false);
      } else {
        alert("Incorrect access code. Please try again.");
      }
    }
  };

>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black shadow-2xl' : 'bg-black/80 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              {/* Logo */}
              <div className="relative mr-2 w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transform group-hover:scale-110 transition-transform duration-300 animate-pulse-border"></div>
                <div className="absolute inset-0.5 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
              
              {/* Text Logo */}
              <div className="flex flex-col">
                <span className="text-xl font-black text-white font-['Orbitron'] tracking-wider leading-tight group-hover:text-blue-400 transition-colors">
                  CINE<span className="text-blue-400">SORT</span>
                </span>
                <span className="text-xs text-slate-400 tracking-wider leading-none">MOVIE PUZZLE</span>
              </div>
            </Link>
          </div>
          
<<<<<<< HEAD
          {/* Right side - only show logout if admin is logged in */}
          <div className="flex items-center space-x-1">
            {user && (
              <button
                onClick={handleLogout}
                className="nav-link text-red-400 hover:bg-red-950/50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            )}
=======
          <div className="flex items-center space-x-1">
            <Link 
              to="/" 
              className="nav-link"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            
            {!showAdminCode && !user && (
              <button
                onClick={() => setShowAdminCode(true)}
                className="nav-link opacity-50 hover:opacity-100"
                title="Studio Access"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Studio</span>
              </button>
            )}
            
            {showAdminCode && !user && (
              <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1">
                <input
                  type="password"
                  className="bg-transparent border-none text-white text-sm w-32 focus:outline-none focus:ring-0"
                  placeholder="Enter code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkAdminCode()}
                />
                <button 
                  onClick={checkAdminCode}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button 
                  onClick={() => setShowAdminCode(false)}
                  className="ml-1 text-slate-400 hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {user && (
              <>
                <Link 
                  to={`/${adminPath}`} 
                  className="nav-link"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  <span>Studio</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="nav-link text-red-400 hover:bg-red-950/50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </>
            )}
>>>>>>> 68fbbe1f7409e9f524a1bca1c7933a7f0012ee96
          </div>
        </div>
      </div>
      
      {/* Film Strip Bottom Border */}
      <div className="h-1 w-full bg-black overflow-hidden">
        <div className="flex">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-1 w-3 bg-slate-800"></div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
