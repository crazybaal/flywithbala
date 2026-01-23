
import React from 'react';

interface HUDProps {
  score: number;
  health: number;
  mana: number;
  combo: number;
  multiplier: number;
  progress: number;
}

const HUD: React.FC<HUDProps> = ({ score, health, mana, combo, multiplier, progress }) => {
  const isLowHealth = health < 30;

  const getZone = (p: number) => {
    if (p < 0.25) return "HIGHWAY SECTOR";
    if (p < 0.50) return "OUTER BYPASS";
    if (p < 0.75) return "CAMPUS ENTRANCE";
    if (p < 0.95) return "HOSTEL APPROACH";
    return "POTHIGAI GATES";
  };

  return (
    <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex flex-col items-center">
      {/* Journey Progress Bar */}
      <div className="w-full max-w-3xl mb-8">
        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400">
          <span className={progress < 0.25 ? 'text-sky-400' : ''}>HIGHWAY START</span>
          <span className="text-white font-mono bg-slate-800/80 px-4 py-1 rounded-full border border-slate-700 shadow-xl">
            {getZone(progress)}
          </span>
          <span className={progress > 0.95 ? 'text-sky-400' : ''}>POTHIGAI HOSTEL</span>
        </div>
        <div className="h-2 w-full bg-slate-900/90 rounded-full border border-slate-700 overflow-hidden backdrop-blur-md relative">
          <div 
            className="h-full bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-600 transition-all duration-300 relative shadow-[0_0_15px_rgba(14,165,233,0.5)]"
            style={{ width: `${progress * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse border-2 border-sky-400" />
          </div>
          {/* Checkpoints */}
          <div className="absolute left-1/4 top-0 w-px h-full bg-slate-700" />
          <div className="absolute left-2/4 top-0 w-px h-full bg-slate-700" />
          <div className="absolute left-3/4 top-0 w-px h-full bg-slate-700" />
        </div>
      </div>

      <div className="w-full flex justify-between items-start">
        <div className="flex flex-col gap-4">
          {/* Health Bar */}
          <div className={`w-72 h-7 bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden backdrop-blur-sm relative ${isLowHealth ? 'animate-pulse' : ''}`}>
            <div 
              className={`h-full bg-gradient-to-r ${isLowHealth ? 'from-red-600 to-red-400' : 'from-red-600 to-rose-500'} transition-all duration-300`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white">INTEGRITY</div>
            <div className="absolute right-4 inset-y-0 flex items-center text-[10px] font-mono font-bold text-white/50">{Math.ceil(health)}%</div>
          </div>

          {/* Mana Bar */}
          <div className="w-72 h-7 bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden backdrop-blur-sm relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
              style={{ width: `${mana}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white">CORE MANA</div>
            <div className="absolute right-4 inset-y-0 flex items-center text-[10px] font-mono font-bold text-white/50">{Math.ceil(mana)}%</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-mono tracking-tighter">
            {score.toLocaleString().padStart(8, '0')}
          </div>
          
          {combo > 1 && (
            <div className="flex items-center gap-4 bg-sky-500/10 px-6 py-2 rounded-xl border border-sky-500/30 animate-in slide-in-from-right duration-300">
              <span className="text-xl font-black text-sky-400 uppercase tracking-widest italic">COMBO</span>
              <span className="text-5xl font-black text-white italic drop-shadow-[0_0_15px_rgba(14,165,233,0.8)]">x{combo}</span>
            </div>
          )}
          
          <div className="text-xs font-black text-sky-300 uppercase tracking-[0.3em] bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700 shadow-2xl">
            RATING MULTIPLIER x{multiplier.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
