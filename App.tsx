
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/Engine';
import { GameState } from './types';
import HUD from './components/HUD';
import Menu from './components/Menu';
import GameOver from './components/GameOver';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [combo, setCombo] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const gameStateRef = useRef<GameState>('menu');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const onGameOver = useCallback((finalScore: number) => {
    if (gameStateRef.current === 'gameover') return;
    
    setGameState('gameover');
    setScore(finalScore);
    setHighScore(prev => Math.max(prev, finalScore));
    
    if (engineRef.current) {
      engineRef.current.stop();
    }
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setHealth(100);
    setMana(100);
    setCombo(0);
    setMultiplier(1);
    
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.start();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. First set dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 2. Then initialize engine
    if (!engineRef.current) {
      engineRef.current = new GameEngine(canvas, {
        onUpdate: (data) => {
          if (gameStateRef.current !== 'playing') return;
          setScore(data.score);
          setHealth(data.health);
          setMana(data.mana);
          setCombo(data.combo);
          setMultiplier(data.multiplier);
          if (data.health <= 0) onGameOver(data.score);
        },
        onGameOver
      });
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      engineRef.current?.stop();
    };
  }, [onGameOver]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none text-white">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {gameState === 'playing' && (
        <HUD score={score} health={health} mana={mana} combo={combo} multiplier={multiplier} />
      )}

      {gameState === 'menu' && (
        <Menu onStart={startGame} highScore={highScore} />
      )}

      {gameState === 'gameover' && (
        <GameOver score={score} highScore={highScore} onRestart={startGame} />
      )}

      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 opacity-40 pointer-events-none hidden md:block uppercase tracking-widest">
        WASD: Move • SPACE: Dash • SHIFT: Boost • H: Hover • CLICK: Spell
      </div>
    </div>
  );
};

export default App;
