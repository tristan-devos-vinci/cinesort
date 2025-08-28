import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import Lightbox from '../components/Lightbox';
import { Link } from 'react-router-dom';

const MAX_ATTEMPTS = 6;

const PlayerPage = () => {
  const [puzzle, setPuzzle] = useState(null);
  const [step, setStep] = useState(0); // current image index
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, url: '', alt: '' });

  useEffect(() => {
    loadTodaysPuzzle();
  }, []);

  const loadTodaysPuzzle = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const q = query(collection(db, 'puzzles'), where('date', '==', todayStr), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const doc = snap.docs[0].data();
        setPuzzle(doc);
      } else {
        // fallback: latest
        const qLatest = query(collection(db, 'puzzles'), orderBy('createdAt', 'desc'), limit(1));
        const latestSnap = await getDocs(qLatest);
        if (!latestSnap.empty) {
          setPuzzle(latestSnap.docs[0].data());
        } else {
          setError('No puzzle available for today.');
        }
      }
    } catch (err) {
      setError('Failed to load puzzle.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = () => {
    if (!puzzle || !puzzle.images) return;
    const correct = step === puzzle.images.findIndex(img => img.alt?.toLowerCase() === guess.trim().toLowerCase());
    setGuesses([...guesses, { guess, correct }]);
    setAttemptsLeft(attemptsLeft - 1);
    setShowResult(true);
    setIsComplete(correct || attemptsLeft - 1 === 0);
  };

  const handleNext = () => {
    setShowResult(false);
    setGuess('');
    if (isComplete || step === puzzle.images.length - 1) {
      setStep(0);
      setGuesses([]);
      setAttemptsLeft(MAX_ATTEMPTS);
      setIsComplete(false);
    } else {
      setStep(step + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl font-bold">Loading Cine Sort…</div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-white/10 rounded-xl p-8 text-center shadow-lg">
          <div className="text-2xl font-bold text-white mb-2">Cine Sort</div>
          <div className="text-red-300">{error || 'No puzzle found.'}</div>
        </div>
      </div>
    );
  }

  const currentImage = puzzle.images[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md mx-auto p-4">
        <Link to="/" className="text-2xl font-bold text-white font-['Orbitron'] tracking-wider transition-all duration-300 hover:text-blue-400 mb-6 block text-center">
          <span className="text-blue-400 mr-2">●</span>
        </Link>
        <p className="text-center text-slate-300 mb-6">Guess the movie scene in as few tries as possible!</p>
        <div className="flex items-center justify-center mb-4">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((MAX_ATTEMPTS - attemptsLeft) / MAX_ATTEMPTS) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-300">{attemptsLeft} tries left</span>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-4 mb-4 relative">
          <div
            className="cursor-pointer"
            onClick={() => setLightbox({ open: true, url: currentImage.url, alt: currentImage.alt })}
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="w-full h-64 object-cover rounded-lg shadow-lg border-4 border-slate-900"
            />
          </div>
          <button
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 text-xs"
            onClick={() => setLightbox({ open: true, url: currentImage.url, alt: currentImage.alt })}
          >
            Fullscreen
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Guess the scene description…"
            disabled={isComplete || showResult}
          />
        </div>
        <button
          onClick={handleGuess}
          disabled={isComplete || showResult || !guess}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition disabled:bg-slate-500 mb-2"
        >
          Guess
        </button>
        {showResult && (
          <div className={`mt-2 text-center font-bold ${guesses[guesses.length - 1]?.correct ? 'text-green-500' : 'text-red-500'}`}>
            {guesses[guesses.length - 1]?.correct
              ? 'Correct! 🎬'
              : isComplete
                ? 'Out of tries! The answer was: ' + currentImage.alt
                : 'Try again!'}
            <button
              onClick={handleNext}
              className="block mx-auto mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg"
            >
              {isComplete ? 'Restart' : 'Next'}
            </button>
          </div>
        )}
        <Lightbox
          open={lightbox.open}
          url={lightbox.url}
          alt={lightbox.alt}
          onClose={() => setLightbox({ open: false, url: '', alt: '' })}
        />
      </div>
      <footer className="mt-8 text-slate-400 text-xs text-center">
        Inspired by <a href="https://framed.wtf" className="underline" target="_blank" rel="noopener noreferrer">framed.wtf</a> • Made with ❤️ for movie lovers
      </footer>
    </div>
  );
};

export default PlayerPage;
