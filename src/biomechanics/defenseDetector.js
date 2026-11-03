import { LM, dist2D, calculateAngle3D, getBodyMetrics } from './landmarks.js';

/**
 * Real-time defense / evasion detector & Camera-Space Spatial Tracker.
 * 
 * Features:
 * - Locked Neutral Baseline in Camera Coordinates (prevents passive drift)
 * - Camera-Relative Dodge Thresholds (Slip Left, Slip Right, Duck, High Guard Block)
 * - Dynamic Spatial Defense Grid Overlay on Camera
 */
export class DefenseDetector {
  constructor() {
    this.baselineHead = null; // { x, y } in normalized coordinates
    this.baselineHips = null; // { x, y }
    this.baselineTorsoLength = 0.40;
    this.baselineShoulderWidth = 0.30;
    this.isLocked = false;

    this.recenteredFlashTimer = 0;
    this.recenterCount = 0;

    // Spatial Telemetry
    this.telemetry = {
      deltaX: 0,
      deltaY: 0,
      slipAmount: 0, // -1 (full left) to +1 (full right)
      duckAmount: 0, // 0 to 1+
      guardIntegrity: 0,
      action: 'NEUTRAL',
      isCentered: true
    };
  }

  reset() {
    this.baselineHead = null;
    this.baselineHips = null;
    this.isLocked = false;
    this.recenteredFlashTimer = 0;
  }

  /**
   * Re-centers the neutral baseline to the current player position
   * @param {Array} lm 33 MediaPipe landmarks
   * @returns {boolean} Whether re-centering succeeded
   */
  recenter(lm) {
    if (!lm || lm.length < 33) return false;

    const { shoulderWidth, torsoLength } = getBodyMetrics(lm);
    const nose = lm[LM.NOSE];
    const hipCenter = (lm[LM.LEFT_HIP].x + lm[LM.RIGHT_HIP].x) / 2;
    const hipCenterY = (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2;

    this.baselineHead = { x: nose.x, y: nose.y };
    this.baselineHips = { x: hipCenter, y: hipCenterY };
    this.baselineTorsoLength = Math.max(0.25, torsoLength);
    this.baselineShoulderWidth = Math.max(0.18, shoulderWidth);
    this.isLocked = true;
    this.recenteredFlashTimer = performance.now() + 1800;
    this.recenterCount++;

    return true;
  }

  /**
   * Main detection loop: Computes camera-relative defenses
   * @param {Array} lm 33 MediaPipe landmarks
   * @returns {Object} Active defense state
   */
  detect(lm) {
    if (!lm || lm.length < 33) {
      return {
        action: 'NONE',
        slipLeft: false,
        slipRight: false,
        ducking: false,
        blocking: false,
        deltaX: 0,
        deltaY: 0,
        guardIntegrity: 0,
        isCentered: false
      };
    }

    const { shoulderWidth, torsoLength, shoulderMid, hipMid } = getBodyMetrics(lm);
    const nose = lm[LM.NOSE];
    const wristL = lm[LM.LEFT_WRIST];
    const wristR = lm[LM.RIGHT_WRIST];
    const mouthL = lm[LM.MOUTH_LEFT];
    const mouthR = lm[LM.MOUTH_RIGHT];
    const chinY = (mouthL.y + mouthR.y) / 2;
    const hipCenter = (lm[LM.LEFT_HIP].x + lm[LM.RIGHT_HIP].x) / 2;

    // Initial automatic calibration if not yet locked
    if (!this.baselineHead) {
      this.baselineHead = { x: nose.x, y: nose.y };
      this.baselineHips = { x: hipCenter, y: (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2 };
      this.baselineTorsoLength = torsoLength;
      this.baselineShoulderWidth = shoulderWidth;
    }

    // CAMERA-RELATIVE DISPLACEMENT FROM LOCKED CENTER
    const deltaXFromNeutral = nose.x - this.baselineHead.x;
    const deltaYFromNeutral = nose.y - this.baselineHead.y;

    // Defense Thresholds relative to body proportions
    const slipThreshold = this.baselineShoulderWidth * 0.20;
    const duckThreshold = this.baselineTorsoLength * 0.12;

    // Lateral Slip Checks (mirrored coordinates: +X is screen right, -X is screen left)
    const hipLean = nose.x - hipCenter;
    const slipRight = deltaXFromNeutral > slipThreshold || hipLean > slipThreshold * 0.9;
    const slipLeft = deltaXFromNeutral < -slipThreshold || hipLean < -slipThreshold * 0.9;

    // Duck Check (head drops significantly below locked baseline)
    const ducking = deltaYFromNeutral > duckThreshold;

    // High Guard Block: Both wrists compact near chin/jawline
    const leftWristUp = wristL.y <= chinY + this.baselineTorsoLength * 0.10;
    const rightWristUp = wristR.y <= chinY + this.baselineTorsoLength * 0.10;
    const wristsClose = Math.abs(wristL.x - wristR.x) <= this.baselineShoulderWidth * 0.65;
    const blocking = leftWristUp && rightWristUp && wristsClose;

    // Only adapt baseline slowly IF NOT locked by Spider-Man sign!
    if (!this.isLocked && !ducking && !slipLeft && !slipRight && !blocking) {
      this.baselineHead.x += (nose.x - this.baselineHead.x) * 0.015;
      this.baselineHead.y += (nose.y - this.baselineHead.y) * 0.015;
      this.baselineTorsoLength += (torsoLength - this.baselineTorsoLength) * 0.015;
      this.baselineShoulderWidth += (shoulderWidth - this.baselineShoulderWidth) * 0.015;
    }

    // Determine Primary Action
    let action = 'NEUTRAL';
    if (blocking) {
      action = 'HIGH_GUARD_BLOCK';
    } else if (ducking) {
      action = 'DUCK';
    } else if (slipLeft) {
      action = 'SLIP_LEFT';
    } else if (slipRight) {
      action = 'SLIP_RIGHT';
    }

    // Guard Integrity (0 to 100%)
    const earL = lm[LM.LEFT_EAR] || nose;
    const earR = lm[LM.RIGHT_EAR] || nose;
    const leftGuardDist = dist2D(wristL, earL) / this.baselineShoulderWidth;
    const rightGuardDist = dist2D(wristR, earR) / this.baselineShoulderWidth;
    const avgGuardDist = (leftGuardDist + rightGuardDist) / 2;
    const guardIntegrity = Math.max(0, Math.min(100, Math.round(100 - (avgGuardDist - 0.40) * 150)));

    const isCentered = !slipLeft && !slipRight && !ducking;

    this.telemetry = {
      action,
      slipLeft,
      slipRight,
      ducking,
      blocking,
      deltaX: deltaXFromNeutral,
      deltaY: deltaYFromNeutral,
      slipThreshold,
      duckThreshold,
      guardIntegrity,
      isCentered,
      isLocked: this.isLocked
    };

    return this.telemetry;
  }

  /**
   * Renders the Camera-Relative Spatial Defense Grid and Spider-Man lock visuals
   */
  renderSpatialGrid(ctx, width, height) {
    if (!this.baselineHead) return;

    ctx.save();

    const cx = this.baselineHead.x * width;
    const cy = this.baselineHead.y * height;
    const slipPx = (this.baselineShoulderWidth * 0.20) * width;
    const duckPx = (this.baselineTorsoLength * 0.12) * height;

    const { slipLeft, slipRight, ducking, blocking } = this.telemetry;

    // 1. Central Alignment Guideline (Locked Body Center)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.isLocked ? 'rgba(0, 243, 255, 0.40)' : 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Neutral Head Target Reticle
    ctx.setLineDash([]);
    ctx.strokeStyle = this.isLocked ? '#00f3ff' : '#94a3b8';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Left Slip Zone Rail
    const leftRailX = cx - slipPx;
    ctx.strokeStyle = slipLeft ? '#00ff88' : 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = slipLeft ? 3.0 : 1.5;
    ctx.setLineDash(slipLeft ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(leftRailX, cy - 80);
    ctx.lineTo(leftRailX, cy + 120);
    ctx.stroke();

    if (slipLeft) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '800 11px "Russo One", sans-serif';
      ctx.fillText('◀ SLIPPED LEFT (EVADED)', leftRailX - 145, cy + 10);
    }

    // 3. Right Slip Zone Rail
    const rightRailX = cx + slipPx;
    ctx.strokeStyle = slipRight ? '#00ff88' : 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = slipRight ? 3.0 : 1.5;
    ctx.setLineDash(slipRight ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(rightRailX, cy - 80);
    ctx.lineTo(rightRailX, cy + 120);
    ctx.stroke();

    if (slipRight) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '800 11px "Russo One", sans-serif';
      ctx.fillText('SLIPPED RIGHT (EVADED) ▶', rightRailX + 12, cy + 10);
    }

    // 4. Duck Threshold Line
    const duckLineY = cy + duckPx;
    ctx.strokeStyle = ducking ? '#00ff88' : 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = ducking ? 3.0 : 1.5;
    ctx.setLineDash(ducking ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx - slipPx * 1.5, duckLineY);
    ctx.lineTo(cx + slipPx * 1.5, duckLineY);
    ctx.stroke();

    if (ducking) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '800 11px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ DUCKED (EVADED)', cx, duckLineY + 22);
    }

    // 5. Re-Center Confirmation Flash Banner
    const now = performance.now();
    if (now < this.recenteredFlashTimer) {
      const remaining = this.recenteredFlashTimer - now;
      const alpha = Math.min(1.0, remaining / 600);

      ctx.globalAlpha = alpha;
      ctx.setLineDash([]);

      // Neon Crosshairs
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Cyber Capsule Banner
      const bannerW = 320;
      const bannerH = 34;
      const bx = cx - bannerW * 0.5;
      const by = cy - 75;

      ctx.fillStyle = 'rgba(8, 14, 24, 0.92)';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerW, bannerH, 17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f3ff';
      ctx.font = '800 13px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎯 BASELINE RE-CENTERED: LOCKED!', cx, by + bannerH * 0.5);
    }

    ctx.restore();
  }
}
