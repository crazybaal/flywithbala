
import React from 'react';

interface GameOverProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, highScore, onRestart }) => {
  const isNewHigh = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl z-50">
      <div className="text-center animate-in fade-in zoom-in duration-500">
        <h2 className="text-slate-500 font-bold tracking-widest uppercase mb-4">Core Integrity Failed</h2>
        <div className="text-8xl font-black text-white mb-8 tracking-tighter italic">
          GAME OVER
        </div>
        
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 mb-12 shadow-2xl">
          <div className="text-slate-400 text-sm uppercase font-bold tracking-widest mb-1">Final Flight Rating</div>
          <div className="text-5xl font-mono text-sky-400 mb-6">{score.toLocaleString()}</div>
          
          <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Personal Record</div>
          <div className="text-2xl font-mono text-slate-300">
            {highScore.toLocaleString()}
            {isNewHigh && <span className="ml-3 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">NEW RECORD</span>}
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="px-12 py-4 bg-white text-slate-950 font-black rounded-full hover:bg-sky-400 transition-all transform hover:scale-105"
        >
          RETRY MISSION
        </button>
      </div>
    </div>
  );
};

export default GameOver;
