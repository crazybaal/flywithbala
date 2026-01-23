
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
    <div className={`absolute top-0 left-0 w-full p-6 pointer-events-none flex flex-col items-center ${isLowHealth ? 'animate-pulse contrast-125' : ''}`}>
      {/* Journey Progress Bar */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-slate-400">
          <span className={progress < 0.25 ? 'text-sky-400' : ''}>HIGHWAY ORIGIN</span>
          <span className="text-white font-mono bg-slate-900/90 px-6 py-1.5 rounded-full border border-sky-900/50 shadow-2xl backdrop-blur-xl">
            {getZone(progress)}
          </span>
          <span className={progress > 0.95 ? 'text-sky-400' : ''}>POTHIGAI DESTINATION</span>
        </div>
        <div className="h-3 w-full bg-slate-950/90 rounded-full border border-slate-800 overflow-hidden backdrop-blur-md relative">
          <div 
            className="h-full bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-600 transition-all duration-300 relative shadow-[0_0_20px_rgba(14,165,233,0.6)]"
            style={{ width: `${progress * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_30px_white] animate-pulse border-4 border-sky-400" />
          </div>
        </div>
      </div>

      <div className="w-full flex justify-between items-start">
        <div className="flex flex-col gap-5">
          {/* Integrity Bar */}
          <div className={`w-80 h-9 bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md relative ${isLowHealth ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
            <div 
              className={`h-full bg-gradient-to-r ${isLowHealth ? 'from-red-600 to-orange-500 animate-pulse' : 'from-red-600 to-rose-400'} transition-all duration-500`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4 text-[11px] font-black uppercase tracking-[0.25em] text-white mix-blend-difference">SYSTEM INTEGRITY</div>
            <div className="absolute right-4 inset-y-0 flex items-center text-[12px] font-mono font-bold text-white/60">{Math.ceil(health)}%</div>
          </div>

          {/* Mana Bar */}
          <div className="w-80 h-9 bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-sky-400 transition-all duration-300"
              style={{ width: `${mana}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4 text-[11px] font-black uppercase tracking-[0.25em] text-white mix-blend-difference">CORE RESONANCE</div>
            <div className="absolute right-4 inset-y-0 flex items-center text-[12px] font-mono font-bold text-white/60">{Math.ceil(mana)}%</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-6xl font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] font-mono tracking-tighter italic">
            {score.toLocaleString().padStart(8, '0')}
          </div>
          
          {combo > 1 && (
            <div className="flex items-center gap-6 bg-sky-500/5 px-8 py-3 rounded-2xl border border-sky-500/40 backdrop-blur-xl animate-in fade-in slide-in-from-right duration-500">
              <span className="text-2xl font-black text-sky-400 uppercase tracking-widest italic">CHAIN</span>
              <span className="text-6xl font-black text-white italic drop-shadow-[0_0_25px_rgba(14,165,233,0.9)]">x{combo}</span>
            </div>
          )}
          
          <div className="text-[10px] font-black text-sky-300 uppercase tracking-[0.4em] bg-slate-950/90 px-6 py-2.5 rounded-xl border border-sky-900/50 shadow-2xl">
            FLIGHT RATING MULT x{multiplier.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
