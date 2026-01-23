
import { PHYSICS, GAME_SETTINGS, COLORS } from './Constants';
import { PlayerData, GameEngineOptions, Projectile, Particle, EnemyType, ScorePopup } from '../types';
import { Player, Enemy, Platform, MagicOrb, HealthOrb } from './Entities';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: GameEngineOptions;
  private running: boolean = false;
  private lastTick: number = 0;
  private accumulator: number = 0;

  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private platforms: Platform[] = [];
  private orbs: MagicOrb[] = [];
  private healthOrbs: HealthOrb[] = [];
  private particles: Particle[] = [];
  private popups: ScorePopup[] = [];
  
  private screenShake: number = 0;
  private speedLines: {x: number, y: number, length: number, speed: number}[] = [];

  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private lastEnemySpawn: number = 0;
  private distanceTraveled: number = 0;
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseDown: boolean = false;
  private isGameOver: boolean = false;
  private isVictory: boolean = false;

  private hostelSpawned: boolean = false;
  private hostelX: number = -2000;

  private spawnIndex: number = 0;
  private readonly spawnSequence: EnemyType[] = [
    EnemyType.CONSTRUCT, EnemyType.CONSTRUCT, EnemyType.SORCERER,
    EnemyType.SHADOW, EnemyType.SORCERER, EnemyType.SHADOW
  ];

  constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.options = options;
    this.setupListeners();
    this.reset();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    window.addEventListener('mousedown', () => (this.isMouseDown = true));
    window.addEventListener('mouseup', () => (this.isMouseDown = false));
  }

  public reset() {
    this.player = new Player(200, this.canvas.height / 2 || 300);
    this.enemies = [];
    this.projectiles = [];
    this.platforms = [];
    this.orbs = [];
    this.healthOrbs = [];
    this.particles = [];
    this.popups = [];
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastEnemySpawn = 0;
    this.distanceTraveled = 0;
    this.spawnIndex = 0;
    this.accumulator = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.hostelSpawned = false;
    this.screenShake = 0;
    this.speedLines = [];
    this.lastTick = performance.now();
    this.generateWorld(true);
  }

  private triggerShake(intensity: number) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  private generateWorld(initial: boolean) {
    const startX = initial ? 0 : this.canvas.width;
    for (let i = 0; i < 5; i++) {
      const px = startX + Math.random() * this.canvas.width + 400;
      const py = Math.random() * (this.canvas.height - 200) + 100;
      this.platforms.push(new Platform(px, py, 200 + Math.random() * 200, 30));
      if (Math.random() > 0.6) this.orbs.push(new MagicOrb(px + 50, py - 60));
    }
  }

  public start() {
    this.running = true;
    this.lastTick = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop() { this.running = false; }

  private loop(now: number) {
    if (!this.running) return;
    let dt = now - this.lastTick;
    if (dt > 100) dt = 16.67;
    this.lastTick = now;
    this.accumulator += dt;

    while (this.accumulator >= GAME_SETTINGS.TICK_RATE) {
      this.update(GAME_SETTINGS.TICK_RATE);
      this.accumulator -= GAME_SETTINGS.TICK_RATE;
      if (this.isGameOver || this.isVictory) break;
    }
    this.draw();
    if (this.running) requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    if (this.isGameOver || this.isVictory) return;
    const now = performance.now();
    this.handleInput();
    this.player.update([], this.platforms);

    if (this.screenShake > 0) this.screenShake *= 0.9;

    if (this.player.health <= 0) {
      this.isGameOver = true;
      this.triggerShake(30);
      this.options.onGameOver(this.score);
      return;
    }

    const progress = Math.min(1, this.distanceTraveled / GAME_SETTINGS.MISSION_TOTAL_DISTANCE);
    const speedMultiplier = 1 + progress + (this.score * GAME_SETTINGS.SCALING_FACTOR);
    const scrollSpeed = 5 * speedMultiplier;

    if (!this.hostelSpawned) {
      this.distanceTraveled += scrollSpeed;
      if (this.distanceTraveled >= GAME_SETTINGS.MISSION_TOTAL_DISTANCE) {
        this.hostelSpawned = true;
        this.hostelX = this.canvas.width + 500;
      }
    } else {
      this.hostelX -= scrollSpeed;
      if (this.hostelX < this.player.x + 100) {
        this.isVictory = true;
        this.options.onVictory(this.score);
      }
    }

    // Enemy Spawning
    if (!this.hostelSpawned && now - this.lastEnemySpawn > GAME_SETTINGS.ENEMY_SPAWN_INTERVAL / speedMultiplier) {
      const type = this.spawnSequence[this.spawnIndex];
      this.enemies.push(new Enemy(this.canvas.width + 100, Math.random() * (this.canvas.height - 200) + 100, type));
      this.spawnIndex = (this.spawnIndex + 1) % this.spawnSequence.length;
      this.lastEnemySpawn = now;
    }

    // Scroll Objects
    this.platforms.forEach(p => p.x -= scrollSpeed);
    this.orbs.forEach(o => o.x -= scrollSpeed);
    this.healthOrbs.forEach(h => h.x -= scrollSpeed);

    // Update Enemies & Contact Damage (Player only)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player, speedMultiplier, dt);
      enemy.x -= scrollSpeed * 0.2; // Enemies drift slower than world

      // Contact Damage: If player touches enemy flight
      if (this.checkCollision(this.player, enemy)) {
        // Continuous damage while touching
        this.player.takeDamage(0.5); 
        this.triggerShake(2);
        // Visual effect for contact
        if (Math.random() > 0.7) {
          this.createExplosion(this.player.x + (enemy.x - this.player.x)/2, this.player.y + (enemy.y - this.player.y)/2, COLORS.DANGER, 1);
        }
      }

      if (enemy.canShoot(speedMultiplier)) {
        this.shootProjectile(enemy.x, enemy.y, 0, 0, 'enemy', speedMultiplier);
      }
      if (enemy.x < -200) this.enemies.splice(i, 1);
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx; p.y += p.vy;
      
      let hit = false;
      if (p.owner === 'player') {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (this.checkCollision(p, e)) {
            e.takeDamage(p.damage);
            hit = true;
            if (e.health <= 0) this.killEnemy(e, j);
            break;
          }
        }
      } else {
        if (this.checkCollision(p, this.player)) {
          this.player.takeDamage(10);
          this.triggerShake(10);
          hit = true;
          this.resetCombo();
        }
      }

      if (hit || p.x < -100 || p.x > this.canvas.width + 100) this.projectiles.splice(i, 1);
    }

    // Collectibles
    this.orbs.forEach((o, i) => {
      if (this.checkCollision(o, this.player)) {
        this.player.mana = Math.min(100, this.player.mana + 25);
        this.addScore(200, o.x, o.y, COLORS.ORB);
        this.orbs.splice(i, 1);
      }
    });

    if (this.platforms.length < 5 && !this.hostelSpawned) this.generateWorld(false);

    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    });

    this.options.onUpdate({ 
      score: this.score, health: this.player.health, mana: this.player.mana, 
      combo: this.combo, multiplier: this.getMultiplier(), progress
    });
  }

  private handleInput() {
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.player.vy -= PHYSICS.LIFT_ACCEL;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.player.vy += PHYSICS.LIFT_ACCEL;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.player.vx -= PHYSICS.HORIZ_ACCEL;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.player.vx += PHYSICS.HORIZ_ACCEL;
    if (this.keys.has('Space')) this.player.dash();
    if (this.isMouseDown) {
      this.player.tryShoot((x,y,tx,ty) => this.shootProjectile(x,y,tx,ty,'player',1), this.mouseX, this.mouseY);
    }
  }

  private shootProjectile(x: number, y: number, tx: number, ty: number, owner: 'player' | 'enemy', sm: number) {
    let vx, vy;
    if (owner === 'player') {
      const angle = Math.atan2(ty - y, tx - x);
      vx = Math.cos(angle) * 20; vy = Math.sin(angle) * 20;
    } else {
      vx = -8 * sm; vy = 0;
    }
    this.projectiles.push({ x, y, vx, vy, radius: 8, damage: 10, owner, color: owner === 'player' ? COLORS.PROJECTILE_PLAYER : COLORS.PROJECTILE_ENEMY } as any);
  }

  private killEnemy(e: Enemy, i: number) {
    this.addScore(500 * this.getMultiplier(), e.x, e.y, e.color);
    this.combo++; this.createExplosion(e.x, e.y, e.color, 15);
    this.enemies.splice(i, 1);
  }

  private addScore(amt: number, x: number, y: number, color: string) {
    this.score += Math.floor(amt);
    this.popups.push({ x, y, text: `+${Math.floor(amt)}`, life: 40, color });
  }

  private getMultiplier() { return 1 + Math.floor(this.combo / 5) * 0.2; }
  private resetCombo() { this.combo = 0; }
  private checkCollision(a: any, b: any) {
    const dist = Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
    return dist < (a.radius || 20) + (b.radius || 20);
  }
  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 30, maxLife: 30, color, size: 2+Math.random()*4 });
    }
  }

  private draw() {
    this.ctx.save();
    if (this.screenShake > 0.1) this.ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    
    // BG
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Platforms
    this.platforms.forEach(p => {
      this.ctx.fillStyle = COLORS.PLATFORM;
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    if (this.hostelSpawned) {
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(this.hostelX, this.canvas.height - 600, 1000, 600);
      this.ctx.fillStyle = COLORS.PLAYER;
      this.ctx.font = 'bold 40px sans-serif';
      this.ctx.fillText('POTHIGAI BOYS HOSTEL', this.hostelX + 50, this.canvas.height - 500);
    }

    this.orbs.forEach(o => o.draw(this.ctx));
    this.projectiles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); this.ctx.fill();
    });

    this.enemies.forEach(e => e.draw(this.ctx));
    this.player.draw(this.ctx);

    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    this.popups.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / 40;
      this.ctx.fillText(p.text, p.x, p.y);
      p.life--;
    });
    
    this.ctx.restore();
  }
}
