
import { PHYSICS, COLORS, GAME_SETTINGS } from './Constants';
import { EnemyType } from '../types';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 22;
  public health: number = 100;
  public mana: number = 100;
  public lastShot: number = 0;
  public dashCooldown: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(_windZones: any, platforms: Platform[]) {
    this.vy += PHYSICS.GRAVITY;
    this.vx *= PHYSICS.AIR_RESISTANCE;
    this.vy *= PHYSICS.AIR_RESISTANCE;

    this.x += this.vx;
    this.y += this.vy;

    // Platform collision
    platforms.forEach(p => {
      if (this.x > p.x && this.x < p.x + p.width && this.y + this.radius > p.y && this.y < p.y + p.height) {
        this.y = p.y - this.radius;
        this.vy *= -0.2;
      }
    });

    // Bounds
    if (this.y < this.radius) { this.y = this.radius; this.vy = 0; }
    if (this.y > window.innerHeight - this.radius) { this.y = window.innerHeight - this.radius; this.vy = 0; this.health -= 0.1; }
    if (this.x < this.radius) { this.x = this.radius; this.vx = 0; }
    if (this.x > window.innerWidth * 0.6) this.x = window.innerWidth * 0.6;

    if (this.mana < 100) this.mana += PHYSICS.MANA_REGEN;
    if (this.dashCooldown > 0) this.dashCooldown -= 16.67;
  }

  public dash() {
    if (this.dashCooldown <= 0 && this.mana >= 20) {
      this.vx += PHYSICS.DASH_FORCE;
      this.dashCooldown = PHYSICS.DASH_COOLDOWN;
      this.mana -= 20;
    }
  }

  public takeDamage(amt: number) { this.health -= amt; }
  public tryShoot(cb: any, tx: number, ty: number) {
    const now = performance.now();
    if (now - this.lastShot > 150 && this.mana > 5) {
      cb(this.x, this.y, tx, ty);
      this.lastShot = now;
      this.mana -= 3;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const tilt = this.vy * 0.05;
    ctx.rotate(tilt);
    
    ctx.fillStyle = COLORS.PLAYER;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.PLAYER;
    
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-20, -15);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-20, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

export class Enemy {
  public x: number;
  public y: number;
  public radius: number = 25;
  public health: number = 30;
  public type: EnemyType;
  public color: string;
  public shotTimer: number = 0;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = type === EnemyType.CONSTRUCT ? COLORS.ENEMY_CONSTRUCT : COLORS.ENEMY_SORCERER;
    this.shotTimer = Math.random() * 1000;
  }

  public update(player: Player, sm: number, dt: number) {
    this.shotTimer += dt;
    this.y += Math.sin(Date.now() * 0.003) * 2;
    if (this.type === EnemyType.SHADOW) {
        this.x -= 2 * sm;
        const dy = player.y - this.y;
        this.y += Math.sign(dy) * 1.5;
    }
  }

  public canShoot(sm: number) {
    if (this.shotTimer > 2000 / sm) {
        this.shotTimer = 0;
        return true;
    }
    return false;
  }

  public takeDamage(amt: number) { this.health -= amt; }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    if (this.type === EnemyType.CONSTRUCT) {
      ctx.rect(-20, -20, 40, 40);
    } else {
      ctx.moveTo(-25, 0); ctx.lineTo(15, -20); ctx.lineTo(15, 20);
    }
    ctx.fill();
    
    // Health bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-20, -35, 40, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-20, -35, (this.health/30)*40, 5);
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
    ctx.fillStyle = COLORS.ORB;
    ctx.beginPath(); ctx.arc(this.x, this.y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI*2); ctx.fill();
  }
}

export class HealthOrb {
  public radius: number = 15;
  constructor(public x: number, public y: number) {}
}
