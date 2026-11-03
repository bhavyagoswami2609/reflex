import { LM, dist2D } from '../biomechanics/landmarks.js';

/**
 * Player Translucent Boxing Gloves Renderer
 * Inspired by Punch-Out!! (Wii):
 * - Tracks the player's physical hands (wrists, knuckles, forearms) in real time
 * - Renders translucent, glass-like arcade boxing gloves directly in the foreground
 * - Translucent crimson leather allows you to see the opponent and ring through the gloves
 * - Glove anatomy: curved knuckle pill, inner thumb pad, white athletic wrist tape wraps
 * - Dynamic punch extension scaling (gloves surge forward into the screen when punching)
 * - Protective guard aura when high block is active
 * - Smooth fallback to resting guard posture when hands temporarily dip off-camera
 */
export class PlayerGlovesRenderer {
  constructor() {
    this.enabled = true;

    // Glove Theme: 'CRIMSON' (Punch-Out classic red), 'CYAN', or 'GOLD'
    this.colorTheme = 'CRIMSON';

    // Left Glove Tracking State
    this.leftGlove = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      angle: -0.15,
      targetAngle: -0.15,
      scale: 1.0,
      targetScale: 1.0,
      opacity: 0.65,
      visible: false,
      isPunching: false,
      punchExtension: 0,
      isGuarding: false,
      punchType: null,
      punchVelocity: 0
    };

    // Right Glove Tracking State
    this.rightGlove = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      angle: 0.15,
      targetAngle: 0.15,
      scale: 1.0,
      targetScale: 1.0,
      opacity: 0.65,
      visible: false,
      isPunching: false,
      punchExtension: 0,
      isGuarding: false,
      punchType: null,
      punchVelocity: 0
    };

    // Smoothing factor (exponential moving average for jitter-free glove motion)
    this.lerpFactor = 0.38;

    // Previous wrist positions for velocity calculation
    this.prevLeftWrist = null;
    this.prevRightWrist = null;

    // Kinetic Punch Trail Particles
    this.punchTrails = [];

    // Animation clock
    this.clock = 0;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setTheme(theme) {
    if (['CRIMSON', 'CYAN', 'GOLD'].includes(theme)) {
      this.colorTheme = theme;
    }
  }

  /**
   * Updates player glove kinematics from MediaPipe pose landmarks and combat evaluation
   * @param {Array} lm Mirrored MediaPipe Pose 33 landmarks
   * @param {Object} evaluation Form evaluation with punchEvent and guard
   * @param {Object} defense Active defense action
   * @param {number} width Screen width
   * @param {number} height Screen height
   * @param {number} dt Frame delta time
   */
  update(lm, evaluation, defense, width, height, dt = 0.016) {
    if (!this.enabled) return;
    this.clock += dt;

    const baseRadius = Math.max(68, Math.min(width, height) * 0.10);
    const isGuarding = defense?.action === 'HIGH_GUARD_BLOCK';

    // Update Left Glove
    this.updateSingleHand(true, lm, evaluation, isGuarding, width, height, baseRadius, dt);

    // Update Right Glove
    this.updateSingleHand(false, lm, evaluation, isGuarding, width, height, baseRadius, dt);

    // Update punch trail particles
    this.updateTrails(dt);
  }

  /**
   * Updates tracking and kinematics for a single hand
   */
  updateSingleHand(isLeft, lm, evaluation, isGuarding, width, height, baseRadius, dt) {
    const glove = isLeft ? this.leftGlove : this.rightGlove;
    glove.isGuarding = isGuarding;

    const wristLM = isLeft ? lm?.[LM.LEFT_WRIST] : lm?.[LM.RIGHT_WRIST];
    const elbowLM = isLeft ? lm?.[LM.LEFT_ELBOW] : lm?.[LM.RIGHT_ELBOW];
    const indexLM = isLeft ? lm?.[LM.LEFT_INDEX] : lm?.[LM.RIGHT_INDEX];
    const pinkyLM = isLeft ? lm?.[LM.LEFT_PINKY] : lm?.[LM.RIGHT_PINKY];
    const thumbLM = isLeft ? lm?.[LM.LEFT_THUMB] : lm?.[LM.RIGHT_THUMB];

    const hasHand = wristLM && (wristLM.visibility ?? 1) > 0.35;

    if (hasHand) {
      glove.visible = true;

      // Knuckle centroid: weighted between index, pinky, and wrist
      let fistNormX = wristLM.x;
      let fistNormY = wristLM.y;

      if (indexLM && pinkyLM) {
        fistNormX = wristLM.x * 0.35 + indexLM.x * 0.35 + pinkyLM.x * 0.30;
        fistNormY = wristLM.y * 0.35 + indexLM.y * 0.35 + pinkyLM.y * 0.30;
      }

      glove.targetX = fistNormX * width;
      glove.targetY = fistNormY * height;

      // Forearm orientation angle
      if (elbowLM && (elbowLM.visibility ?? 1) > 0.30) {
        const armAngle = Math.atan2(wristLM.y - elbowLM.y, wristLM.x - elbowLM.x);
        // Normalize angle so upward guard points knuckles slightly inward
        const baseTilt = isLeft ? 0.22 : -0.22;
        glove.targetAngle = (armAngle - Math.PI / 2) * 0.65 + baseTilt;
      } else {
        glove.targetAngle = isLeft ? 0.15 : -0.15;
      }

      // Check punch velocity and forward extension
      const prevWrist = isLeft ? this.prevLeftWrist : this.prevRightWrist;
      let velocity = 0;
      if (prevWrist) {
        const dX = (wristLM.x - prevWrist.x) * width;
        const dY = (wristLM.y - prevWrist.y) * height;
        velocity = Math.sqrt(dX * dX + dY * dY) / Math.max(0.001, dt);
      }
      glove.punchVelocity = velocity;

      if (isLeft) {
        this.prevLeftWrist = { x: wristLM.x, y: wristLM.y };
      } else {
        this.prevRightWrist = { x: wristLM.x, y: wristLM.y };
      }

      // Check if this hand triggered a punch event
      const isPunchingArm = evaluation?.punchEvent && evaluation.punchEvent.arm === (isLeft ? 'LEFT' : 'RIGHT');
      glove.isPunching = isPunchingArm || velocity > 450;
      if (isPunchingArm) {
        glove.punchType = evaluation.punchEvent.type;
      }

      // Scale dynamically: punch extension surges glove forward (like Punch-Out!! Wii)
      let scaleMult = 1.0;
      if (glove.isPunching) {
        scaleMult = 1.25 + Math.min(0.25, velocity / 1200);
        this.spawnPunchTrail(glove.x, glove.y, baseRadius * scaleMult, isLeft);
      } else if (isGuarding) {
        scaleMult = 1.10;
      }
      glove.targetScale = scaleMult;
      glove.opacity = 0.68;

    } else {
      // Resting Guard Fallback: smoothly rest at lower screen edge in orthodox guard
      const restX = isLeft ? width * 0.32 : width * 0.68;
      const breathFloat = Math.sin(this.clock * 2.2 + (isLeft ? 0 : 1.2)) * 8;
      const restY = height * 0.82 + breathFloat;

      glove.targetX = restX;
      glove.targetY = restY;
      glove.targetAngle = isLeft ? 0.18 : -0.18;
      glove.targetScale = 0.95;
      glove.opacity = 0.52;
      glove.isPunching = false;
    }

    // Exponential moving average smoothing (LERP)
    if (glove.x === 0 && glove.y === 0) {
      glove.x = glove.targetX;
      glove.y = glove.targetY;
    } else {
      glove.x += (glove.targetX - glove.x) * this.lerpFactor;
      glove.y += (glove.targetY - glove.y) * this.lerpFactor;
    }
    glove.angle += (glove.targetAngle - glove.angle) * this.lerpFactor;
    glove.scale += (glove.targetScale - glove.scale) * this.lerpFactor;
  }

  /**
   * Spawns punch kinetic trail particles
   */
  spawnPunchTrail(x, y, radius, isLeft) {
    if (Math.random() < 0.45) {
      this.punchTrails.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        radius: radius * 0.85,
        alpha: 0.40,
        life: 0.22,
        maxLife: 0.22,
        isLeft
      });
    }
  }

  updateTrails(dt) {
    for (let i = this.punchTrails.length - 1; i >= 0; i--) {
      const p = this.punchTrails[i];
      p.life -= dt;
      p.alpha = (p.life / p.maxLife) * 0.40;
      p.radius *= 1.02;
      if (p.life <= 0) {
        this.punchTrails.splice(i, 1);
      }
    }
  }

  /**
   * Renders the translucent boxing gloves on the 2D game canvas
   */
  render(ctx, width, height) {
    if (!this.enabled) return;

    const baseRadius = Math.max(68, Math.min(width, height) * 0.10);

    // 1. Draw Kinetic Punch Speed Trails
    this.renderTrails(ctx);

    // 2. Draw Left Glove
    this.drawTranslucentGlove(ctx, this.leftGlove, true, baseRadius);

    // 3. Draw Right Glove
    this.drawTranslucentGlove(ctx, this.rightGlove, false, baseRadius);
  }

  renderTrails(ctx) {
    ctx.save();
    for (const p of this.punchTrails) {
      ctx.globalAlpha = p.alpha;
      const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius);
      grad.addColorStop(0, 'rgba(255, 60, 90, 0.5)');
      grad.addColorStop(1, 'rgba(255, 30, 60, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draws an individual translucent boxing glove matching the Punch-Out!! Wii visual aesthetic:
   * - Big curved translucent knuckle cushion
   * - Inner thumb contour
   * - Inner palm grip bar
   * - High-gloss white curved specular glass highlight on knuckles
   * - White athletic wrist tape wrap cuff with embossed stripes
   * - Glowing guard shield aura when blocking
   */
  drawTranslucentGlove(ctx, glove, isLeft, baseRadius) {
    const x = glove.x;
    const y = glove.y;
    const radius = baseRadius * glove.scale;
    const angle = glove.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const scaleFactor = radius / 75;
    ctx.scale(scaleFactor, scaleFactor);

    // Guard Block Forcefield Aura
    if (glove.isGuarding) {
      ctx.save();
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -32, 54, 46, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Punch Extension Impact Flash
    if (glove.isPunching) {
      ctx.save();
      ctx.shadowColor = '#ff2244';
      ctx.shadowBlur = 28;
      ctx.strokeStyle = 'rgba(255, 80, 110, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -35, 52, 44, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- 1. WHITE ATHLETIC TAPE WRIST CUFF ---
    // High-top wrist collar with athletic tape texture
    ctx.save();
    ctx.globalAlpha = glove.opacity * 1.15;

    const cuffGrad = ctx.createLinearGradient(-30, 0, 30, 0);
    cuffGrad.addColorStop(0, 'rgba(215, 222, 235, 0.85)');
    cuffGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.92)');
    cuffGrad.addColorStop(0.7, 'rgba(240, 244, 252, 0.90)');
    cuffGrad.addColorStop(1, 'rgba(200, 210, 225, 0.80)');

    ctx.fillStyle = cuffGrad;
    ctx.strokeStyle = 'rgba(160, 175, 195, 0.7)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-28, 5, 56, 38, 8);
    ctx.fill();
    ctx.stroke();

    // Athletic tape horizontal ribs
    ctx.strokeStyle = 'rgba(180, 190, 205, 0.6)';
    ctx.lineWidth = 1.2;
    for (let r = 14; r <= 34; r += 9) {
      ctx.beginPath();
      ctx.moveTo(-26, r);
      ctx.lineTo(26, r);
      ctx.stroke();
    }

    // Red brand logo stripe on wrist cuff
    ctx.fillStyle = 'rgba(220, 20, 50, 0.90)';
    ctx.beginPath();
    ctx.roundRect(-16, 17, 32, 14, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    // --- 2. TRANSLUCENT BOXING GLOVE LEATHER BODY ---
    ctx.save();
    ctx.globalAlpha = glove.opacity;

    // Translucent Radial Gradient (Iconic Punch-Out!! Wii Crimson)
    const leatherGrad = ctx.createRadialGradient(-10, -42, 8, 0, -32, 54);
    if (this.colorTheme === 'CYAN') {
      leatherGrad.addColorStop(0, 'rgba(60, 240, 255, 0.75)');
      leatherGrad.addColorStop(0.45, 'rgba(0, 180, 230, 0.62)');
      leatherGrad.addColorStop(0.85, 'rgba(0, 90, 160, 0.50)');
      leatherGrad.addColorStop(1.0, 'rgba(0, 40, 90, 0.35)');
    } else if (this.colorTheme === 'GOLD') {
      leatherGrad.addColorStop(0, 'rgba(255, 235, 120, 0.75)');
      leatherGrad.addColorStop(0.45, 'rgba(235, 180, 40, 0.62)');
      leatherGrad.addColorStop(0.85, 'rgba(180, 120, 20, 0.50)');
      leatherGrad.addColorStop(1.0, 'rgba(110, 65, 10, 0.35)');
    } else {
      // Default: Punch-Out Classic Translucent Crimson Red
      leatherGrad.addColorStop(0, 'rgba(255, 80, 110, 0.72)');
      leatherGrad.addColorStop(0.45, 'rgba(225, 25, 55, 0.62)');
      leatherGrad.addColorStop(0.85, 'rgba(160, 12, 35, 0.50)');
      leatherGrad.addColorStop(1.0, 'rgba(95, 8, 22, 0.35)');
    }

    ctx.fillStyle = leatherGrad;
    ctx.strokeStyle = this.colorTheme === 'CYAN' ? 'rgba(0, 243, 255, 0.85)' : 'rgba(255, 110, 135, 0.80)';
    ctx.lineWidth = 2.4;

    // Main Knuckle Cushion (Bulbous curved boxing glove pillow)
    ctx.beginPath();
    ctx.ellipse(0, -34, 46, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 3. ANATOMICAL THUMB CONTOUR (Inner side of glove) ---
    // For left glove: thumb is on the RIGHT side (inner)
    // For right glove: thumb is on the LEFT side (inner)
    const thumbX = isLeft ? 32 : -32;
    const thumbSign = isLeft ? 1 : -1;

    ctx.beginPath();
    ctx.ellipse(thumbX, -16, 17, 24, thumbSign * 0.40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Seam connecting thumb to main knuckle casing
    ctx.strokeStyle = 'rgba(60, 6, 16, 0.55)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(thumbSign * 18, -32);
    ctx.quadraticCurveTo(thumbSign * 24, -12, thumbSign * 20, 6);
    ctx.stroke();

    // --- 4. INNER PALM & GRIP BAR ---
    ctx.fillStyle = 'rgba(35, 6, 12, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -8, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal leather grip bar
    ctx.fillStyle = 'rgba(20, 3, 6, 0.65)';
    ctx.beginPath();
    ctx.roundRect(-22, -11, 44, 7, 3);
    ctx.fill();

    // --- 5. HIGH-GLOSS CURVED SPECULAR GLASS HIGHLIGHT ---
    // The key visual element from Punch-Out!! Wii that gives the translucent glass look!
    const highlightGrad = ctx.createLinearGradient(-32, -62, 28, -62);
    highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    highlightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.75)');
    highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    highlightGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.70)');
    highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = highlightGrad;
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(0, -34, 38, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();

    // Secondary soft specular sheen spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.beginPath();
    ctx.ellipse(-14, -50, 14, 6, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Knuckle division creases (3 subtle athletic leather lines)
    ctx.strokeStyle = 'rgba(120, 10, 25, 0.45)';
    ctx.lineWidth = 1.6;
    for (let c = -14; c <= 14; c += 14) {
      ctx.beginPath();
      ctx.moveTo(c, -64);
      ctx.lineTo(c * 0.85, -48);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}

export default PlayerGlovesRenderer;
