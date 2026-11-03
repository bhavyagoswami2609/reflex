import { LM, dist2D } from '../biomechanics/landmarks.js';

/**
 * VR Head-Coupled Perspective (HCP) Camera Controller
 * Tracks face position and 3D orientation to create a true Fish-Tank VR parallax effect.
 * When the user moves, ducks, leans in, or tilts their head, the virtual camera and 3D arena
 * shift dynamically to give a realistic VR window into the fight.
 */
export class VRCameraController {
  constructor() {
    this.enabled = true;

    // Smoothed Camera Coordinates
    this.camX = 0;       // -1 (left) to +1 (right)
    this.camY = 0;       // -1 (up) to +1 (down)
    this.camZ = 1.0;     // Zoom / Depth factor (~0.85 far to 1.35 close)
    this.roll = 0;       // Head tilt in radians
    this.yaw = 0;        // Head turn left/right in radians
    this.pitch = 0;      // Head look up/down in radians

    // Raw Targets
    this.targetX = 0;
    this.targetY = 0;
    this.targetZ = 1.0;
    this.targetRoll = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;

    // Calibration Baselines
    this.calibrated = false;
    this.neutralX = 0.5;
    this.neutralY = 0.35;
    this.neutralEyeDist = 0.085;

    // Smoothing & Sensitivity
    this.lerpFactor = 0.14;         // Smooth exponential moving average
    this.sensitivityX = 1.6;        // Lateral camera pan multiplier
    this.sensitivityY = 1.4;        // Vertical camera pan multiplier
    this.sensitivityZ = 1.8;        // Zoom lean-in multiplier
    this.sensitivityRoll = 0.6;     // Head tilt roll factor

    // Ring Environment Animation Clock
    this.animTime = 0;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  recalibrate() {
    this.calibrated = false;
  }

  /**
   * Resets head-tracking baseline to current head position (called by recenter button or 'C' key)
   */
  recenter(lm) {
    if (!lm || lm.length < 33) {
      this.recalibrate();
      return false;
    }
    const nose = lm[LM.NOSE];
    const eyeL = lm[LM.LEFT_EYE] || lm[LM.LEFT_EYE_INNER] || nose;
    const eyeR = lm[LM.RIGHT_EYE] || lm[LM.RIGHT_EYE_INNER] || nose;
    const rawHeadX = (eyeL.x + eyeR.x + nose.x) / 3;
    const rawHeadY = (eyeL.y + eyeR.y + nose.y) / 3;
    const eyeDist = Math.max(0.02, dist2D(eyeL, eyeR));

    this.neutralX = rawHeadX;
    this.neutralY = rawHeadY;
    this.neutralEyeDist = eyeDist;
    this.camX = 0;
    this.camY = 0;
    this.camZ = 1.0;
    this.targetX = 0;
    this.targetY = 0;
    this.targetZ = 1.0;
    this.roll = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.calibrated = true;
    return true;
  }

  /**
   * Update head tracking pose from mirrored landmarks
   * @param {Array} lm Mirrored MediaPipe Pose 33 landmarks
   * @param {number} width Canvas width
   * @param {number} height Canvas height
   * @param {number} dt Frame delta time in seconds
   */
  update(lm, width, height, dt = 0.016) {
    this.animTime += dt;

    if (!this.enabled || !lm || lm.length < 33) {
      // Smoothly return camera to center neutral if disabled or no face detected
      this.camX += (0 - this.camX) * 0.1;
      this.camY += (0 - this.camY) * 0.1;
      this.camZ += (1.0 - this.camZ) * 0.1;
      this.roll += (0 - this.roll) * 0.1;
      this.yaw += (0 - this.yaw) * 0.1;
      this.pitch += (0 - this.pitch) * 0.1;
      return;
    }

    const nose = lm[LM.NOSE];
    const eyeL = lm[LM.LEFT_EYE] || lm[LM.LEFT_EYE_INNER] || nose;
    const eyeR = lm[LM.RIGHT_EYE] || lm[LM.RIGHT_EYE_INNER] || nose;
    const earL = lm[LM.LEFT_EAR] || eyeL;
    const earR = lm[LM.RIGHT_EAR] || eyeR;
    const mouthL = lm[LM.MOUTH_LEFT] || nose;
    const mouthR = lm[LM.MOUTH_RIGHT] || nose;

    // Compute Face Center
    const rawHeadX = (eyeL.x + eyeR.x + nose.x) / 3;
    const rawHeadY = (eyeL.y + eyeR.y + nose.y) / 3;

    // Compute Inter-Ocular Distance (Proxy for Distance / Depth Z)
    const eyeDist = Math.max(0.02, dist2D(eyeL, eyeR));

    // Compute Head Roll (Tilt Angle)
    const dX = eyeR.x - eyeL.x;
    const dY = eyeR.y - eyeL.y;
    const rawRoll = Math.atan2(dY, dX);

    // Compute Head Yaw (Looking Left vs Right)
    const eyeMidX = (eyeL.x + eyeR.x) / 2;
    const rawYaw = (nose.x - eyeMidX) / eyeDist;

    // Compute Head Pitch (Looking Up vs Down)
    const eyeMidY = (eyeL.y + eyeR.y) / 2;
    const mouthMidY = (mouthL.y + mouthR.y) / 2;
    const faceHeight = Math.max(0.04, mouthMidY - eyeMidY);
    const rawPitch = ((nose.y - eyeMidY) / faceHeight) - 0.45;

    // Auto-calibration baseline
    if (!this.calibrated) {
      this.neutralX = rawHeadX;
      this.neutralY = rawHeadY;
      this.neutralEyeDist = eyeDist;
      this.calibrated = true;
    } else {
      // Very slow drift towards neutral to adjust for user posture shifts over time
      this.neutralX += (rawHeadX - this.neutralX) * 0.002;
      this.neutralY += (rawHeadY - this.neutralY) * 0.002;
      this.neutralEyeDist += (eyeDist - this.neutralEyeDist) * 0.002;
    }

    // Normalized Offsets from Neutral
    const deltaX = (rawHeadX - this.neutralX) * this.sensitivityX;
    const deltaY = (rawHeadY - this.neutralY) * this.sensitivityY;
    const deltaZ = ((eyeDist / this.neutralEyeDist) - 1.0) * this.sensitivityZ;

    // Targets clamped within comfortable VR boundaries
    this.targetX = Math.max(-1.0, Math.min(1.0, deltaX));
    this.targetY = Math.max(-1.0, Math.min(1.0, deltaY));
    this.targetZ = Math.max(0.82, Math.min(1.35, 1.0 + deltaZ));
    this.targetRoll = Math.max(-0.25, Math.min(0.25, rawRoll * this.sensitivityRoll));
    this.targetYaw = Math.max(-0.5, Math.min(0.5, rawYaw * 0.5));
    this.targetPitch = Math.max(-0.4, Math.min(0.4, rawPitch * 0.5));

    // Smooth Exponential Moving Average (LERP)
    this.camX += (this.targetX - this.camX) * this.lerpFactor;
    this.camY += (this.targetY - this.camY) * this.lerpFactor;
    this.camZ += (this.targetZ - this.camZ) * this.lerpFactor;
    this.roll += (this.targetRoll - this.roll) * this.lerpFactor;
    this.yaw += (this.targetYaw - this.yaw) * this.lerpFactor;
    this.pitch += (this.targetPitch - this.pitch) * this.lerpFactor;
  }

  /**
   * Applies the VR Camera transform to a 2D canvas context for a given depth layer
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width Canvas width
   * @param {number} height Canvas height
   * @param {number} depthParallax Parallax factor (0.0 = fixed HUD, 0.3 = distant background, 1.0 = fighter plane, 1.4 = foreground)
   */
  applyTransform(ctx, width, height, depthParallax = 1.0) {
    if (!this.enabled) return;

    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // Lateral and vertical parallax translation
    const maxShiftX = width * 0.16;
    const maxShiftY = height * 0.14;

    const shiftX = -this.camX * maxShiftX * depthParallax;
    const shiftY = -this.camY * maxShiftY * depthParallax;

    // Zoom scale from leaning in/out
    const zoom = 1.0 + (this.camZ - 1.0) * depthParallax;

    // Subtle head tilt roll
    const rollAngle = -this.roll * depthParallax * 0.5;

    ctx.translate(centerX, centerY);
    ctx.rotate(rollAngle);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX + shiftX, -centerY + shiftY);
  }

  /**
   * Renders a 3D Perspective Virtual Arena (Floor Grid, Ring Ropes, Stadium Lights)
   * that reacts in real-time to the head tracking camera position.
   * @param {boolean} overlayMode When true, preserves webcam video transparency so user is clearly visible
   */
  render3DArena(ctx, width, height, overlayMode = true) {
    ctx.save();

    const cx = width * 0.5;
    const cy = height * 0.55;

    // Vanishing Point shifts with Head Position (The core of Fish-Tank VR!)
    // When you move left (camX < 0), vanishing point shifts right
    // When you duck down (camY > 0), vanishing point shifts down so ropes and ring rise up
    const vpX = cx - (this.camX * width * 0.22);
    const vpY = cy * 0.85 + (this.camY * height * 0.18);

    // 1. Distant Dark Arena Atmosphere & Cyber Vignette
    if (!overlayMode) {
      const bgGrad = ctx.createRadialGradient(vpX, vpY, 80, cx, cy, width * 0.85);
      bgGrad.addColorStop(0, 'rgba(0, 243, 255, 0.08)');
      bgGrad.addColorStop(0.4, 'rgba(10, 16, 28, 0.95)');
      bgGrad.addColorStop(1, '#06080d');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Overhead Stadium Spotlights (Volumetric Beams)
    this.drawSpotlights(ctx, width, height, vpX, vpY);

    // 3. 3D Perspective Floor Canvas Grid (The Boxing Ring Floor)
    this.drawRingFloor(ctx, width, height, vpX, vpY, overlayMode);

    // 4. Glowing Neon Boxing Ring Ropes (Parallax 3D Ropes)
    this.drawRingRopes(ctx, width, height, vpX, vpY);

    ctx.restore();
  }

  drawSpotlights(ctx, width, height, vpX, vpY) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Left Spotlight Beam
    const leftGrad = ctx.createRadialGradient(width * 0.15, -40, 10, vpX, vpY + 100, width * 0.6);
    leftGrad.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
    leftGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(width * 0.15 - 50, -40);
    ctx.lineTo(width * 0.15 + 50, -40);
    ctx.lineTo(vpX + 220, height * 0.9);
    ctx.lineTo(vpX - 180, height * 0.9);
    ctx.closePath();
    ctx.fill();

    // Right Spotlight Beam
    const rightGrad = ctx.createRadialGradient(width * 0.85, -40, 10, vpX, vpY + 100, width * 0.6);
    rightGrad.addColorStop(0, 'rgba(255, 0, 119, 0.12)');
    rightGrad.addColorStop(1, 'rgba(255, 0, 119, 0)');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(width * 0.85 - 50, -40);
    ctx.lineTo(width * 0.85 + 50, -40);
    ctx.lineTo(vpX + 280, height * 0.9);
    ctx.lineTo(vpX - 120, height * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawRingFloor(ctx, width, height, vpX, vpY, overlayMode = true) {
    ctx.save();

    const horizonY = vpY + 40;
    const floorBottomY = height;

    // Floor base - transparent in overlay mode so user webcam is clearly visible
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, floorBottomY);
    if (overlayMode) {
      floorGrad.addColorStop(0, 'rgba(12, 17, 26, 0.20)');
      floorGrad.addColorStop(1, 'rgba(8, 12, 20, 0.55)');
    } else {
      floorGrad.addColorStop(0, 'rgba(12, 17, 26, 0.95)');
      floorGrad.addColorStop(1, 'rgba(8, 12, 20, 0.98)');
    }
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, width, floorBottomY - horizonY);

    // Perspective Grid Lines radiating from Vanishing Point
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 1.5;

    const numRadials = 16;
    for (let i = 0; i <= numRadials; i++) {
      const bottomX = (width / numRadials) * i;
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      ctx.lineTo(bottomX, floorBottomY);
      ctx.stroke();
    }

    // Horizontal Depth Grid Rungs (Logarithmic spacing for authentic 3D depth)
    const numRungs = 12;
    for (let i = 1; i <= numRungs; i++) {
      const t = Math.pow(i / numRungs, 2.2); // Exponential spacing
      const rungY = horizonY + (floorBottomY - horizonY) * t;

      const alpha = 0.04 + t * 0.22;
      ctx.strokeStyle = `rgba(0, 243, 255, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(0, rungY);
      ctx.lineTo(width, rungY);
      ctx.stroke();
    }

    // Central Boxing Octagon / Ring Decal
    const ringCenterY = (horizonY + floorBottomY) * 0.52;
    const rx = width * 0.28 * this.camZ;
    const ry = (floorBottomY - horizonY) * 0.26 * this.camZ;

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(vpX, ringCenterY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawRingRopes(ctx, width, height, vpX, vpY) {
    ctx.save();

    // Ropes shift with camera parallax
    const ropeParallax = 0.45;
    const shiftX = -this.camX * width * 0.1 * ropeParallax;
    const shiftY = -this.camY * height * 0.08 * ropeParallax;

    const ropeY1 = height * 0.38 + shiftY;
    const ropeY2 = height * 0.46 + shiftY;
    const ropeY3 = height * 0.54 + shiftY;

    // Glowing Neon Cyan and Crimson Ring Ropes
    const ropes = [
      { y: ropeY1, color: 'rgba(0, 243, 255, 0.55)', blur: 8 },
      { y: ropeY2, color: 'rgba(255, 199, 0, 0.5)', blur: 6 },
      { y: ropeY3, color: 'rgba(255, 51, 102, 0.55)', blur: 8 }
    ];

    for (const r of ropes) {
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = r.blur;

      ctx.beginPath();
      // Slight catenary curve dip in center
      ctx.moveTo(-50, r.y);
      ctx.quadraticCurveTo(width * 0.5 + shiftX, r.y + 12, width + 50, r.y);
      ctx.stroke();
    }

    // Corner Turnbuckle Posts
    const leftPostX = width * 0.08 + shiftX * 0.7;
    const rightPostX = width * 0.92 + shiftX * 0.7;

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;

    // Left Post
    ctx.beginPath();
    ctx.moveTo(leftPostX, height * 0.25);
    ctx.lineTo(leftPostX, height * 0.85);
    ctx.stroke();

    // Right Post
    ctx.beginPath();
    ctx.moveTo(rightPostX, height * 0.25);
    ctx.lineTo(rightPostX, height * 0.85);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the Diegetic High-Tech VR Head Telemetry HUD Widget
   */
  renderVRHUD(ctx, width, height) {
    if (!this.enabled) return;

    ctx.save();

    // Top Right VR Tracking Pill / Gimbal
    const boxW = 190;
    const boxH = 46;
    const x = width - boxW - 28;
    const y = 80;

    // Glass backdrop
    ctx.fillStyle = 'rgba(14, 18, 28, 0.75)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 243, 255, 0.2)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Mini 3D Head Gimbal Reticle
    const gx = x + 24;
    const gy = y + 23;

    // Gimbal outer ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gx, gy, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Gimbal head target dot
    const dotX = gx + this.camX * 9;
    const dotY = gy + this.camY * 9;

    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx - 16, gy);
    ctx.lineTo(gx + 16, gy);
    ctx.moveTo(gx, gy - 16);
    ctx.lineTo(gx, gy + 16);
    ctx.stroke();

    // Telemetry text
    ctx.font = '900 10px "Russo One", sans-serif';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    ctx.fillText('🥽 VR HEAD TRACKING', x + 48, y + 18);

    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    const zoomText = `${Math.round(this.camZ * 100)}%`;
    const tiltDeg = Math.round(this.roll * (180 / Math.PI));
    ctx.fillText(`FOV: ${zoomText}  |  TILT: ${tiltDeg}°`, x + 48, y + 33);

    ctx.restore();
  }
}
