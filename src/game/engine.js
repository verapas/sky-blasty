// Sky Blasty - Game Engine
// Top-down mobile shooter built on HTML5 Canvas

export class Game {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.width = 0;
    this.height = 0;

    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.particles = [];
    this.powerups = [];
    this.stars = [];

    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.level = 1;

    this.gameState = 'menu'; // menu, playing, gameover, paused
    this.lastTime = 0;
    this.deltaTime = 0;

    this.enemySpawnTimer = 0;
    this.enemySpawnRate = 1500;
    this.powerupSpawnTimer = 0;
    this.fireTimer = 0;
    this.fireRate = 200;

    this.touchX = 0;
    this.touchY = 0;
    this.touchActive = false;
    this.useKeyboard = false;
    this.keys = {};

    this.weaponLevel = 1;
    this.shieldActive = false;
    this.shieldTimer = 0;

    // Input - bound handlers so we can remove them later
    this._onTouchStart = (e) => this.handleTouch(e);
    this._onTouchMove = (e) => this.handleTouch(e);
    this._onTouchEnd = () => { this.touchActive = false; };
    this._onMouseDown = (e) => this.handleMouse(e);
    this._onMouseMove = (e) => { if (e.buttons) this.handleMouse(e); };
    this._onMouseUp = () => { this.touchActive = false; };
    this._onKeyDown = (e) => { this.keys[e.key.toLowerCase()] = true; this.useKeyboard = true; };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };

    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Initial resize - use window dimensions as fallback
    this.resize();

    this.player = {
      x: this.width / 2,
      y: this.height - 120,
      w: 36,
      h: 40,
      speed: 350,
      hitbox: 14,
    };

    this.createStars();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // Fallback to window dimensions if canvas not yet laid out
    const cssW = rect.width > 0 ? rect.width : window.innerWidth;
    const cssH = rect.height > 0 ? rect.height : window.innerHeight;

    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';

    // Reset transform and apply scale fresh each time
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.width = cssW;
    this.height = cssH;

    // Keep player in bounds after resize
    if (this.player) {
      this.player.x = Math.min(this.player.x, this.width - this.player.w / 2);
      this.player.y = Math.min(this.player.y, this.height - this.player.h / 2);
    }

    // Recreate stars to fill new dimensions
    if (this.stars.length > 0) this.createStars();
  }

  createStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 60 + 20,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
  }

  handleTouch(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      this.touchX = touch.clientX - rect.left;
      this.touchY = touch.clientY - rect.top;
      this.touchActive = true;
      this.useKeyboard = false;
    }
  }

  handleMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.touchX = e.clientX - rect.left;
    this.touchY = e.clientY - rect.top;
    this.touchActive = true;
    this.useKeyboard = false;
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.weaponLevel = 1;
    this.shieldActive = false;
    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.particles = [];
    this.powerups = [];
    this.enemySpawnRate = 1500;
    this.enemySpawnTimer = 0;
    this.gameState = 'playing';
    this.player.x = this.width / 2;
    this.player.y = this.height - 120;
    if (this.callbacks.onStart) this.callbacks.onStart();
  }

  update(dt) {
    // Stars scroll in all states (nice background for menu too)
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y = -5;
        s.x = Math.random() * this.width;
      }
    }

    if (this.gameState !== 'playing') return;

    const p = this.player;

    // Player movement
    if (this.touchActive) {
      const dx = this.touchX - p.x;
      const dy = this.touchY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const move = Math.min(dist, p.speed * dt);
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
      }
    }
    if (this.useKeyboard) {
      if (this.keys['arrowleft'] || this.keys['a']) p.x -= p.speed * dt;
      if (this.keys['arrowright'] || this.keys['d']) p.x += p.speed * dt;
      if (this.keys['arrowup'] || this.keys['w']) p.y -= p.speed * dt;
      if (this.keys['arrowdown'] || this.keys['s']) p.y += p.speed * dt;
    }
    p.x = Math.max(p.w / 2, Math.min(this.width - p.w / 2, p.x));
    p.y = Math.max(p.h / 2, Math.min(this.height - p.h / 2, p.y));

    // Auto-fire
    this.fireTimer += dt * 1000;
    if (this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;
      this.fire();
    }

    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      if (b.y < -20 || b.x < -20 || b.x > this.width + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      if (b.y > this.height + 20 || b.x < -20 || b.x > this.width + 20) {
        this.enemyBullets.splice(i, 1);
        continue;
      }
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < p.hitbox + b.r) {
        this.enemyBullets.splice(i, 1);
        this.hitPlayer();
      }
    }

    // Spawn enemies
    this.enemySpawnTimer += dt * 1000;
    if (this.enemySpawnTimer >= this.enemySpawnRate) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }

    // Spawn powerups
    this.powerupSpawnTimer += dt * 1000;
    if (this.powerupSpawnTimer >= 12000) {
      this.powerupSpawnTimer = 0;
      this.spawnPowerup();
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      en.y += en.vy * dt;
      en.x += Math.sin(en.y * 0.01 + en.phase) * en.sway * dt;

      if (en.canShoot) {
        en.fireTimer += dt * 1000;
        if (en.fireTimer >= en.fireInterval) {
          en.fireTimer = 0;
          const adx = p.x - en.x;
          const ady = p.y - en.y;
          const adist = Math.sqrt(adx * adx + ady * ady) || 1;
          const bspeed = 200;
          this.enemyBullets.push({
            x: en.x,
            y: en.y,
            vx: (adx / adist) * bspeed,
            vy: (ady / adist) * bspeed,
            r: 5,
            color: '#f44',
          });
        }
      }

      if (en.y > this.height + 50) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Bullet collision
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        const dx = b.x - en.x;
        const dy = b.y - en.y;
        if (Math.sqrt(dx * dx + dy * dy) < en.hitbox + 4) {
          this.bullets.splice(j, 1);
          en.hp -= 1;
          this.createParticles(b.x, b.y, '#ff8', 4);
          if (en.hp <= 0) {
            this.score += en.points;
            this.createParticles(en.x, en.y, en.color, 12);
            this.enemies.splice(i, 1);
            if (this.callbacks.onScore) this.callbacks.onScore(this.score);
            break;
          }
        }
      }

      // Body collision
      if (en.y > 0) {
        const dx = en.x - p.x;
        const dy = en.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.hitbox + en.hitbox) {
          this.createParticles(en.x, en.y, en.color, 10);
          this.enemies.splice(i, 1);
          this.hitPlayer();
        }
      }
    }

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy * dt;
      pu.pulse += dt * 4;
      if (pu.y > this.height + 30) {
        this.powerups.splice(i, 1);
        continue;
      }
      const dx = pu.x - p.x;
      const dy = pu.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < p.hitbox + 16) {
        this.collectPowerup(pu.type);
        this.powerups.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      pt.alpha = pt.life / pt.maxLife;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Shield timer
    if (this.shieldActive) {
      this.shieldTimer -= dt * 1000;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }

    // Level progression
    const newLevel = 1 + Math.floor(this.score / 500);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.enemySpawnRate = Math.max(400, 1500 - (this.level - 1) * 120);
      if (this.callbacks.onLevel) this.callbacks.onLevel(this.level);
    }
  }

  fire() {
    const p = this.player;
    const speed = 550;
    if (this.weaponLevel === 1) {
      this.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -speed });
    } else if (this.weaponLevel === 2) {
      this.bullets.push({ x: p.x - 8, y: p.y - 15, vx: 0, vy: -speed });
      this.bullets.push({ x: p.x + 8, y: p.y - 15, vx: 0, vy: -speed });
    } else {
      this.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -speed });
      this.bullets.push({ x: p.x - 12, y: p.y - 10, vx: -80, vy: -speed * 0.9 });
      this.bullets.push({ x: p.x + 12, y: p.y - 10, vx: 80, vy: -speed * 0.9 });
    }
  }

  spawnEnemy() {
    const types = [
      { hp: 1, w: 28, h: 28, vy: 100 + this.level * 10, color: '#e55', points: 10, hitbox: 14, sway: 0, canShoot: false },
      { hp: 1, w: 24, h: 30, vy: 140 + this.level * 12, color: '#fc5', points: 15, hitbox: 12, sway: 40, canShoot: false },
      { hp: 3, w: 40, h: 40, vy: 70 + this.level * 8, color: '#c5f', points: 30, hitbox: 20, sway: 20, canShoot: true, fireInterval: 2500 },
      { hp: 2, w: 32, h: 32, vy: 90 + this.level * 10, color: '#5cf', points: 20, hitbox: 16, sway: 60, canShoot: false },
    ];
    const weights = this.level >= 3 ? [3, 3, 2, 2] : [4, 3, 1, 2];
    const idx = this.weightedRandom(weights);
    const t = { ...types[idx] };
    this.enemies.push({
      ...t,
      maxHp: t.hp,
      x: Math.random() * (this.width - 60) + 30,
      y: -30,
      phase: Math.random() * Math.PI * 2,
      fireTimer: Math.random() * 1000,
    });
  }

  spawnPowerup() {
    const types = ['weapon', 'shield', 'life'];
    const weights = [5, 3, 1];
    const idx = this.weightedRandom(weights);
    this.powerups.push({
      x: Math.random() * (this.width - 60) + 30,
      y: -20,
      vy: 80,
      type: types[idx],
      pulse: 0,
    });
  }

  collectPowerup(type) {
    if (type === 'weapon') {
      this.weaponLevel = Math.min(3, this.weaponLevel + 1);
    } else if (type === 'shield') {
      this.shieldActive = true;
      this.shieldTimer = 5000;
    } else if (type === 'life') {
      this.lives = Math.min(5, this.lives + 1);
      if (this.callbacks.onLives) this.callbacks.onLives(this.lives);
    }
    if (this.callbacks.onPowerup) this.callbacks.onPowerup(type);
  }

  hitPlayer() {
    if (this.shieldActive) {
      this.createParticles(this.player.x, this.player.y, '#4cf', 15);
      return;
    }
    this.lives--;
    this.createParticles(this.player.x, this.player.y, '#f55', 20);
    if (this.callbacks.onLives) this.callbacks.onLives(this.lives);
    if (this.lives <= 0) {
      this.gameState = 'gameover';
      if (this.score > this.highScore) this.highScore = this.score;
      if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
    } else {
      this.shieldActive = true;
      this.shieldTimer = 1500;
      this.weaponLevel = Math.max(1, this.weaponLevel - 1);
    }
  }

  createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 50;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: Math.random() * 0.5 + 0.3,
        maxLife: 0.8,
        alpha: 1,
        size: Math.random() * 3 + 1,
      });
    }
  }

  weightedRandom(weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return 0;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(0.5, '#0d1b3a');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars (always render, even in menu)
    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    if (this.gameState === 'menu' || this.gameState === 'gameover') {
      // Still render stars for nice animated background behind the menu overlay
      return;
    }

    // Bullets
    for (const b of this.bullets) {
      ctx.fillStyle = b.vx !== 0 ? '#fa0' : '#0f0';
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    }
    ctx.shadowBlur = 0;

    // Enemy bullets
    for (const b of this.enemyBullets) {
      ctx.fillStyle = b.color || '#f44';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#f44';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Enemies
    for (const en of this.enemies) {
      ctx.fillStyle = en.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = en.color;

      ctx.beginPath();
      if (en.canShoot) {
        const r = en.w / 2;
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          const px = en.x + Math.cos(a) * r;
          const py = en.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      } else {
        ctx.moveTo(en.x, en.y + en.h / 2);
        ctx.lineTo(en.x - en.w / 2, en.y - en.h / 2);
        ctx.lineTo(en.x + en.w / 2, en.y - en.h / 2);
      }
      ctx.closePath();
      ctx.fill();

      if (en.hp > 1 && en.hp < en.maxHp) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#333';
        ctx.fillRect(en.x - 15, en.y - en.h / 2 - 8, 30, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(en.x - 15, en.y - en.h / 2 - 8, 30 * (en.hp / en.maxHp), 4);
      }
    }
    ctx.shadowBlur = 0;

    // Powerups
    for (const pu of this.powerups) {
      const pulse = Math.sin(pu.pulse) * 3;
      const colors = { weapon: '#0f0', shield: '#4cf', life: '#f4f' };
      const labels = { weapon: 'W', shield: 'S', life: '+' };
      ctx.fillStyle = colors[pu.type] || '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[pu.type] || '#fff';
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, 14 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[pu.type] || '?', pu.x, pu.y);
    }

    // Particles
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Player
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (this.shieldActive) {
      ctx.strokeStyle = `rgba(80,200,255,${0.4 + Math.sin(Date.now() / 100) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.hitbox + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#4af';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -p.h / 2);
    ctx.lineTo(-p.w / 2, p.h / 2);
    ctx.lineTo(-p.w / 4, p.h / 3);
    ctx.lineTo(0, p.h / 2);
    ctx.lineTo(p.w / 4, p.h / 3);
    ctx.lineTo(p.w / 2, p.h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0df';
    ctx.beginPath();
    ctx.arc(0, -p.h / 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,150,0,${0.5 + Math.random() * 0.3})`;
    ctx.fillRect(-4, p.h / 2 - 2, 8, 6);

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    this.deltaTime = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(this.deltaTime);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  run() {
    requestAnimationFrame((t) => this.loop(t));
  }
}
