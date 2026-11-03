/**
 * High-Speed Street Fighter Arcade Opponent ("TITAN BRAWLER")
 * Snappy reflexes, fast attack telegraphs, sleek visual styling.
 */

export class ArcadeOpponent {
  constructor() {
    this.name = 'TITAN';
    this.state = 'IDLE'; // IDLE, WINDUP, STRIKING, RECOVERING, HURT, KO
    this.timer = 0;
    this.attackType = null; // LEFT_JAB, RIGHT_CROSS, HOOK, OVERHAND
    this.requiredDefense = null; // SLIP_RIGHT, SLIP_LEFT, DUCK, HIGH_GUARD_BLOCK
    
    // Snappy timings for high-speed reflex gameplay
    this.windupDuration = 650; // ms (was 1100ms)
    this.strikeDuration = 160; // ms (was 220ms)
    this.recoverDuration = 500; // ms (was 700ms)
    this.hurtDuration = 450; // ms
    this.counterWindow = false;

    this.animTime = 0;
    this.fistOffset = { x: 0, y: 0 };
  }

  reset() {
    this.state = 'IDLE';
    this.timer = performance.now();
    this.attackType = null;
    this.requiredDefense = null;
    this.counterWindow = false;
  }

  /**
   * Fast attack trigger
   */
  startAttack(attackType = 'LEFT_JAB', windupMs = 600) {
    this.state = 'WINDUP';
    this.attackType = attackType;
    this.windupDuration = Math.max(360, windupMs);
    this.timer = performance.now();
    this.counterWindow = false;

    if (attackType === 'LEFT_JAB') {
      this.requiredDefense = 'SLIP_RIGHT';
    } else if (attackType === 'RIGHT_CROSS') {
      this.requiredDefense = 'SLIP_LEFT';
    } else if (attackType === 'HOOK') {
      this.requiredDefense = 'DUCK';
    } else {
      this.requiredDefense = 'HIGH_GUARD_BLOCK';
    }
  }

  takeHit(damage = 180) {
    this.state = 'HURT';
    this.timer = performance.now();
    this.counterWindow = false;
  }

  knockout() {
    this.state = 'KO';
    this.timer = performance.now();
  }

  update(now, dt) {
    this.animTime += dt;
    const elapsed = now - this.timer;

    if (this.state === 'WINDUP') {
      if (elapsed >= this.windupDuration) {
        this.state = 'STRIKING';
        this.timer = now;
      }
    } else if (this.state === 'STRIKING') {
      if (elapsed >= this.strikeDuration) {
        this.state = 'RECOVERING';
        this.timer = now;
        this.counterWindow = true; // Counter window opens!
      }
    } else if (this.state === 'RECOVERING') {
      if (elapsed >= this.recoverDuration) {
        this.state = 'IDLE';
        this.counterWindow = false;
        this.attackType = null;
        this.requiredDefense = null;
      }
    } else if (this.state === 'HURT') {
      if (elapsed >= this.hurtDuration) {
        this.state = 'IDLE';
      }
    }
  }

  render(ctx, width, height) {
    ctx.save();

    const cx = width * 0.5;
    const cy = height * 0.53;
    const idleBob = Math.sin(this.animTime * 4.5) * 6;

    // Floor shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 220, 130, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Screen-space translation on hit
    if (this.state === 'HURT') {
      const shakeX = (Math.random() - 0.5) * 12;
      const shakeY = (Math.random() - 0.5) * 8;
      ctx.translate(shakeX, shakeY);
    }

    // Render Clean Stylized Fighter
    this.drawFighter(ctx, cx, cy + idleBob);

    // Render Attack Telegraph Cues
    if (this.state === 'WINDUP') {
      this.drawTelegraph(ctx, cx, cy + idleBob);
    } else if (this.state === 'STRIKING') {
      this.drawStrike(ctx, cx, cy + idleBob);
    } else if (this.counterWindow) {
      this.drawCounterBadge(ctx, cx, cy + idleBob - 160);
    }

    ctx.restore();
  }

  drawFighter(ctx, cx, cy) {
    const isHurt = this.state === 'HURT';
    const isKO = this.state === 'KO';

    ctx.save();
    if (isKO) {
      ctx.translate(cx, cy + 100);
      ctx.rotate(0.25);
      ctx.translate(-cx, -(cy + 100));
      ctx.globalAlpha = 0.5;
    }

    // 1. Torso & Muscular Silhouette
    const bodyGrad = ctx.createLinearGradient(cx - 100, cy - 80, cx + 100, cy + 90);
    bodyGrad.addColorStop(0, isHurt ? '#ff4d6d' : '#1e2433');
    bodyGrad.addColorStop(0.5, isHurt ? '#ff758f' : '#283144');
    bodyGrad.addColorStop(1, isHurt ? '#c9184a' : '#141822');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = isHurt ? '#ffffff' : '#00f3ff';
    ctx.lineWidth = 2;

    // Chiseled shoulders & torso
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy - 70);
    ctx.lineTo(cx + 150, cy - 70);
    ctx.lineTo(cx + 80, cy + 90);
    ctx.lineTo(cx - 80, cy + 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle Cyber Chest Lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 50);
    ctx.lineTo(cx, cy - 10);
    ctx.lineTo(cx + 40, cy - 50);
    ctx.stroke();

    // 2. Head & Visor
    ctx.fillStyle = isHurt ? '#ffffff' : '#222838';
    ctx.beginPath();
    ctx.arc(cx, cy - 115, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.stroke();

    // Glowing Neon Visor
    ctx.fillStyle = isHurt ? '#ffffff' : '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(cx - 24, cy - 122, 48, 12, 4);
    ctx.fill();

    // 3. Gloves in Guard
    const leftY = this.state === 'WINDUP' && this.attackType === 'LEFT_JAB'
      ? cy - 30
      : cy - 75 + Math.sin(this.animTime * 4) * 4;
    const rightY = this.state === 'WINDUP' && this.attackType === 'RIGHT_CROSS'
      ? cy - 30
      : cy - 75 + Math.cos(this.animTime * 4) * 4;

    this.drawGlove(ctx, cx - 85, leftY, isHurt);
    this.drawGlove(ctx, cx + 85, rightY, isHurt);

    ctx.restore();
  }

  drawGlove(ctx, x, y, isHurt) {
    ctx.save();
    ctx.fillStyle = isHurt ? '#ffffff' : '#e63946';
    ctx.shadowColor = '#e63946';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // White knuckle band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(x - 20, y - 5, 40, 10);
    ctx.restore();
  }

  /**
   * Sleek Holographic Directional Telegraph Arrows
   */
  drawTelegraph(ctx, cx, cy) {
    const elapsed = performance.now() - this.timer;
    const progress = Math.min(1.0, elapsed / this.windupDuration);

    ctx.save();
    let prompt = '';
    let arrowX = cx;

    if (this.attackType === 'LEFT_JAB') {
      prompt = '👉 SLIP RIGHT!';
      arrowX = cx + 120;
    } else if (this.attackType === 'RIGHT_CROSS') {
      prompt = '👈 SLIP LEFT!';
      arrowX = cx - 120;
    } else if (this.attackType === 'HOOK') {
      prompt = '👇 DUCK!';
      arrowX = cx;
    } else {
      prompt = '🛡️ BLOCK!';
      arrowX = cx;
    }

    // Clean modern telegraph badge
    const badgeW = 220;
    const badgeH = 46;
    const badgeY = cy - 190;

    ctx.fillStyle = 'rgba(15, 20, 30, 0.92)';
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(cx - badgeW / 2, badgeY, badgeW, badgeH, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.font = '900 20px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe600';
    ctx.shadowBlur = 0;
    ctx.fillText(prompt, cx, badgeY + 30);

    // Fast Circular Reaction Timer Ring
    ctx.beginPath();
    ctx.arc(arrowX, cy - 60, 40, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - progress)));
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Fast Forward Punch Impact Frame
   */
  drawStrike(ctx, cx, cy) {
    const elapsed = performance.now() - this.timer;
    const progress = Math.min(1.0, elapsed / this.strikeDuration);

    ctx.save();
    const fistScale = 1.0 + progress * 2.8;
    let fistX = cx;
    if (this.attackType === 'LEFT_JAB') fistX = cx - 60 * (1 - progress);
    else if (this.attackType === 'RIGHT_CROSS') fistX = cx + 60 * (1 - progress);

    ctx.translate(fistX, cy - 60);
    ctx.scale(fistScale, fistScale);

    ctx.fillStyle = '#e63946';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-22, -7, 44, 14);

    ctx.restore();
  }

  /**
   * Punish Counter Notification
   */
  drawCounterBadge(ctx, cx, cy) {
    ctx.save();
    const pulse = 1.0 + Math.sin(this.animTime * 14) * 0.08;
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = 'rgba(0, 255, 102, 0.15)';
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-140, -22, 280, 44, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 18px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ COUNTER OPEN! STRIKE! ⚡', 0, 6);

    ctx.restore();
  }
}
