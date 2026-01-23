
import { PHYSICS, COLORS, GAME_SETTINGS } from './Constants';
import { EnemyType } from '../types';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 24;
  public health: number = 100;
  public mana: number = 100;
  public lastShot: number = 0;
  public dashCooldown: number = 0;
  public chargeLevel: number = 0;
  public isCharging: boolean = false;
  private trail: {x: number, y: number, alpha: number}[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(_windZones: any, platforms: Platform[]) {
    // Movement
    this.vy += PHYSICS.GRAVITY;
    this.vx *= PHYSICS.AIR_RESISTANCE;
    this.vy *= PHYSICS.AIR_RESISTANCE;

    this.x += this.vx;
    this.y += this.vy;

    // Trail logic
    this.trail.unshift({ x: this.x, y: this.y, alpha: 0.5 });
    if (this.trail.length > 10) this.trail.pop();
    this.trail.forEach(t => t.alpha *= 0.9);

    // Platform collision
    platforms.forEach(p => {
      if (this.x + this.radius > p.x && this.x - this.radius < p.x + p.width) {
        if (this.y + this.radius > p.y && this.y - this.radius < p.y + p.height) {
          const fromTop = this.y < p.y;
          if (fromTop) {
            this.y = p.y - this.radius;
            this.vy *= -0.3;
          } else {
            this.y = p.y + p.height + this.radius;
            this.vy *= -0.3;
          }
        }
      }
    });

    // Bounds clamping
    if (this.y < this.radius) { this.y = this.radius; this.vy = 0; }
    if (this.y > window.innerHeight - this.radius) { 
      this.y = window.innerHeight - this.radius; 
      this.vy = 0; 
      this.takeDamage(0.15); 
    }
    if (this.x < this.radius) { this.x = this.radius; this.vx = 0; }
    if (this.x > window.innerWidth * 0.7) this.x = window.innerWidth * 0.7;

    // Charging & Resource management
    if (this.isCharging && this.mana > 1) {
      this.chargeLevel = Math.min(1, this.chargeLevel + PHYSICS.CHARGE_SPEED);
      this.mana -= 0.2;
    } else {
      this.chargeLevel = Math.max(0, this.chargeLevel - 0.05);
    }

    if (this.mana < 100) this.mana += PHYSICS.MANA_REGEN;
    if (this.dashCooldown > 0) this.dashCooldown -= 16.67;
  }

  public dash() {
    if (this.dashCooldown <= 0 && this.mana >= 25) {
      this.vx += PHYSICS.DASH_FORCE;
      this.dashCooldown = PHYSICS.DASH_COOLDOWN;
      this.mana -= 25;
      return true;
    }
    return false;
  }

  public takeDamage(amt: number) { this.health = Math.max(0, this.health - amt); }

  public tryShoot(callback: (x: number, y: number, tx: number, ty: number) => void, mouseX: number, mouseY: number) {
    const now = performance.now();
    if (now - this.lastShot > 180) {
      this.lastShot = now;
      callback(this.x, this.y, mouseX, mouseY);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw trail
    this.trail.forEach((t, i) => {
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = COLORS.PLAYER;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * (1 - i/10), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.translate(this.x, this.y);
    const tilt = Math.max(-0.5, Math.min(0.5, this.vy * 0.04));
    ctx.rotate(tilt);
    
    // Flight Body
    ctx.shadowBlur = 15 + (this.chargeLevel * 20);
    ctx.shadowColor = this.chargeLevel > 0.9 ? COLORS.PROJECTILE_CHARGE : COLORS.PLAYER;
    ctx.fillStyle = this.chargeLevel > 0.9 ? COLORS.PROJECTILE_CHARGE : COLORS.PLAYER;
    
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(-20, -20);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-20, 20);
    ctx.closePath();
    ctx.fill();

    // Core glow
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, 0, 6 + (this.chargeLevel * 4), 0, Math.PI*2); ctx.fill();

    // Charge indicators
    if (this.chargeLevel > 0) {
      ctx.strokeStyle = COLORS.PROJECTILE_CHARGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 40, -Math.PI/2, -Math.PI/2 + (this.chargeLevel * Math.PI * 2));
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

export class Enemy {
  public x: number;
  public y: number;
  public radius: number = 28;
  public health: number = 40;
  public type: EnemyType;
  public color: string;
  public shotTimer: number = 0;
  private animTimer: number = Math.random() * 1000;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = type === EnemyType.CONSTRUCT ? COLORS.ENEMY_CONSTRUCT : 
                 type === EnemyType.SORCERER ? COLORS.ENEMY_SORCERER : COLORS.ENEMY_SHADOW;
    this.shotTimer = Math.random() * 1000;
  }

  public update(player: Player, sm: number, dt: number) {
    this.shotTimer += dt;
    this.animTimer += 0.05;
    
    // Sinusoidal movement
    this.y += Math.sin(this.animTimer) * 2.5;
    
    if (this.type === EnemyType.SHADOW) {
        this.x -= 2.2 * sm;
        const dy = player.y - this.y;
        this.y += Math.sign(dy) * 1.2;
    } else if (this.type === EnemyType.SORCERER) {
        this.x -= 1.5 * sm;
    } else {
        this.x -= 1.8 * sm;
    }
  }

  public canShoot(sm: number) {
    const threshold = this.type === EnemyType.SORCERER ? 1500 : 3000;
    if (this.shotTimer > threshold / sm) {
        this.shotTimer = 0;
        return true;
    }
    return false;
  }

  public takeDamage(amt: number) { this.health -= amt; }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    
    ctx.beginPath();
    if (this.type === EnemyType.CONSTRUCT) {
      ctx.rect(-25, -25, 50, 50);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(-20, -20, 40, 40);
    } else if (this.type === EnemyType.SORCERER) {
      ctx.moveTo(-30, 0); ctx.lineTo(20, -25); ctx.lineTo(20, 25); ctx.closePath();
    } else {
      ctx.arc(0, 0, 30, 0, Math.PI*2);
    }
    ctx.fill();
    
    // Floating health bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-25, -45, 50, 6);
    ctx.fillStyle = '#ef4444';
    const maxH = this.type === EnemyType.SHADOW ? 60 : 40;
    ctx.fillRect(-25, -45, (Math.max(0, this.health)/maxH)*50, 6);
    ctx.restore();
  }
}

export class Platform {
  constructor(public x: number, public y: number, public width: number, public height: number) {}
}

export class MagicOrb {
  public radius: number = 15;
  constructor(public x: number, public y: number) {}
  public draw(ctx: CanvasRenderingContext2D) {
    const pulse = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillStyle = COLORS.ORB;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.ORB;
    ctx.beginPath(); ctx.arc(this.x, this.y, 14 + pulse, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
  }
}

export class HealthOrb {
  public radius: number = 15;
  constructor(public x: number, public y: number) {}
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = COLORS.HEALTH;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.HEALTH;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 10);
    ctx.bezierCurveTo(this.x, this.y, this.x - 15, this.y, this.x - 15, this.y + 10);
    ctx.bezierCurveTo(this.x - 15, this.y + 25, this.x, this.y + 35, this.x, this.y + 40);
    ctx.bezierCurveTo(this.x, this.y + 35, this.x + 15, this.y + 25, this.x + 15, this.y + 10);
    ctx.bezierCurveTo(this.x + 15, this.y, this.x, this.y, this.x, this.y + 10);
    ctx.fill();
  }
}
