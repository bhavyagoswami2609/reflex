/**
 * Palestra Pugilism Game State Manager
 * Dark Luxury Classical Aesthetic:
 * - Dual classical health bars with delayed gilded chip damage
 * - Athlete vs Rival with gilded laurel crest avatar badges
 * - Center Round Indicator (Roman Numerals: "ROUND I", "ROUND II") & countdown timer
 * - 3 Gilded Star / Power tier icons below each health bar
 * - Dynamic classical strike sequence counter with kinematic force multiplier
 * - Technical conclusion and round resolution
 */

export function toRoman(num) {
  const map = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let n = Math.max(1, Math.floor(num));
  let result = '';
  for (const [v, r] of map) {
    while (n >= v) {
      result += r;
      n -= v;
    }
  }
  return result || 'I';
}

export class GameState {
  constructor() {
    // Health pools (2500 HP for Athlete)
    this.playerMaxHp = 2500;
    this.playerHp = 2500;
    this.playerGhostHp = 2500;
    this.playerChipTimer = 0;

    // Opponent health pool (Configured dynamically: Zeus has more HP than Dummy, scaled by difficulty)
    this.rivalMaxHp = 2000; // Default: Dummy on Professional
    this.rivalHp = 2000;
    this.rivalGhostHp = 2000;
    this.rivalChipTimer = 0;

    // Super / Drive Gauge (0 to 100, 3 Star Tiers)
    this.superGauge = 0;
    this.superMax = 100;

    this.round = 1;
    this.maxRounds = 3; // 1, 3, 5, 12, or 0 (Endless)
    this.roundDuration = 90; // 60, 90, 120, 180, or 0 (No Timer / Till Knockout)
    this.roundTime = 90;
    this.roundTimer = performance.now();
    this.isMatchOver = false;
    this.winner = null; // 'PLAYER' | 'CPU'

    // Strike Sequence system with kinematic force scaling
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
    this.roundTime = this.roundDuration;
    this.roundTimer = performance.now();
    this.isMatchOver = false;
    this.winner = null;
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.score = 0;
  }

  /**
   * Configures opponent attributes and health scaling based on fighter archetype and difficulty tier.
   * - Zeus (Heavyweight Robot):
   *   - Champion: 20% more health than player (3000 HP)
   *   - Professional: Equal health to player (2500 HP)
   *   - Novice / Rookie: 20% less health than player (2000 HP)
   * - Dummy (Training Dummy):
   *   - Always has less health than Zeus (2400 HP / 2000 HP / 1600 HP)
   */
  setOpponentConfig(characterType = 'human', difficulty = 'PROFESSIONAL') {
    const diff = (difficulty || 'PROFESSIONAL').toUpperCase();
    let maxHp = 2500;

    if (characterType === 'robot') {
      // Zeus (Heavyweight Robot)
      if (diff === 'CHAMPION') {
        maxHp = Math.round(this.playerMaxHp * 1.20); // 3000 HP (20% more than player)
      } else if (diff === 'NOVICE' || diff === 'ROOKIE') {
        maxHp = Math.round(this.playerMaxHp * 0.80); // 2000 HP (20% less than player)
      } else {
        maxHp = this.playerMaxHp; // 2500 HP (equal to player)
      }
    } else {
      // Dummy (Training Dummy) - less health than Zeus
      if (diff === 'CHAMPION') {
        maxHp = 2400; // Less than Champion Zeus (3000 HP)
      } else if (diff === 'NOVICE' || diff === 'ROOKIE') {
        maxHp = 1600; // Less than Novice Zeus (2000 HP)
      } else {
        maxHp = 2000; // Less than Pro Zeus (2500 HP)
      }
    }

    this.rivalMaxHp = maxHp;
    this.rivalHp = maxHp;
    this.rivalGhostHp = maxHp;
  }

  damagePlayer(amount) {
    if (this.isMatchOver) return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerChipTimer = performance.now() + 500;
    this.playerFlash = 0.8;
    this.comboCount = 0; // Drop sequence on getting hit
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

    // Increment strike sequence with realistic athletic scaling (up to +25% boost for high hit streaks)
    this.comboCount++;
    this.comboTimer = performance.now() + 1900; // 1.9s combo window
    this.comboMultiplier = 1.0 + Math.min(0.25, (this.comboCount - 1) * 0.025);

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

    // 3. Sequence Timer Decay
    if (this.comboCount > 0 && now > this.comboTimer) {
      this.comboCount = 0;
      this.comboMultiplier = 1.0;
    }

    // 4. Round Countdown (Only active if roundDuration > 0; if 0, continues till knockout)
    if (!this.isMatchOver && this.roundDuration > 0 && now - this.roundTimer >= 1000) {
      this.roundTime = Math.max(0, this.roundTime - 1);
      this.roundTimer = now;
      if (this.roundTime <= 0) {
        this.isMatchOver = true;
        this.winner = this.playerHp >= this.rivalHp ? 'PLAYER' : 'CPU';
      }
    }
  }

  /**
   * Renders the Classical Top Fight HUD with Dark Luxury Neoclassical Styling
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width Screen width
   * @param {number} height Screen height
   * @param {string} opponentName Fighter display name
   */
  renderHUD(ctx, width, height, opponentName = 'DUMMY') {
    const margin = Math.max(18, Math.min(36, width * 0.03));
    const topY = 82; // Positioned cleanly below the neoclassical header bar
    const barHeight = 26;
    const avatarSize = 44;
    const centerBoxW = 120;
    const centerBoxH = 54;

    const cx = width * 0.5;

    ctx.save();

    // ==========================================
    // 1. CENTER ROUND / TIMER CAPSULE
    // ==========================================
    const timerX = cx - centerBoxW * 0.5;
    const timerY = topY - 14;

    // Dark obsidian beveled container with gilded border
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#11100d';
    ctx.beginPath();
    ctx.roundRect(timerX, timerY, centerBoxW, centerBoxH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#d4a03c';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Top Header: "ROUND I", "ROUND I / III", etc.
    ctx.fillStyle = '#161411';
    ctx.beginPath();
    ctx.roundRect(timerX + 2, timerY + 2, centerBoxW - 4, 20, [4, 4, 0, 0]);
    ctx.fill();

    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d4a03c';
    ctx.textAlign = 'center';
    const roundLabel = this.maxRounds > 0
      ? `ROUND ${toRoman(this.round)}/${toRoman(this.maxRounds)}`
      : `ROUND ${toRoman(this.round)}`;
    ctx.fillText(roundLabel, cx, timerY + 16);

    // Bottom Display: Countdown Number OR Infinity Symbol (Till Knockout)
    ctx.fillStyle = '#0a0907';
    ctx.beginPath();
    ctx.roundRect(timerX + 4, timerY + 23, centerBoxW - 8, 27, [0, 0, 4, 4]);
    ctx.fill();

    if (this.roundDuration === 0) {
      ctx.font = '700 24px "Inter", sans-serif';
      ctx.fillStyle = '#d4a03c';
      ctx.fillText('∞', cx, timerY + 43);
    } else {
      ctx.font = '800 24px "Inter", sans-serif';
      ctx.fillStyle = this.roundTime <= 10 ? '#ef4444' : '#f0ebe0';
      ctx.fillText(`${this.roundTime}`, cx, timerY + 44);
    }

    // ==========================================
    // 2. ATHLETE / PLAYER 1 HEALTH BAR (LEFT SIDE)
    // ==========================================
    const pAvatarX = margin;
    const pAvatarY = topY - 8;
    const pBarStartX = pAvatarX + avatarSize + 10;
    const pBarEndX = timerX - 10;
    const pBarW = Math.max(80, pBarEndX - pBarStartX);

    // Athlete Avatar Badge
    this.drawAvatarBadge(ctx, pAvatarX, pAvatarY, avatarSize, true);

    // Athlete Fighter Label
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f0ebe0';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('ATHLETE', pBarStartX, topY - 12);
    ctx.shadowBlur = 0;

    // Athlete Health Bar (Drains left-to-right, warm gold/emerald gradient)
    const pColors = (this.playerHp / this.playerMaxHp) > 0.30
      ? ['#2d6a4f', '#52b788']
      : ['#9e3d2b', '#7a1f1d'];

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

    // Athlete 3 Gilded Star Indicators (Power Tier Meters)
    const playerStars = Math.floor((this.superGauge / this.superMax) * 3);
    this.drawGloveIndicators(ctx, pBarStartX, topY + barHeight + 4, pBarW, playerStars, '#d4a03c', false);

    // ==========================================
    // 3. RIVAL HEALTH BAR (RIGHT SIDE)
    // ==========================================
    const rAvatarX = width - margin - avatarSize;
    const rAvatarY = topY - 8;
    const rBarStartX = timerX + centerBoxW + 10;
    const rBarEndX = rAvatarX - 10;
    const rBarW = Math.max(80, rBarEndX - rBarStartX);

    // Rival Avatar Badge
    this.drawAvatarBadge(ctx, rAvatarX, rAvatarY, avatarSize, false);

    // Rival Fighter Label
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f0ebe0';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(opponentName, rBarEndX, topY - 12);
    ctx.shadowBlur = 0;

    // Rival Health Bar (Drains towards center, Imperial Crimson gradient)
    const rColors = (this.rivalHp / this.rivalMaxHp) > 0.35
      ? ['#8c2424', '#b83232']
      : ['#7a1f1d', '#551211'];

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

    // Rival 3 Indicator Stars
    const rivalGloveFill = Math.min(3, Math.ceil((this.rivalHp / this.rivalMaxHp) * 3));
    this.drawGloveIndicators(ctx, rBarStartX, topY + barHeight + 4, rBarW, rivalGloveFill, '#8c2424', true);

    // ==========================================
    // 4. STRIKE SEQUENCE DISPLAY
    // ==========================================
    if (this.comboCount >= 2) {
      this.drawComboStreak(ctx, width, height);
    }

    ctx.restore();
  }

  /**
   * Draws a Classical Laurel Crest avatar badge with dark luxury framing
   */
  drawAvatarBadge(ctx, x, y, size, isPlayer) {
    ctx.save();

    // Outer Gilded Frame
    ctx.fillStyle = '#161411';
    ctx.strokeStyle = isPlayer ? '#d4a03c' : '#8c2424';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    const cx = x + size * 0.5;
    const cy = y + size * 0.5;

    // Classical Monogram Emblem: Athlete vs Opponent
    if (isPlayer) {
      // Gilded wreath & crest
      ctx.strokeStyle = '#eec05a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.30, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = '#d4a03c';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ATH', cx, cy);
    } else {
      // Imperial crest / shield
      ctx.strokeStyle = '#8c2424';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.30, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = '#eec05a';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OPP', cx, cy);
    }

    ctx.restore();
  }

  /**
   * Draws an individual classical health bar with gilded chip lag
   */
  drawHealthBar(ctx, x, y, width, height, primaryRatio, ghostRatio, colors, flashAmount, flip) {
    ctx.save();

    // Dark chassis background
    ctx.fillStyle = '#0a0907';
    ctx.strokeStyle = 'rgba(212, 160, 60, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    ctx.stroke();

    // Inner Clip for Bar Contents
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 1.5, y + 1.5, width - 3, height - 3, 4);
    ctx.clip();

    // Deep imperial wine underlay
    ctx.fillStyle = '#200808';
    ctx.fillRect(x + 1.5, y + 1.5, width - 3, height - 3);

    // 1. Ghost Bar (Delayed Gilded Amber Chip Damage)
    ctx.fillStyle = '#d4a03c';
    if (!flip) {
      ctx.fillRect(x + 1.5, y + 1.5, (width - 3) * Math.min(1.0, ghostRatio), height - 3);
    } else {
      const gW = (width - 3) * Math.min(1.0, ghostRatio);
      ctx.fillRect(x + width - 1.5 - gW, y + 1.5, gW, height - 3);
    }

    // 2. Primary Health Bar (Gilded Gradient)
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

    // 3. Top Half Glossy Glass Sheen
    ctx.fillStyle = 'rgba(255, 248, 230, 0.16)';
    ctx.fillRect(x + 1.5, y + 1.5, width - 3, (height - 3) * 0.42);

    // 4. Hit Flash on Damage
    if (flashAmount > 0) {
      ctx.fillStyle = `rgba(255, 248, 230, ${flashAmount * 0.70})`;
      ctx.fillRect(x + 1.5, y + 1.5, width - 3, height - 3);
    }

    ctx.restore(); // Exit clip

    // Metallic fine outer bevel stroke
    ctx.strokeStyle = 'rgba(255, 248, 230, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws 3 horizontal star indicators below the health bar
   */
  drawGloveIndicators(ctx, x, y, width, activeCount, activeColor, flip) {
    ctx.save();

    const starW = 16;
    const starH = 12;
    const spacing = 22;

    for (let i = 0; i < 3; i++) {
      const gx = flip ? (x + width - 18 - i * spacing) : (x + 4 + i * spacing);
      const isActive = i < activeCount;

      // Dark chassis
      ctx.fillStyle = isActive ? 'rgba(212, 160, 60, 0.18)' : 'rgba(255, 248, 230, 0.03)';
      ctx.strokeStyle = isActive ? activeColor : 'rgba(255, 248, 230, 0.14)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(gx, y, starW, starH, 3);
      ctx.fill();
      ctx.stroke();

      // Illuminated geometric pip inside
      if (isActive) {
        ctx.fillStyle = activeColor;
        ctx.beginPath();
        ctx.roundRect(gx + 2.5, y + 2.5, starW - 5, starH - 5, 1.5);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawComboStreak(ctx, width, height) {
    ctx.save();
    const x = 54;
    const y = height * 0.38;

    ctx.font = '800 32px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#eec05a';
    ctx.strokeStyle = '#0a0907';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(212, 160, 60, 0.4)';
    ctx.shadowBlur = 14;

    const text = `${toRoman(this.comboCount)} STRIKE SEQUENCE`;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f0ebe0';
    const multText = `+${Math.round((this.comboMultiplier - 1.0) * 100)}% KINEMATIC FORCE`;
    ctx.strokeText(multText, x, y + 24);
    ctx.fillText(multText, x, y + 24);

    ctx.restore();
  }
}

export default GameState;
