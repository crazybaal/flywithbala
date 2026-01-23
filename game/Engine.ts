
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
  private rain: {x: number, y: number, len: number, s: number}[] = [];
  private parallaxLayers: {x: number, y: number, speed: number, size: number, color: string}[] = [];
  private lightning: number = 0;

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
    EnemyType.CONSTRUCT, EnemyType.SORCERER, EnemyType.CONSTRUCT,
    EnemyType.SHADOW, EnemyType.SORCERER, EnemyType.SHADOW
  ];

  constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.options = options;
    this.setupListeners();
    this.initParallax();
    this.reset();
  }

  private initParallax() {
    for (let i = 0; i < 40; i++) {
      this.parallaxLayers.push({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        speed: 0.1 + Math.random() * 0.4,
        size: 2 + Math.random() * 50,
        color: COLORS.PARALLAX_2
      });
    }
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    window.addEventListener('mousedown', () => (this.isMouseDown = true));
    window.addEventListener('mouseup', () => {
      if (this.isMouseDown && this.player.chargeLevel >= 0.9) {
        this.fireChargeShot();
      }
      this.isMouseDown = false;
    });
  }

  public reset() {
    this.player = new Player(250, this.canvas.height / 2 || 350);
    this.enemies = [];
    this.projectiles = [];
    this.platforms = [];
    this.orbs = [];
    this.healthOrbs = [];
    this.particles = [];
    this.popups = [];
    this.rain = [];
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
    this.lastTick = performance.now();
    this.generateWorld(true);
    
    for (let i = 0; i < 100; i++) {
        this.rain.push({ x: Math.random() * 2000, y: Math.random() * 1000, len: 10 + Math.random() * 20, s: 15 + Math.random() * 10 });
    }
  }

  private fireChargeShot() {
    const angle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);
    const vx = Math.cos(angle) * 35;
    const vy = Math.sin(angle) * 35;
    this.projectiles.push({ 
        x: this.player.x, y: this.player.y, vx, vy, radius: 25, 
        damage: 150, owner: 'player', color: COLORS.PROJECTILE_CHARGE, 
        width: 50, height: 50 
    });
    this.player.chargeLevel = 0;
    this.triggerShake(20);
  }

  private triggerShake(intensity: number) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  private generateWorld(initial: boolean) {
    const startX = initial ? 0 : this.canvas.width;
    for (let i = 0; i < 6; i++) {
      const px = startX + Math.random() * this.canvas.width + 600;
      const py = Math.random() * (this.canvas.height - 300) + 150;
      this.platforms.push(new Platform(px, py, 250 + Math.random() * 300, 40));
      if (Math.random() > 0.55) this.orbs.push(new MagicOrb(px + 100, py - 80));
      if (Math.random() > 0.85) this.healthOrbs.push(new HealthOrb(px + 150, py - 120));
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
    if (this.lightning > 0) this.lightning -= 0.1;

    if (this.player.health <= 0) {
      this.isGameOver = true;
      this.triggerShake(40);
      this.options.onGameOver(this.score);
      return;
    }

    const progress = Math.min(1, this.distanceTraveled / GAME_SETTINGS.MISSION_TOTAL_DISTANCE);
    const speedMultiplier = 1 + progress * 1.5 + (this.score * GAME_SETTINGS.SCALING_FACTOR);
    const scrollSpeed = (6 + (this.score * 0.0001)) * speedMultiplier;

    this.parallaxLayers.forEach(l => {
        l.x -= scrollSpeed * l.speed;
        if (l.x < -200) l.x = this.canvas.width + 200;
    });

    this.rain.forEach(r => {
        r.y += r.s;
        r.x -= scrollSpeed + (this.player.vx * 0.1);
        if (r.y > this.canvas.height) { r.y = -20; r.x = Math.random() * this.canvas.width + 500; }
        if (r.x < -50) r.x = this.canvas.width + 50;
    });

    if (Math.random() < 0.002) this.lightning = 1.0;

    if (!this.hostelSpawned) {
      this.distanceTraveled += scrollSpeed;
      if (this.distanceTraveled >= GAME_SETTINGS.MISSION_TOTAL_DISTANCE) {
        this.hostelSpawned = true;
        this.hostelX = this.canvas.width + 800;
      }
    } else {
      this.hostelX -= scrollSpeed;
      if (this.hostelX < this.player.x + 150) {
        this.isVictory = true;
        this.options.onVictory(this.score);
      }
    }

    if (!this.hostelSpawned && now - this.lastEnemySpawn > GAME_SETTINGS.ENEMY_SPAWN_INTERVAL / speedMultiplier) {
      const type = this.spawnSequence[this.spawnIndex];
      this.enemies.push(new Enemy(this.canvas.width + 200, Math.random() * (this.canvas.height - 300) + 150, type));
      this.spawnIndex = (this.spawnIndex + 1) % this.spawnSequence.length;
      this.lastEnemySpawn = now;
    }

    this.platforms.forEach(p => p.x -= scrollSpeed);
    this.orbs.forEach(o => o.x -= scrollSpeed);
    this.healthOrbs.forEach(h => h.x -= scrollSpeed);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player, speedMultiplier, dt);
      enemy.x -= scrollSpeed * 0.15;

      if (this.checkCollision(this.player, enemy)) {
        this.player.takeDamage(0.8); 
        this.triggerShake(3);
        if (Math.random() > 0.8) this.createExplosion(this.player.x, this.player.y, COLORS.DANGER, 2);
      }

      if (enemy.canShoot(speedMultiplier)) {
        this.shootProjectile(enemy.x, enemy.y, 0, 0, 'enemy', speedMultiplier);
      }
      if (enemy.x < -300) this.enemies.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx; p.y += p.vy;
      
      let hit = false;
      if (p.owner === 'player') {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (this.checkCollision(p, e)) {
            e.takeDamage(p.damage);
            if (p.color !== COLORS.PROJECTILE_CHARGE) hit = true; 
            if (e.health <= 0) this.killEnemy(e, j);
            break;
          }
        }
      } else {
        if (this.checkCollision(p, this.player)) {
          this.player.takeDamage(12);
          this.triggerShake(12);
          hit = true;
          this.resetCombo();
        }
      }

      if (hit || p.x < -200 || p.x > this.canvas.width + 400) this.projectiles.splice(i, 1);
    }

    this.orbs.forEach((o, i) => {
      if (this.checkCollision(o, this.player)) {
        this.player.mana = Math.min(100, this.player.mana + 35);
        this.addScore(400, o.x, o.y, COLORS.ORB);
        this.orbs.splice(i, 1);
        this.createExplosion(o.x, o.y, COLORS.ORB, 8);
      }
    });

    this.healthOrbs.forEach((h, i) => {
      if (this.checkCollision(h, this.player)) {
        this.player.health = Math.min(100, this.player.health + 20);
        this.addScore(800, h.x, h.y, COLORS.HEALTH);
        this.healthOrbs.splice(i, 1);
        this.createExplosion(h.x, h.y, COLORS.HEALTH, 12);
      }
    });

    if (this.platforms.length < 8 && !this.hostelSpawned) this.generateWorld(false);

    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    });

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.resetCombo();
    }

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
    if (this.keys.has('ShiftLeft')) {
        this.player.vx += PHYSICS.HORIZ_ACCEL * 1.5;
        this.player.mana -= PHYSICS.MANA_BOOST_COST;
    }
    if (this.keys.has('Space')) {
        if (this.player.dash()) this.triggerShake(10);
    }
    
    this.player.isCharging = this.isMouseDown && this.player.mana > 12;
    
    if (this.isMouseDown && !this.player.isCharging) {
      this.player.tryShoot((x,y,tx,ty) => this.shootProjectile(x,y,tx,ty,'player',1), this.mouseX, this.mouseY);
    }
  }

  private shootProjectile(x: number, y: number, tx: number, ty: number, owner: 'player' | 'enemy', sm: number) {
    let vx, vy;
    if (owner === 'player') {
      const angle = Math.atan2(ty - y, tx - x);
      vx = Math.cos(angle) * 25; vy = Math.sin(angle) * 25;
    } else {
      vx = -12 * sm; vy = 0;
    }
    this.projectiles.push({ 
        x, y, vx, vy, radius: 10, damage: 15, owner, 
        color: owner === 'player' ? COLORS.PROJECTILE_PLAYER : COLORS.PROJECTILE_ENEMY,
        width: 20, height: 20
    });
  }

  private killEnemy(e: Enemy, i: number) {
    const pts = (e.type === EnemyType.SHADOW ? 1200 : 600) * this.getMultiplier();
    this.addScore(pts, e.x, e.y, e.color);
    this.combo++; this.comboTimer = 2500;
    this.triggerShake(15);
    this.createExplosion(e.x, e.y, e.color, 20);
    this.enemies.splice(i, 1);
  }

  private addScore(amt: number, x: number, y: number, color: string) {
    this.score += Math.floor(amt);
    this.popups.push({ x, y: y - 20, text: `+${Math.floor(amt)}`, life: 50, color });
  }

  private getMultiplier() { return 1 + Math.floor(this.combo / 5) * 0.4; }
  private resetCombo() { this.combo = 0; }
  private checkCollision(a: any, b: any) {
    const dist = Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
    return dist < (a.radius || 24) + (b.radius || 28);
  }
  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ 
        x, y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, 
        life: 40, maxLife: 40, color, size: 2+Math.random()*6 
      });
    }
  }

  private draw() {
    this.ctx.save();
    if (this.screenShake > 0.1) this.ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    
    // Distant Background
    this.ctx.fillStyle = COLORS.PARALLAX_1;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.lightning > 0.1) {
        this.ctx.fillStyle = `rgba(255,255,255,${this.lightning * 0.15})`;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }

    // Parallax silhuettes
    this.parallaxLayers.forEach(l => {
      this.ctx.fillStyle = l.color;
      this.ctx.beginPath();
      this.ctx.arc(l.x, l.y, l.size, 0, Math.PI*2);
      this.ctx.fill();
    });

    // Platforms
    this.platforms.forEach(p => {
      this.ctx.fillStyle = COLORS.PLATFORM;
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
      this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      this.ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    if (this.hostelSpawned) {
      this.ctx.save();
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(this.hostelX, this.canvas.height - 700, 1200, 700);
      this.ctx.fillStyle = COLORS.PLAYER;
      this.ctx.shadowBlur = 40;
      this.ctx.shadowColor = COLORS.PLAYER;
      this.ctx.font = '900 60px Inter'; // Fixed weight from 'black' to '900'
      this.ctx.fillText('POTHIGAI BOYS HOSTEL', this.hostelX + 100, this.canvas.height - 550);
      this.ctx.restore();
    }

    this.orbs.forEach(o => o.draw(this.ctx));
    this.healthOrbs.forEach(h => h.draw(this.ctx));
    
    this.projectiles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); this.ctx.fill();
    });

    this.enemies.forEach(e => e.draw(this.ctx));
    this.player.draw(this.ctx);

    // Weather: Rain
    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    this.ctx.lineWidth = 1;
    this.rain.forEach(r => {
        this.ctx.beginPath();
        this.ctx.moveTo(r.x, r.y);
        this.ctx.lineTo(r.x - 5, r.y + r.len);
        this.ctx.stroke();
    });

    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    this.popups.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / 50;
      this.ctx.font = 'bold 20px monospace';
      this.ctx.fillText(p.text, p.x, p.y);
      p.life--;
    });
    
    this.ctx.restore();
  }
}
