import confetti from 'canvas-confetti';

/**
 * Street Fighter Hit Sparks, Floating Badges, and Camera Shake FX
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
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ffe600', '#ff0055', '#00f3ff', '#ffffff']
    });
  }

  /**
   * Spawn procedural Street Fighter hit sparks
   */
  emitHitSpark(x, y, rating = 'PERFECT') {
    const isPerfect = rating === 'PERFECT';
    const count = isPerfect ? 24 : 14;
    const color = isPerfect ? '#00ffff' : rating === 'GREAT' ? '#ffe600' : '#ff0055';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 9 + 5;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 4,
        alpha: 1.0,
        color
      });
    }

    this.addTrauma(isPerfect ? 0.6 : 0.35);
  }

  /**
   * Spawn floating critique / damage text
   */
  addFloatingBadge(text, x, y, color = '#ffe600', fontSize = 28) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      alpha: 1.0,
      scale: 1.4,
      vy: -1.8
    });
  }

  update(dt) {
    // 1. Update trauma screen shake
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.5);
      const shakeMag = this.trauma * this.trauma * 16;
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
      p.alpha -= dt * 2.8;
      p.size *= 0.95;
      if (p.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // 3. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.scale = Math.max(1.0, t.scale - dt * 2.0);
      t.alpha -= dt * 0.7;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render Sparks
    for (const p of this.sparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Floating Text Badges
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = `800 ${t.fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;

      ctx.strokeText(t.text, 0, 0);
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}
