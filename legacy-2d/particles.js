/* ==========================================
   Cozy Particle Engine & Visual Effects
   ========================================== */

class Particle {
  constructor(x, y, vx, vy, type, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'sakura', 'firefly', 'snow', 'cloud', 'sparkle', 'bubble', 'heart'
    this.life = options.life || 1.0; // 0.0 to 1.0
    this.decay = options.decay || 0.01;
    this.size = options.size || 4;
    this.color = options.color || '#ffb7b2';
    this.angle = options.angle || 0;
    this.va = options.va || 0; // angular velocity
    this.wobbleSpeed = options.wobbleSpeed || 0;
    this.wobbleAmt = options.wobbleAmt || 0;
    this.wobbleOffset = Math.random() * 100;
  }

  update(time = 0) {
    this.life -= this.decay;
    
    // Add movement dynamics based on particle type
    if (this.type === 'sakura') {
      // Fluttering left and right while falling
      this.x += this.vx + Math.sin(time * 0.003 + this.wobbleOffset) * 0.5;
      this.y += this.vy;
      this.angle += this.va;
    } else if (this.type === 'firefly') {
      // Floating randomly (Brownian-like)
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vy += (Math.random() - 0.5) * 0.1;
      // Cap speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 1.2) {
        this.vx = (this.vx / speed) * 1.2;
        this.vy = (this.vy / speed) * 1.2;
      }
      this.x += this.vx;
      this.y += this.vy;
    } else if (this.type === 'snow') {
      // Gently drifting downwards
      this.x += this.vx + Math.sin(time * 0.001 + this.wobbleOffset) * 0.2;
      this.y += this.vy;
    } else if (this.type === 'bubble') {
      // Floating upwards with wave wobble
      this.x += this.vx + Math.sin(time * 0.004 + this.wobbleOffset) * 0.6;
      this.y += this.vy;
    } else if (this.type === 'heart' || this.type === 'sparkle') {
      // Rising and fading
      this.x += this.vx;
      this.y += this.vy;
    } else {
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    if (this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.life;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    if (this.type === 'sakura') {
      ctx.translate(screenX, screenY);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      // Draw tiny sakura petal shape (oval-ish)
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'firefly') {
      // Glowing firefly
      const grad = ctx.createRadialGradient(screenX, screenY, 1, screenX, screenY, this.size * 2.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, this.color);
      grad.addColorStop(1, 'rgba(255, 224, 130, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'bubble') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(199, 206, 234, 0.2)'; // Lavender tint
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Highlight spot on bubble
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(screenX - this.size * 0.3, screenY - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'heart') {
      // Draw a tiny pixelated or smooth heart
      ctx.fillStyle = this.color;
      ctx.translate(screenX, screenY);
      ctx.scale(this.size / 6, this.size / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-3, -3, -6, 0, 0, 5);
      ctx.bezierCurveTo(6, 0, 3, -3, 0, 0);
      ctx.fill();
    } else if (this.type === 'sparkle') {
      ctx.fillStyle = this.color;
      // 4-pointed sparkle star
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - this.size);
      ctx.lineTo(screenX + this.size / 3, screenY - this.size / 3);
      ctx.lineTo(screenX + this.size, screenY);
      ctx.lineTo(screenX + this.size / 3, screenY + this.size / 3);
      ctx.lineTo(screenX, screenY + this.size);
      ctx.lineTo(screenX - this.size / 3, screenY + this.size / 3);
      ctx.lineTo(screenX - this.size, screenY);
      ctx.lineTo(screenX - this.size / 3, screenY - this.size / 3);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'cloud') {
      // Moving cloud on world map
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
      ctx.arc(screenX + this.size * 0.6, screenY - this.size * 0.2, this.size * 0.8, 0, Math.PI * 2);
      ctx.arc(screenX + this.size * 1.2, screenY, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class ParticleEngine {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  add(particle) {
    this.particles.push(particle);
  }

  update(time = 0) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(time);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, cameraX = 0, cameraY = 0) {
    for (const p of this.particles) {
      p.draw(ctx, cameraX, cameraY);
    }
  }

  // Spawners
  spawnSakura(count, width, height, isGlobal = false) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = isGlobal ? Math.random() * height : -20;
      const vx = -0.5 - Math.random() * 0.8; // Drifts left
      const vy = 0.8 + Math.random() * 1.0;  // Falls down
      this.particles.push(new Particle(x, y, vx, vy, 'sakura', {
        life: 0.8 + Math.random() * 0.2,
        decay: 0.002 + Math.random() * 0.002,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#ff4081' : '#ff80ab', // Vibrant pink / light pink
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.02
      }));
    }
  }

  spawnFirefly(count, width, height, isGlobal = false) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const vx = (Math.random() - 0.5) * 0.5;
      const vy = (Math.random() - 0.5) * 0.5;
      this.particles.push(new Particle(x, y, vx, vy, 'firefly', {
        life: 0.6 + Math.random() * 0.4,
        decay: 0.003 + Math.random() * 0.003,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#ffd600' : '#ff4081' // Neon yellow or pink
      }));
    }
  }

  spawnSnow(count, width, height, isGlobal = false) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = isGlobal ? Math.random() * height : -20;
      const vx = -0.2 - Math.random() * 0.5; // slow drift
      const vy = 0.5 + Math.random() * 0.8;  // slow fall
      this.particles.push(new Particle(x, y, vx, vy, 'snow', {
        life: 0.9 + Math.random() * 0.1,
        decay: 0.002 + Math.random() * 0.002,
        size: 1.5 + Math.random() * 2.5
      }));
    }
  }

  spawnSparkles(x, y, count = 8, color = '#ffd600') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(new Particle(x, y, vx, vy, 'sparkle', {
        life: 0.8 + Math.random() * 0.2,
        decay: 0.02 + Math.random() * 0.02,
        size: 3 + Math.random() * 4,
        color: color
      }));
    }
  }

  spawnHearts(x, y, count = 5, color = '#ff1744') {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 1.2;
      const vy = -0.8 - Math.random() * 1.2; // Rises up
      this.particles.push(new Particle(x, y, vx, vy, 'heart', {
        life: 0.8 + Math.random() * 0.2,
        decay: 0.015 + Math.random() * 0.015,
        size: 5 + Math.random() * 5,
        color: color
      }));
    }
  }

  spawnDreamBubble(count, width, height, isGlobal = false) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = isGlobal ? Math.random() * height : height + 20;
      const vx = (Math.random() - 0.5) * 0.2;
      const vy = -0.4 - Math.random() * 0.6; // floats up
      this.particles.push(new Particle(x, y, vx, vy, 'bubble', {
        life: 0.8 + Math.random() * 0.2,
        decay: 0.002 + Math.random() * 0.002,
        size: 4 + Math.random() * 6
      }));
    }
  }

  spawnClouds(count, mapWidth, mapHeight) {
    // Generate large drifting clouds for the world map
    for (let i = 0; i < count; i++) {
      const x = Math.random() * mapWidth;
      const y = Math.random() * (mapHeight * 0.6);
      const vx = 0.1 + Math.random() * 0.2; // drift right
      this.particles.push(new Particle(x, y, vx, 0, 'cloud', {
        life: 1.0,
        decay: 0.0,
        size: 30 + Math.random() * 25
      }));
    }
  }
}

export const Particles = new ParticleEngine();
export default Particles;
