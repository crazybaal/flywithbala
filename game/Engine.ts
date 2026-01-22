
import { PHYSICS, GAME_SETTINGS, COLORS } from './Constants';
import { PlayerData, GameEngineOptions, Projectile, Particle, EnemyType, ScorePopup } from '../types';
import { Player, Enemy, Platform, WindZone, MagicOrb } from './Entities';

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
  private windZones: WindZone[] = [];
  private orbs: MagicOrb[] = [];
  private particles: Particle[] = [];
  private popups: ScorePopup[] = [];

  private score: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private lastEnemySpawn: number = 0;
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseDown: boolean = false;

  // Orderly Spawning System
  private spawnIndex: number = 0;
  private readonly spawnSequence: EnemyType[] = [
    EnemyType.CONSTRUCT,
    EnemyType.CONSTRUCT,
    EnemyType.SORCERER,
    EnemyType.CONSTRUCT,
    EnemyType.SORCERER,
    EnemyType.SHADOW,
    EnemyType.CONSTRUCT,
    EnemyType.SORCERER,
    EnemyType.SHADOW,
    EnemyType.SHADOW
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
    this.player = new Player(150, this.canvas.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.platforms = [];
    this.windZones = [];
    this.orbs = [];
    this.particles = [];
    this.popups = [];
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastEnemySpawn = 0;
    this.spawnIndex = 0;
    this.accumulator = 0;
    this.lastTick = performance.now();
    this.generateWorld(true);
  }

  private generateWorld(initial: boolean) {
    const startX = initial ? 0 : this.canvas.width;
    for (let i = 0; i < 6; i++) {
      const px = startX + Math.random() * this.canvas.width + 500;
      const py = Math.random() * (this.canvas.height - 250) + 125;
      this.platforms.push(new Platform(px, py, 120 + Math.random() * 180, 25));
      if (Math.random() > 0.4) this.orbs.push(new MagicOrb(px + 40, py - 60));
      if (Math.random() > 0.75) this.windZones.push(new WindZone(px, py - 350, 400, 300, Math.random() > 0.5 ? 0.3 : -0.3));
    }
  }

  public start() {
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop() { this.running = false; }

  private loop(now: number) {
    if (!this.running) return;
    const dt = now - this.lastTick;
    this.lastTick = now;
    this.accumulator += dt;
    while (this.accumulator >= GAME_SETTINGS.TICK_RATE) {
      this.update(GAME_SETTINGS.TICK_RATE);
      this.accumulator -= GAME_SETTINGS.TICK_RATE;
    }
    this.draw();
    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    this.handleInput();
    this.player.update(this.windZones, this.platforms);

    const now = performance.now();
    const speedMultiplier = 1 + (this.score * GAME_SETTINGS.SCALING_FACTOR);
    
    const spawnRate = GAME_SETTINGS.ENEMY_SPAWN_INTERVAL / (1 + this.score * 0.00005);
    if (now - this.lastEnemySpawn > spawnRate) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    this.enemies.forEach((enemy, index) => {
      enemy.update(this.player, speedMultiplier, dt);
      
      // Orderly, deterministic shooting intervals
      if (enemy.canShoot(speedMultiplier)) {
        this.shootProjectile(enemy.x, enemy.y, 0, 0, 'enemy', speedMultiplier);
      }
      
      const dist = this.getDistance(this.player, enemy);
      if (dist < 80 && dist > 40) {
        this.addScore(1, this.player.x, this.player.y - 40, '#94a3b8');
      }
      if (enemy.x < -150) this.enemies.splice(index, 1);
    });

    this.projectiles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.owner === 'player') {
        this.enemies.forEach((enemy, eIdx) => {
          if (this.checkCollision(p, enemy)) {
            enemy.takeDamage(p.damage);
            this.projectiles.splice(index, 1);
            if (enemy.health <= 0) this.killEnemy(enemy, eIdx);
          }
        });
      } else {
        if (this.checkCollision(p, this.player)) {
          this.player.takeDamage(p.damage);
          this.projectiles.splice(index, 1);
          this.resetCombo();
        }
      }
      if (p.x < -100 || p.x > this.canvas.width + 100 || p.y < -100 || p.y > this.canvas.height + 100) {
        this.projectiles.splice(index, 1);
      }
    });

    this.orbs.forEach((orb, index) => {
      if (this.checkCollision(orb, this.player)) {
        this.player.mana = Math.min(100, this.player.mana + 25);
        this.addScore(250, orb.x, orb.y, COLORS.ORB);
        this.orbs.splice(index, 1);
        this.createExplosion(orb.x, orb.y, COLORS.ORB, 8);
      }
    });

    this.particles.forEach((p, index) => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) this.particles.splice(index, 1);
    });

    this.popups.forEach((popup, index) => {
      popup.y -= 1; popup.life -= 1;
      if (popup.life <= 0) this.popups.splice(index, 1);
    });

    const scrollSpeed = (2.5 + (this.score * 0.0003)) * speedMultiplier;
    this.platforms.forEach(p => p.x -= scrollSpeed);
    this.windZones.forEach(w => w.x -= scrollSpeed);
    this.orbs.forEach(o => o.x -= scrollSpeed);
    this.enemies.forEach(e => e.x -= scrollSpeed * 0.15); 

    this.platforms = this.platforms.filter(p => p.x + p.width > -200);
    this.windZones = this.windZones.filter(w => w.x + w.width > -200);
    this.orbs = this.orbs.filter(o => o.x + 50 > -200);

    if (this.platforms.length < 6) this.generateWorld(false);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.resetCombo();
    }

    this.options.onUpdate({
      score: this.score,
      health: this.player.health,
      mana: this.player.mana,
      combo: this.combo,
      multiplier: this.getMultiplier()
    });
  }

  private handleInput() {
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.player.applyLift();
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.player.applyGravityForce();
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.player.applyHorizontal(-PHYSICS.HORIZ_ACCEL);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.player.applyHorizontal(PHYSICS.HORIZ_ACCEL);
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) this.player.applyManaBoost();
    if (this.keys.has('KeyH')) this.player.toggleHover();
    if (this.keys.has('Space')) this.player.dash();
    if (this.isMouseDown) {
      const speedMultiplier = 1 + (this.score * GAME_SETTINGS.SCALING_FACTOR);
      this.player.tryShoot((x, y, tx, ty) => this.shootProjectile(x, y, tx, ty, 'player', speedMultiplier), this.mouseX, this.mouseY);
    }
  }

  private spawnEnemy() {
    const y = Math.random() * (this.canvas.height - 150) + 75;
    const x = this.canvas.width + 150;
    const type = this.spawnSequence[this.spawnIndex];
    this.enemies.push(new Enemy(x, y, type));
    this.spawnIndex = (this.spawnIndex + 1) % this.spawnSequence.length;
  }

  private shootProjectile(x: number, y: number, tx: number, ty: number, owner: 'player' | 'enemy', speedMultiplier: number) {
    let vx, vy;
    if (owner === 'player') {
      const angle = Math.atan2(ty - y, tx - x);
      const speed = 22 * Math.min(1.5, speedMultiplier);
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else {
      // Enemy projectiles now travel in a straight line to the left
      const speed = 6 * Math.min(1.5, speedMultiplier);
      vx = -speed;
      vy = 0;
    }

    this.projectiles.push({
      x, y, vx, vy,
      width: 12, height: 12, radius: 6, damage: 10, owner,
      color: owner === 'player' ? COLORS.PROJECTILE_PLAYER : COLORS.PROJECTILE_ENEMY
    });
  }

  private killEnemy(enemy: Enemy, index: number) {
    const points = 500 * this.getMultiplier();
    this.addScore(points, enemy.x, enemy.y, enemy.color);
    this.combo++;
    this.comboTimer = 2500; 
    this.createExplosion(enemy.x, enemy.y, enemy.color, 20);
    this.enemies.splice(index, 1);
  }

  private addScore(amount: number, x: number, y: number, color: string) {
    this.score += Math.floor(amount);
    this.popups.push({ x, y, text: `+${Math.floor(amount)}`, life: 40, color });
  }

  private resetCombo() { this.combo = 0; this.comboTimer = 0; }
  private getMultiplier() { return 1 + Math.floor(this.combo / 4) * 0.5; }

  private getDistance(a: any, b: any) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private checkCollision(a: any, b: any) {
    const dist = this.getDistance(a, b);
    const r1 = a.radius || (a.width ? a.width / 2 : 10);
    const r2 = b.radius || (b.width ? b.width / 2 : 10);
    return dist < (r1 + r2);
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
        life: 25 + Math.random() * 25, maxLife: 50, color, size: 3 + Math.random() * 5
      });
    }
  }

  private draw() {
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.windZones.forEach(w => {
      this.ctx.fillStyle = COLORS.WIND;
      this.ctx.fillRect(w.x, w.y, w.width, w.height);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const lineY = w.y + (performance.now() * 0.2 + i * 50) % w.height;
        this.ctx.beginPath();
        this.ctx.moveTo(w.x, lineY);
        this.ctx.lineTo(w.x + w.width, lineY);
        this.ctx.stroke();
      }
    });

    this.platforms.forEach(p => {
      this.ctx.fillStyle = COLORS.PLATFORM;
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    this.orbs.forEach(o => {
      this.ctx.fillStyle = COLORS.ORB;
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.projectiles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.enemies.forEach(e => e.draw(this.ctx));
    this.player.draw(this.ctx);

    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.popups.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / 40;
      this.ctx.fillText(p.text, p.x, p.y);
    });
    this.ctx.globalAlpha = 1;
  }
}
