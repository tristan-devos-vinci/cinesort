import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

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
