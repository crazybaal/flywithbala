
export const PHYSICS = {
  GRAVITY: 0.20,           
  AIR_RESISTANCE: 0.95,    
  LIFT_ACCEL: 0.9,         
  HORIZ_ACCEL: 0.7,        
  MAX_SPEED: 25,           
  BOOST_MULTIPLIER: 2.0,   
  DASH_FORCE: 28,          
  DASH_COOLDOWN: 900,      
  HOVER_COST: 0.7,         
  MANA_BOOST_COST: 0.4,    
  MANA_REGEN: 0.22,        
};

export const GAME_SETTINGS = {
  TARGET_FPS: 60,
  TICK_RATE: 1000 / 60,
  INITIAL_HEALTH: 100,
  INITIAL_MANA: 100,
  ENEMY_SPAWN_INTERVAL: 3200, // Starts significantly slower for a calm entry
  SCALING_FACTOR: 0.00004,    // Half as fast as before for very gradual difficulty ramp
};

export const COLORS = {
  PLAYER: '#38bdf8',
  ENEMY_CONSTRUCT: '#f87171',
  ENEMY_SORCERER: '#c084fc',
  ENEMY_SHADOW: '#475569',
  PROJECTILE_PLAYER: '#7dd3fc',
  PROJECTILE_ENEMY: '#fb7185',
  ORB: '#fbbf24',
  WIND: 'rgba(255, 255, 255, 0.05)',
  DANGER: '#ef4444',
  MANA: '#60a5fa',
  PLATFORM: '#334155'
};
