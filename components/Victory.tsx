
import React from 'react';

interface VictoryProps {
  score: number;
  onRestart: () => void;
}

const Victory: React.FC<VictoryProps> = ({ score, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl z-50">
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <div className="text-sky-400 font-bold tracking-[0.5em] uppercase mb-4 animate-pulse">Arrival Confirmed</div>
        <h2 className="text-7xl font-black text-white mb-8 tracking-tighter italic uppercase">
          Mission Accomplished
        </h2>
        
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-3xl border border-sky-500/30 mb-12 shadow-[0_0_50px_rgba(14,165,233,0.2)]">
          <div className="text-slate-400 text-sm uppercase font-bold tracking-widest mb-2">Location Reached</div>
          <div className="text-3xl font-bold text-white mb-8">Pothigai Boys Hostel</div>
          
          <div className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Final Flight Rating</div>
          <div className="text-6xl font-mono text-sky-400">{score.toLocaleString()}</div>
        </div>

        <button 
          onClick={onRestart}
          className="px-16 py-5 bg-white text-slate-950 font-black rounded-full hover:bg-sky-400 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          NEW FLIGHT
        </button>
      </div>
    </div>
  );
};

export default Victory;
