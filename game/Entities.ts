
import { PHYSICS, COLORS, GAME_SETTINGS } from './Constants';
import { EnemyType } from '../types';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 20;
  public health: number = 100;
  public mana: number = 100;
  public isHovering: boolean = false;
  public dashCooldown: number = 0;
  public lastShot: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(windZones: WindZone[], platforms: Platform[]) {
    if (!this.isHovering) {
      this.vy += PHYSICS.GRAVITY;
    } else {
      this.mana -= PHYSICS.HOVER_COST;
      if (this.mana <= 0) this.isHovering = false;
      this.vy *= 0.85;
      this.vx *= 0.85;
    }

    windZones.forEach(w => {
      if (this.x > w.x && this.x < w.x + w.width && this.y > w.y && this.y < w.y + w.height) {
        this.vy += w.force * 2;
      }
    });

    this.vx *= PHYSICS.AIR_RESISTANCE;
    this.vy *= PHYSICS.AIR_RESISTANCE;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > PHYSICS.MAX_SPEED) {
      const ratio = PHYSICS.MAX_SPEED / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    this.x += this.vx;
    this.y += this.vy;

    platforms.forEach(p => {
      if (this.x + this.radius > p.x && this.x - this.radius < p.x + p.width) {
        if (this.y + this.radius > p.y && this.y - this.radius < p.y + p.height) {
          const fromTop = this.y < p.y;
          if (fromTop) {
            this.y = p.y - this.radius;
            this.vy = -Math.abs(this.vy) * 0.3;
          } else {
            this.y = p.y + p.height + this.radius;
            this.vy = Math.abs(this.vy) * 0.3;
          }
        }
      }
    });

    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = 0;
    }
    if (this.y > window.innerHeight - this.radius) {
      this.y = window.innerHeight - this.radius;
      this.vy = 0;
      this.takeDamage(0.2); 
    }
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = 0;
    }
    if (this.x > window.innerWidth * 0.7) { 
      this.x = window.innerWidth * 0.7;
      this.vx *= 0.8;
    }

    if (this.mana < 100) this.mana += PHYSICS.MANA_REGEN;
    if (this.dashCooldown > 0) this.dashCooldown -= 16.67;
  }

  public applyLift() { this.vy -= PHYSICS.LIFT_ACCEL; }
  public applyGravityForce() { this.vy += PHYSICS.LIFT_ACCEL; }
  public applyHorizontal(accel: number) { this.vx += accel; }

  public applyManaBoost() {
    if (this.mana > 5) {
      this.vx += PHYSICS.HORIZ_ACCEL * PHYSICS.BOOST_MULTIPLIER;
      this.mana -= PHYSICS.MANA_BOOST_COST;
    }
  }

  public toggleHover() {
    if (this.mana > 10) this.isHovering = !this.isHovering;
  }

  public dash() {
    if (this.dashCooldown <= 0 && this.mana >= 20) {
      this.vx += PHYSICS.DASH_FORCE;
      this.vy *= 0.2; 
      this.dashCooldown = PHYSICS.DASH_COOLDOWN;
      this.mana -= 20;
    }
  }

  public takeDamage(amt: number) { this.health -= amt; }
  public heal(amt: number) { this.health = Math.min(100, this.health + amt); }

  public tryShoot(callback: (x: number, y: number, tx: number, ty: number) => void, tx: number, ty: number) {
    const now = performance.now();
    if (now - this.lastShot > 120 && this.mana > 3) {
      callback(this.x, this.y, tx, ty);
      this.lastShot = now;
      this.mana -= 1.2;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const tilt = Math.max(-0.4, Math.min(0.4, this.vx * 0.05));
    ctx.rotate(tilt);
    ctx.shadowBlur = 15 + Math.abs(this.vx);
    ctx.shadowColor = COLORS.PLAYER;
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(20, 20);
    ctx.lineTo(-20, 20);
    ctx.closePath();
    ctx.fill();
    if (this.dashCooldown > PHYSICS.DASH_COOLDOWN - 200) {
       ctx.strokeStyle = 'white';
       ctx.lineWidth = 4;
       ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, -15, 8, 0, Math.PI * 2);
    ctx.fill();
    if (this.isHovering) {
       ctx.strokeStyle = COLORS.MANA;
       ctx.lineWidth = 3;
       ctx.setLineDash([5, 5]);
       ctx.beginPath();
       ctx.arc(0, 0, 32, 0, Math.PI * 2);
       ctx.stroke();
    }
    ctx.restore();
  }
}

export class Enemy {
  public x: number;
  public y: number;
  public radius: number = 20;
  public health: number = 30;
  public type: EnemyType;
  public width: number = 40;
  public height: number = 40;
  public color: string;
  private timer: number = 0;
  public shotTimer: number = 0;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = type === EnemyType.CONSTRUCT ? COLORS.ENEMY_CONSTRUCT : 
                 type === EnemyType.SORCERER ? COLORS.ENEMY_SORCERER : COLORS.ENEMY_SHADOW;
    if (type === EnemyType.SHADOW) this.health = 50;
    this.shotTimer = Math.random() * 1000;
  }

  public update(player: Player, speedMultiplier: number, dt: number) {
    this.timer += 0.05;
    this.shotTimer += dt;
    
    switch (this.type) {
      case EnemyType.CONSTRUCT:
        this.y += Math.sin(this.timer) * 2.5;
        this.x -= 1.5 * speedMultiplier;
        break;
      case EnemyType.SORCERER:
        this.y += Math.sin(this.timer * 0.5) * 5;
        this.x -= 1.2 * speedMultiplier;
        break;
      case EnemyType.SHADOW:
        const dy = player.y - this.y;
        this.y += Math.sign(dy) * 1.0 * speedMultiplier;
        this.x -= 0.8 * speedMultiplier;
        break;
    }
  }

  public canShoot(speedMultiplier: number): boolean {
    if (this.type !== EnemyType.SORCERER) return false;
    const interval = 2500 / speedMultiplier;
    if (this.shotTimer >= interval) {
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
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    if (this.type === EnemyType.CONSTRUCT) {
      ctx.fillRect(-20, -20, 40, 40);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -15, 30, 30);
    } else if (this.type === EnemyType.SORCERER) {
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(20, 20);
      ctx.lineTo(-20, 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-20, -35, 40, 5);
    ctx.fillStyle = '#ef4444';
    const maxH = this.type === EnemyType.SHADOW ? 50 : 30;
    ctx.fillRect(-20, -35, (Math.max(0, this.health) / maxH) * 40, 5);
    ctx.restore();
  }
}

export class Platform {
  constructor(public x: number, public y: number, public width: number, public height: number) {}
}

export class WindZone {
  constructor(public x: number, public y: number, public width: number, public height: number, public force: number) {}
}

export class MagicOrb {
  public radius: number = 15;
  constructor(public x: number, public y: number) {}
}

export class HealthOrb {
  public radius: number = 18;
  constructor(public x: number, public y: number) {}

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Heart shape drawing logic
    ctx.fillStyle = COLORS.HEALTH;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.HEALTH;
    
    ctx.beginPath();
    const topCurveHeight = this.radius * 0.3;
    ctx.moveTo(0, topCurveHeight);
    
    // Left side of heart
    ctx.bezierCurveTo(0, 0, -this.radius, 0, -this.radius, topCurveHeight);
    ctx.bezierCurveTo(-this.radius, this.radius * 0.8, 0, this.radius, 0, this.radius * 1.5);
    
    // Right side of heart
    ctx.bezierCurveTo(0, this.radius, this.radius, this.radius * 0.8, this.radius, topCurveHeight);
    ctx.bezierCurveTo(this.radius, 0, 0, 0, 0, topCurveHeight);
    
    ctx.fill();
    
    // Add an inner shine for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.4, topCurveHeight * 0.5, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}
