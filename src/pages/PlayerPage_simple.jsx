import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableImage from '../components/DraggableImage';
import Lightbox from '../components/Lightbox';
import StatsModal from '../components/StatsModal';
import ShareResults from '../components/ShareResults';

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_ATTEMPTS = 5;

export default function PlayerPageSimple() {
  const [images, setImages] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [status, setStatus] = useState(null); // 'ok' | 'bad' | null
  const [source, setSource] = useState(null); // 'firestore' | 'local' | null
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lightbox, setLightbox] = useState({ open: false, url: '', alt: '' });
  const [activeDragId, setActiveDragId] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStats, setGameStats] = useState({
    startTime: Date.now(),
    movesCount: 0,
  });
  const [showStats, setShowStats] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    played: 0,
    won: 0,
    wonPercentage: 0,
    streak: 0,
    maxStreak: 0,
    history: []
  });
  const [showShareResults, setShowShareResults] = useState(false);
  const [puzzle, setPuzzle] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      }
    })
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const q = query(
        collection(db, 'puzzles'),
        where('date', '==', today),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap && !snap.empty) {
        const doc = snap.docs[0].data();
        setPuzzle(doc); // Set the puzzle data
        const imgs = Array.isArray(doc.images) ? doc.images.map((img, i) => ({
          ...img,
          id: img.id ?? String(i),
        })) : [];
        setOriginalOrder(imgs);
        setImages(shuffleArray(imgs));
        setSource('firestore');
        return true;
      }
    } catch (err) {
      console.error('Firestore read failed (continuing to local):', err);
    }
    return false;
  }, []);

  const loadLocalImages = useCallback(() => {
    // fallback: local test images from public/test-images
    const local = [
      { id: '0', url: '/test-images/01.jpg', alt: 'Scene 1' },
      { id: '1', url: '/test-images/02.jpg', alt: 'Scene 2' },
      { id: '2', url: '/test-images/03.jpg', alt: 'Scene 3' },
      { id: '3', url: '/test-images/04.jpg', alt: 'Scene 4' },
    ];
    setOriginalOrder(local.slice());
    setImages(shuffleArray(local));
    setSource('local');
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const loaded = await loadData();
      if (mounted) {
        if (!loaded) {
          loadLocalImages();
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [loadData, loadLocalImages]);

  const loadPlayerStats = useCallback(() => {
    try {
      const savedStats = localStorage.getItem('cinesort_stats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        // Calculate win percentage
        const wonPercentage = stats.played > 0 
          ? Math.round((stats.won / stats.played) * 100) 
          : 0;
        
        // Load history
        const history = JSON.parse(localStorage.getItem('cinesort_history') || '[]');
        
        setPlayerStats({
          ...stats,
          wonPercentage,
          history
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const saveGameResult = useCallback((won) => {
    try {
      // Load current stats
      const savedStats = localStorage.getItem('cinesort_stats');
      const stats = savedStats ? JSON.parse(savedStats) : {
        played: 0,
        won: 0,
        streak: 0,
        maxStreak: 0
      };
      
      // Update stats
      stats.played += 1;
      if (won) {
        stats.won += 1;
        stats.streak += 1;
        stats.maxStreak = Math.max(stats.streak, stats.maxStreak);
      } else {
        stats.streak = 0;
      }
      
      // Save updated stats
      localStorage.setItem('cinesort_stats', JSON.stringify(stats));
      
      // Update history
      const history = JSON.parse(localStorage.getItem('cinesort_history') || '[]');
      const gameRecord = {
        date: new Date().toISOString(),
        won,
        attempts,
        title: source === 'firestore' && puzzle ? puzzle.title : 'Demo Puzzle'
      };
      
      // Add to beginning of array, limit to 10 items
      history.unshift(gameRecord);
      if (history.length > 10) history.pop();
      
      localStorage.setItem('cinesort_history', JSON.stringify(history));
      
      // Refresh stats in state
      loadPlayerStats();
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }, [attempts, source, loadPlayerStats]);

  useEffect(() => {
    loadPlayerStats();
  }, [loadPlayerStats]);

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveDragId(null);
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    setImages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    
    setStatus(null);
    setGameStats(prev => ({
      ...prev,
      movesCount: prev.movesCount + 1
    }));
  }

  function checkOrder() {
    setAttempts((a) => a + 1);
    
    if (originalOrder.length !== images.length) {
      setStatus('bad');
      return;
    }
    
    const ok = images.every((img, i) =>
      img.id === originalOrder[i].id
    );
    
    setStatus(ok ? 'ok' : 'bad');
    
    // Check if game is over - either win or used all attempts
    const gameOver = ok || attempts + 1 >= MAX_ATTEMPTS;
    if (gameOver) {
      saveGameResult(ok);
      if (ok) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }

  function resetShuffle() {
    setImages(shuffleArray(originalOrder));
    setStatus(null);
    setGameStats(prev => ({
      ...prev,
      movesCount: prev.movesCount + 1
    }));
  }

  const activeDragItem = activeDragId ? images.find(img => img.id === activeDragId) : null;

  const getTimePlayed = () => {
    const seconds = Math.floor((Date.now() - gameStats.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 py-6 px-4">
      {/* Background film strip effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute inset-0 film-strip"></div>
      </div>

      {/* Game Header */}
      <header className="relative z-10 mb-6 text-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center">
          <p className="text-slate-300 text-lg font-['Inter'] mb-3 max-w-md">
            Arrange the scenes in chronological order from earliest to latest
          </p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-2 max-w-md mx-auto">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-white text-xl font-bold">{MAX_ATTEMPTS - attempts}</div>
            <div className="text-slate-300 text-xs">Attempts Left</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-white text-xl font-bold">{gameStats.movesCount}</div>
            <div className="text-slate-300 text-xs">Moves Made</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-white text-xl font-bold">{getTimePlayed()}</div>
            <div className="text-slate-300 text-xs">Time</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-4">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(attempts / MAX_ATTEMPTS) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Instructions */}
        {showInstructions && (
          <div className="max-w-lg mx-auto mb-6 bg-black/30 p-4 rounded-lg backdrop-blur-sm border border-white/10 animate-slide-in">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-semibold">How to Play</h3>
              <button 
                onClick={() => setShowInstructions(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
              <li>Drag and drop the images to arrange them in order from first to last scene</li>
              <li>Click "Check Order" to see if you're right</li>
              <li>You have {MAX_ATTEMPTS} attempts to get it right</li>
              <li>Click on any image to view it fullscreen</li>
            </ol>
          </div>
        )}

        {/* Add Stats button */}
        <div className="flex items-center gap-3 justify-center mb-3">
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Stats
          </button>
        </div>
      </header>

      {/* Movie Title */}
      {source === 'firestore' && puzzle?.title && (
        <div className="mb-6 text-center animate-fade-in">
          <div className="inline-block bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/10 shadow-lg">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 font-['Orbitron']">
              {puzzle.title}
            </h2>
            {puzzle.date && (
              <p className="text-slate-300 text-sm mt-1">
                {new Date(puzzle.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Loading Today's Puzzle...</p>
        </div>
      ) : (
        <>
          {/* Main Game Area */}
          <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full mb-8">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {images.map((img, idx) => (
                    <div key={img.id} className="group relative animate-float" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-semibold z-10 shadow-lg font-['Inter'] transition-all duration-300 group-hover:scale-110">
                        {idx + 1}
                      </div>
                      
                      <div className="relative">
                        <DraggableImage
                          id={img.id}
                          image={img.url}
                          alt={img.alt}
                          onClick={() => setLightbox({ open: true, url: img.url, alt: img.alt || '' })}
                        />
                        
                        {/* Scene title overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-center text-sm font-medium">{img.alt}</p>
                        </div>
                        
                        {/* Fullscreen icon */}
                        <button
                          className="absolute top-2 right-2 bg-black/40 hover:bg-blue-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={() => setLightbox({ open: true, url: img.url, alt: img.alt || '' })}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <DragOverlay>
                  {activeDragId && activeDragItem ? (
                    <div className="relative transform scale-105 rotate-1 shadow-2xl rounded-lg">
                      <img
                        src={activeDragItem.url}
                        alt={activeDragItem.alt}
                        className="w-full h-full object-cover rounded-lg border-2 border-blue-400"
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </SortableContext>
            </DndContext>
          </main>

          {/* Game Controls */}
          <footer className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {/* Status Message */}
            <div className={`relative px-6 py-3 rounded-lg text-xl font-bold text-center transition-all duration-500
              ${status === 'ok' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-glow' : 
                status === 'bad' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse-border' : 
                'bg-white/10 backdrop-blur-sm text-white'}
            `}>
              {status === 'ok' ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Correct! Perfect Order! 🎬
                  </div>
                  <button
                    onClick={() => setShowShareResults(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-3 py-1 rounded-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Results
                  </button>
                </div>
              ) : status === 'bad' ? (
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {attempts >= MAX_ATTEMPTS ? (
                    <div className="flex items-center justify-between w-full">
                      <span>Out of attempts! Try again tomorrow.</span>
                      <button
                        onClick={() => setShowShareResults(true)}
                        className="bg-gradient-to-r from-slate-500 to-slate-600 text-white text-sm px-3 py-1 rounded-lg flex items-center ml-2"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Results
                      </button>
                    </div>
                  ) : (
                    "Not quite — try again!"
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Drag to arrange scenes from first to last
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={checkOrder}
                disabled={status === 'ok' || attempts >= MAX_ATTEMPTS}
                className={`px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-all duration-300 transform 
                  ${status === 'ok' || attempts >= MAX_ATTEMPTS ? 
                    'bg-slate-600 text-slate-300 cursor-not-allowed' : 
                    'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95'
                  }`}
              >
                Check Order
              </button>
              <button
                onClick={resetShuffle}
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 text-white text-lg font-bold shadow-lg hover:from-slate-800 hover:to-black transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Shuffle Again
              </button>
              
              {!showInstructions && (
                <button
                  onClick={() => setShowInstructions(true)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Show Instructions
                </button>
              )}
            </div>

            {/* Attribution */}
            <div className="mt-8 text-slate-400 text-xs text-center">
              <p>
                Inspired by <a href="https://framed.wtf" className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">framed.wtf</a> • Made with ❤️ for movie lovers
              </p>
              <p className="mt-1">
                {source === 'firestore' ? 'Daily puzzle from our database' : 'Demo puzzle with sample images'}
              </p>
            </div>
          </footer>

          {/* Lightbox Component */}
          <Lightbox
            open={lightbox.open}
            url={lightbox.url}
            alt={lightbox.alt}
            onClose={() => setLightbox({ open: false, url: '', alt: '' })}
          />

          {/* Stats Modal */}
          <StatsModal 
            isOpen={showStats}
            onClose={() => setShowStats(false)}
            stats={playerStats}
          />

          {/* Share Results Modal */}
          {showShareResults && (
            <ShareResults
              attempts={attempts}
              maxAttempts={MAX_ATTEMPTS}
              title={source === 'firestore' && puzzle ? puzzle.title : 'CineSort Puzzle'}
              onClose={() => setShowShareResults(false)}
            />
          )}

          {/* Confetti effect on success */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className="popcorn-kernel absolute animate-popcorn"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-5%`,
                      width: `${Math.random() * 15 + 10}px`,
                      height: `${Math.random() * 15 + 15}px`,
                      backgroundColor: Math.random() > 0.1 ? '#F8F4E3' : '#F5CB5C',
                      transform: `rotate(${Math.random() * 360}deg)`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                      animationDelay: `${Math.random() * 1.5}s`
                    }}
                  />
                ))}
                
                {/* Add some popcorn emoji for variety */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={`emoji-${i}`}
                    className="absolute animate-popcorn flex items-center justify-center"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-5%`,
                      fontSize: `${Math.random() * 20 + 15}px`,
                      animationDuration: `${Math.random() * 4 + 3}s`,
                      animationDelay: `${Math.random() * 2}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  >
                    🍿
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}