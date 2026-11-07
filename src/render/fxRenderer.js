/**
 * Dark Luxury Hit Sparks, Floating HUD Telemetry Badges, and Camera Shake FX
 */
export class FXRenderer {
  constructor() {
    this.sparks = [];
    this.floatingTexts = [];
    this.trauma = 0; // 0 to 1
    this.shakeOffset = { x: 0, y: 0 };
  }

  addTrauma(amount = 0.5) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  triggerVictoryConfetti() {
    // Disabled per user request
  }

  /**
   * Spawn procedural luxury sparks with refined golden & crimson embers
   */
  emitHitSpark(x, y, rating = 'PERFECT') {
    const isPerfect = rating === 'PERFECT';
    const isGood = rating === 'GOOD' || rating === 'GREAT';
    const count = isPerfect ? 22 : isGood ? 14 : 16;
    const baseColor = isPerfect ? '#eec05a' : isGood ? '#d4a03c' : '#ef4444';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed = Math.random() * 8 + 4;
      // Subtle color sparkle variation for high-end feel
      const color = (isPerfect && Math.random() < 0.35) ? '#fff8e7' : baseColor;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        alpha: 1.0,
        color
      });
    }

    this.addTrauma(isPerfect ? 0.5 : 0.3);
  }

  /**
   * Spawn floating luxury HUD telemetry badge
   */
  addFloatingBadge(text, x, y, color = '#eec05a', fontSize = 24) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      alpha: 1.0,
      scale: 1.12,
      vy: -1.3,
      life: 0,
      maxLife: 1.5
    });
  }

  update(dt) {
    // 1. Update trauma screen shake
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.8);
      const shakeMag = this.trauma * this.trauma * 14;
      this.shakeOffset.x = (Math.random() - 0.5) * shakeMag;
      this.shakeOffset.y = (Math.random() - 0.5) * shakeMag;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    // 2. Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= dt * 2.6;
      p.size *= 0.94;
      if (p.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // 3. Update floating luxury telemetry badges
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.vy *= 0.95; // Smooth deceleration
      t.scale = Math.max(1.0, t.scale - dt * 0.6); // Subtle settle into place
      t.life += dt;
      if (t.life > 0.85) {
        t.alpha = Math.max(0, 1.0 - (t.life - 0.85) / (t.maxLife - 0.85));
      }
      if (t.alpha <= 0 || t.life >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render Refined Embers / Hit Sparks
    for (const p of this.sparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Luxury Telemetry Badges (Dark Obsidian Capsule with Gilded Hairline)
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1.0, t.alpha));
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      const fontSize = Math.max(11, Math.min(15, Math.round(t.fontSize * 0.65)));
      ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
      const textMetrics = ctx.measureText(t.text);
      const textW = textMetrics.width;

      const padX = 14;
      const padY = 6;
      const badgeW = textW + padX * 2 + 10;
      const badgeH = fontSize + padY * 2;
      const rx = -badgeW * 0.5;
      const ry = -badgeH * 0.5;

      // 1. Subtle Accent Glow
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;

      // 2. Translucent Obsidian Capsule Body
      ctx.fillStyle = 'rgba(14, 12, 10, 0.92)';
      ctx.beginPath();
      ctx.roundRect(rx, ry, badgeW, badgeH, badgeH * 0.5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Precision Gilded / Accent Hairline Border
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 4. Accent Jewel Pip (Left)
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(rx + padX, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crisp Ivory-Gold Monospace Typography
      ctx.fillStyle = '#f0ebe0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, rx + padX + 8, 0.5);

      ctx.restore();
    }

    ctx.restore();
  }
}
