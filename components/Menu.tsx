import React from 'react';

interface MenuProps {
  onStart: () => void;
  highScore: number;
}

const Menu: React.FC<MenuProps> = ({ onStart, highScore }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-50">
      <div className="max-w-xl w-full text-center px-8">
        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-400 to-blue-600 mb-2 tracking-tighter italic uppercase">
          Fly with Bala
        </h1>
        <p className="text-slate-400 font-medium tracking-widest uppercase text-sm mb-12">Precision Skies • Skill-Based Flight</p>
        
        <div className="flex flex-col gap-4 mb-12">
          <button 
            onClick={onStart}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(14,165,233,0.3)]"
          >
            ARAMBIKALAMA
          </button>
          
          <div className="text-slate-500 text-sm mt-4">
            BEST RATING: <span className="text-sky-300 font-mono text-lg">{highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-left border-t border-slate-800 pt-8">
          <div>
            <h3 className="text-slate-300 font-bold mb-3 text-xs uppercase tracking-widest">Movement</h3>
            <ul className="text-slate-500 text-xs space-y-1">
              <li>[W/S] Pitch Up/Down</li>
              <li>[A/D] Speed Adjust</li>
              <li>[SPACE] Flash Dash</li>
              <li>[H] Static Hover</li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-300 font-bold mb-3 text-xs uppercase tracking-widest">Combat</h3>
            <ul className="text-slate-500 text-xs space-y-1">
              <li>[L-MOUSE] Cast Bolt</li>
              <li>[SHIFT] Overload Mana</li>
              <li>[COMBO] Build Rating</li>
              <li>[ORBS] Restore Core</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;