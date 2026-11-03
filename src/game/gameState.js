/**
 * Championship Boxing Game State Manager
 * Inspired by Punch-Out!! (Wii) and Arcade Fighting Games:
 * - Dual authentic championship health bars with yellow hit-lag chip damage
 * - Player 1 (Green) vs Rival (Red) with boxer headgear avatar badges
 * - Center Round Indicator ("Round 1") & high-contrast digital countdown timer
 * - 3 Glove Super Star / Stamina tier icons below each health bar
 * - Dynamic combo counter with damage multiplier scaling
 * - Knockout and match victory resolution
 */

export class GameState {
  constructor() {
    // Increased health pools (2500 HP) for realistic, multi-exchange boxing rounds
    this.playerMaxHp = 2500;
    this.playerHp = 2500;
    this.playerGhostHp = 2500;
    this.playerChipTimer = 0;

    this.rivalMaxHp = 2500;
    this.rivalHp = 2500;
    this.rivalGhostHp = 2500;
    this.rivalChipTimer = 0;

    // Super / Drive Gauge (0 to 100, 3 Star Tiers)
    this.superGauge = 0;
    this.superMax = 100;

    this.round = 1;
    this.roundTime = 90; // 90s authentic championship sparring round
    this.roundTimer = performance.now();
    this.isMatchOver = false;
    this.winner = null; // 'PLAYER' | 'CPU'

    // Combo system with realistic scaling
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
    this.score = 0;

    // Hit Flash FX
    this.playerFlash = 0;
    this.rivalFlash = 0;
  }

  resetMatch() {
    this.playerHp = this.playerMaxHp;
    this.playerGhostHp = this.playerMaxHp;
    this.rivalHp = this.rivalMaxHp;
    this.rivalGhostHp = this.rivalMaxHp;
    this.superGauge = 0;
    this.roundTime = 90;
    this.roundTimer = performance.now();
    this.isMatchOver = false;
    this.winner = null;
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.score = 0;
  }

  damagePlayer(amount) {
    if (this.isMatchOver) return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerChipTimer = performance.now() + 500;
    this.playerFlash = 0.8;
    this.comboCount = 0; // Drop combo on getting hit
    this.comboMultiplier = 1.0;

    if (this.playerHp <= 0) {
      this.isMatchOver = true;
      this.winner = 'CPU';
    }
  }

  damageRival(amount) {
    if (this.isMatchOver) return;
    const finalDamage = Math.round(amount * this.comboMultiplier);
    this.rivalHp = Math.max(0, this.rivalHp - finalDamage);
    this.rivalChipTimer = performance.now() + 500;
    this.rivalFlash = 0.8;

    // Increment combo with realistic scaling (up to +40% boost for high hit streaks)
    this.comboCount++;
    this.comboTimer = performance.now() + 1900; // 1.9s combo window
    this.comboMultiplier = 1.0 + Math.min(0.40, (this.comboCount - 1) * 0.04);

    // Charge Super Gauge
    this.superGauge = Math.min(this.superMax, this.superGauge + 8);
    this.score += finalDamage * 10;

    if (this.rivalHp <= 0) {
      this.isMatchOver = true;
      this.winner = 'PLAYER';
    }
  }

  addSuper(amount = 18) {
    this.superGauge = Math.min(this.superMax, this.superGauge + amount);
  }

  update(now, dt) {
    // 1. Ghost Chip Bar Smooth Decay
    if (now > this.playerChipTimer && this.playerGhostHp > this.playerHp) {
      this.playerGhostHp = Math.max(this.playerHp, this.playerGhostHp - (this.playerGhostHp - this.playerHp) * 0.08);
    }
    if (now > this.rivalChipTimer && this.rivalGhostHp > this.rivalHp) {
      this.rivalGhostHp = Math.max(this.rivalHp, this.rivalGhostHp - (this.rivalGhostHp - this.rivalHp) * 0.08);
    }

    // 2. Hit Flash Decay
    if (this.playerFlash > 0) this.playerFlash = Math.max(0, this.playerFlash - dt * 2.5);
    if (this.rivalFlash > 0) this.rivalFlash = Math.max(0, this.rivalFlash - dt * 2.5);

    // 3. Combo Timer Decay
    if (this.comboCount > 0 && now > this.comboTimer) {
      this.comboCount = 0;
      this.comboMultiplier = 1.0;
    }

    // 4. Round Countdown
    if (!this.isMatchOver && now - this.roundTimer >= 1000) {
      this.roundTime = Math.max(0, this.roundTime - 1);
      this.roundTimer = now;
      if (this.roundTime <= 0) {
        this.isMatchOver = true;
        this.winner = this.playerHp >= this.rivalHp ? 'PLAYER' : 'CPU';
      }
    }
  }

  /**
   * Renders the Championship Top Fight HUD matching Punch-Out!! (Wii) reference
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width Screen width
   * @param {number} height Screen height
   * @param {string} opponentName Fighter display name
   */
  renderHUD(ctx, width, height, opponentName = 'SHANE FAZEN (SPARRING)') {
    const margin = Math.max(18, Math.min(36, width * 0.03));
    const topY = 80; // Positioned cleanly below the header bar
    const barHeight = 26;
    const avatarSize = 44;
    const centerBoxW = 108;
    const centerBoxH = 50;

    const cx = width * 0.5;

    ctx.save();

    // ==========================================
    // 1. CENTER ROUND / TIMER CAPSULE
    // ==========================================
    const timerX = cx - centerBoxW * 0.5;
    const timerY = topY - 14;

    // Dark titanium beveled container
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#0f1422';
    ctx.beginPath();
    ctx.roundRect(timerX, timerY, centerBoxW, centerBoxH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#2a354c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header: "Round 1"
    ctx.fillStyle = '#1e283c';
    ctx.beginPath();
    ctx.roundRect(timerX + 2, timerY + 2, centerBoxW - 4, 18, [4, 4, 0, 0]);
    ctx.fill();

    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${this.round}`, cx, timerY + 15);

    // Bottom White Display: Big Bold Countdown Number
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(timerX + 4, timerY + 21, centerBoxW - 8, 25, [0, 0, 4, 4]);
    ctx.fill();

    ctx.font = '900 24px "Russo One", "Impact", sans-serif';
    ctx.fillStyle = this.roundTime <= 10 ? '#dc2626' : '#0f172a';
    ctx.fillText(`${this.roundTime}`, cx, timerY + 42);

    // ==========================================
    // 2. PLAYER 1 HEALTH BAR (LEFT SIDE)
    // ==========================================
    const pAvatarX = margin;
    const pAvatarY = topY - 8;
    const pBarStartX = pAvatarX + avatarSize + 8;
    const pBarEndX = timerX - 8;
    const pBarW = Math.max(80, pBarEndX - pBarStartX);

    // Player 1 Avatar Badge (Red Boxer Helmet)
    this.drawAvatarBadge(ctx, pAvatarX, pAvatarY, avatarSize, true);

    // Player Fighter Label
    ctx.font = '800 12px "Russo One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('PLAYER 1', pBarStartX, topY - 12);
    ctx.shadowBlur = 0;

    // Player Health Bar (Drains left-to-right, vibrant green like Kinect Sports Boxing)
    const pColors = (this.playerHp / this.playerMaxHp) > 0.30
      ? ['#00e676', '#10b981']
      : ['#ef4444', '#dc2626'];

    this.drawHealthBar(
      ctx,
      pBarStartX,
      topY - 4,
      pBarW,
      barHeight,
      this.playerHp / this.playerMaxHp,
      this.playerGhostHp / this.playerMaxHp,
      pColors,
      this.playerFlash,
      false
    );

    // Player 3 Glove Icons (Super Star / Power Tier Meters)
    const playerStars = Math.floor((this.superGauge / this.superMax) * 3);
    this.drawGloveIndicators(ctx, pBarStartX, topY + barHeight + 4, pBarW, playerStars, '#ffd700', false);

    // ==========================================
    // 3. RIVAL HEALTH BAR (RIGHT SIDE)
    // ==========================================
    const rAvatarX = width - margin - avatarSize;
    const rAvatarY = topY - 8;
    const rBarStartX = timerX + centerBoxW + 8;
    const rBarEndX = rAvatarX - 8;
    const rBarW = Math.max(80, rBarEndX - rBarStartX);

    // Rival Avatar Badge (Blue Boxer Helmet)
    this.drawAvatarBadge(ctx, rAvatarX, rAvatarY, avatarSize, false);

    // Rival Fighter Label
    ctx.font = '800 12px "Russo One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(opponentName, rBarEndX, topY - 12);
    ctx.shadowBlur = 0;

    // Rival Health Bar (Drains towards center, green when healthy like Kinect Sports, turns red as HP drops)
    const rColors = (this.rivalHp / this.rivalMaxHp) > 0.40
      ? ['#00e676', '#10b981']
      : (this.rivalHp / this.rivalMaxHp) > 0.20
        ? ['#f59e0b', '#fbbf24']
        : ['#ff1744', '#ef4444'];

    this.drawHealthBar(
      ctx,
      rBarStartX,
      topY - 4,
      rBarW,
      barHeight,
      this.rivalHp / this.rivalMaxHp,
      this.rivalGhostHp / this.rivalMaxHp,
      rColors,
      this.rivalFlash,
      true
    );

    // Rival 3 Glove Icons (Combo/Stamina Fury)
    const rivalGloveFill = Math.min(3, Math.ceil((this.rivalHp / this.rivalMaxHp) * 3));
    this.drawGloveIndicators(ctx, rBarStartX, topY + barHeight + 4, rBarW, rivalGloveFill, '#ff3366', true);

    // ==========================================
    // 4. COMBO STREAK DISPLAY
    // ==========================================
    if (this.comboCount >= 2) {
      this.drawComboStreak(ctx, width, height);
    }

    ctx.restore();
  }

  /**
   * Draws a Punch-Out!! style boxer avatar portrait badge
   */
  drawAvatarBadge(ctx, x, y, size, isPlayer) {
    ctx.save();

    // Outer Beveled Frame
    ctx.fillStyle = isPlayer ? '#7f1d1d' : '#1e3a8a';
    ctx.strokeStyle = isPlayer ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    // Stylized Boxer Headgear Helmet Icon
    const cx = x + size * 0.5;
    const cy = y + size * 0.52;
    const r = size * 0.32;

    // Head / Face
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Dome
    ctx.fillStyle = isPlayer ? '#dc2626' : '#2563eb';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(cx + r * 0.9, cy + 6);
    ctx.lineTo(cx + r * 0.45, cy + 8);
    ctx.lineTo(cx - r * 0.45, cy + 8);
    ctx.lineTo(cx - r * 0.9, cy + 6);
    ctx.closePath();
    ctx.fill();

    // Chin strap
    ctx.strokeStyle = isPlayer ? '#991b1b' : '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, r * 0.7, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draws an individual championship health bar with ghost chip lag
   */
  drawHealthBar(ctx, x, y, width, height, primaryRatio, ghostRatio, colors, flashAmount, flip) {
    ctx.save();

    // Dark chassis background
    ctx.fillStyle = '#0a0e18';
    ctx.strokeStyle = '#273349';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    ctx.stroke();

    // Inner Clip for Bar Contents
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 1.5, y + 1.5, width - 3, height - 3, 4);
    ctx.clip();

    // Depleted red damage trail underlay (Kinect Sports style)
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x + 1.5, y + 1.5, width - 3, height - 3);

    // 1. Ghost Bar (Delayed Yellow/Orange Chip Damage)
    ctx.fillStyle = '#f59e0b';
    if (!flip) {
      ctx.fillRect(x + 1.5, y + 1.5, (width - 3) * Math.min(1.0, ghostRatio), height - 3);
    } else {
      const gW = (width - 3) * Math.min(1.0, ghostRatio);
      ctx.fillRect(x + width - 1.5 - gW, y + 1.5, gW, height - 3);
    }

    // 2. Primary Health Bar (Vibrant Gradient)
    const grad = ctx.createLinearGradient(x, y, x + width, y);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;

    if (!flip) {
      ctx.fillRect(x + 1.5, y + 1.5, (width - 3) * Math.min(1.0, primaryRatio), height - 3);
    } else {
      const pW = (width - 3) * Math.min(1.0, primaryRatio);
      ctx.fillRect(x + width - 1.5 - pW, y + 1.5, pW, height - 3);
    }

    // 3. Top Half Glossy Glass Highlight (Authentic Arcade Feel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(x + 1.5, y + 1.5, width - 3, (height - 3) * 0.42);

    // 4. White Hit Flash on Damage
    if (flashAmount > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAmount * 0.75})`;
      ctx.fillRect(x + 1.5, y + 1.5, width - 3, height - 3);
    }

    ctx.restore(); // Exit clip

    // Metallic outer bevel stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws 3 horizontal glove indicators below the health bar (Punch-Out!! Wii style)
   */
  drawGloveIndicators(ctx, x, y, width, activeCount, activeColor, flip) {
    ctx.save();

    const gloveW = 16;
    const gloveH = 12;
    const spacing = 22;

    for (let i = 0; i < 3; i++) {
      const gx = flip ? (x + width - 18 - i * spacing) : (x + 4 + i * spacing);
      const isActive = i < activeCount;

      // Dark chassis
      ctx.fillStyle = isActive ? activeColor : 'rgba(30, 41, 59, 0.65)';
      ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(71, 85, 105, 0.6)';
      ctx.lineWidth = 1.2;

      // Miniature Glove Contour
      ctx.beginPath();
      ctx.roundRect(gx, y, gloveW, gloveH, 3);
      ctx.fill();
      ctx.stroke();

      // Glove Star Icon inside
      if (isActive) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', gx + gloveW * 0.5, y + 9);
      }
    }

    ctx.restore();
  }

  drawComboStreak(ctx, width, height) {
    ctx.save();
    const x = 50;
    const y = height * 0.38;

    ctx.font = '900 46px "Russo One", "Impact", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe600';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff5500';
    ctx.shadowBlur = 18;

    const text = `${this.comboCount} HITS!`;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    ctx.font = '900 20px "Russo One", sans-serif';
    ctx.fillStyle = '#00ffff';
    const multText = `x${this.comboMultiplier.toFixed(1)} DAMAGE BOOST`;
    ctx.strokeText(multText, x, y + 28);
    ctx.fillText(multText, x, y + 28);

    ctx.restore();
  }
}

export default GameState;
