import React from 'react';

export default function StatsModal({ isOpen, onClose, stats }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-['Orbitron']">Your Stats</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.played}</div>
            <div className="text-sm text-slate-300">Games Played</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.wonPercentage}%</div>
            <div className="text-sm text-slate-300">Win Rate</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.streak}</div>
            <div className="text-sm text-slate-300">Current Streak</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.maxStreak}</div>
            <div className="text-sm text-slate-300">Best Streak</div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">Recent Games</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {stats.history.length === 0 ? (
            <div className="text-center py-4 text-slate-400">No game history yet</div>
          ) : (
            stats.history.map((game, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${game.won ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <div>
                  <div className="text-white font-medium">{game.title || 'Unknown Movie'}</div>
                  <div className="text-xs text-slate-400">{new Date(game.date).toLocaleDateString()}</div>
                </div>
                <div className={`text-sm font-medium ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                  {game.won ? 'Solved' : 'Failed'} • {game.attempts} {game.attempts === 1 ? 'try' : 'tries'}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-slate-700 pt-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}