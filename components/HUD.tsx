
import React from 'react';

interface HUDProps {
  score: number;
  health: number;
  mana: number;
  combo: number;
  multiplier: number;
}

const HUD: React.FC<HUDProps> = ({ score, health, mana, combo, multiplier }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex justify-between items-start">
      <div className="flex flex-col gap-4">
        {/* Health Bar */}
        <div className="w-64 h-6 bg-slate-900/80 border border-slate-700 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
            style={{ width: `${Math.max(0, health)}%` }}
          />
          <div className="absolute inset-0 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-white">HP</div>
        </div>

        {/* Mana Bar */}
        <div className="w-64 h-6 bg-slate-900/80 border border-slate-700 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
            style={{ width: `${mana}%` }}
          />
          <div className="absolute inset-0 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-white">MANA</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="text-4xl font-black text-white drop-shadow-lg font-mono">
          {score.toLocaleString().padStart(8, '0')}
        </div>
        
        {combo > 1 && (
          <div className="flex items-center gap-3 animate-bounce">
            <span className="text-xl font-bold text-sky-400 uppercase tracking-tighter">Combo</span>
            <span className="text-4xl font-black text-sky-300 italic">x{combo}</span>
          </div>
        )}
        
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded">
          Multiplier x{multiplier.toFixed(1)}
        </div>
      </div>
    </div>
  );
};

export default HUD;
