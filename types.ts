
export type GameState = 'menu' | 'playing' | 'gameover';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface PlayerData {
  score: number;
  health: number;
  mana: number;
  combo: number;
  multiplier: number;
}

export interface GameEngineOptions {
  onUpdate: (data: PlayerData) => void;
  onGameOver: (score: number) => void;
}

export enum EnemyType {
  CONSTRUCT = 'construct',
  SORCERER = 'sorcerer',
  SHADOW = 'shadow'
}

export interface Projectile extends Entity {
  damage: number;
  owner: 'player' | 'enemy';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}
