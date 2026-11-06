import { LM, POSE_CONNECTIONS } from '../biomechanics/landmarks.js';

/**
 * Modern High-Precision Cyberpunk Skeleton & Chin-Guard HUD Overlay
 */
export class SkeletonRenderer {
  constructor() {
    this.neonCyan = '#00f3ff';
    this.neonGreen = '#00ff66';
    this.warningRed = '#ff3366';
    this.warningYellow = '#ffe600';
  }

  render(ctx, lm, evaluation, width, height) {
    if (!lm || lm.length < 33) return;

    ctx.save();

    // 1. Draw Sleek Bones
    this.drawBones(ctx, lm, evaluation, width, height);

    // 2. Draw Sleek Joint Nodes
    this.drawJoints(ctx, lm, evaluation, width, height);

    // 3. Draw Center of Mass (CoM) Ground Reticle
    this.drawBalanceHUD(ctx, lm, evaluation.balance, width, height);

    // 4. Draw Realistic Chin-Level Guard Shield (NOT covering face!)
    this.drawChinGuardZone(ctx, lm, evaluation.guard, width, height);

    ctx.restore();
  }

  drawBones(ctx, lm, evaluation, width, height) {
    ctx.lineWidth = 2.5;

    for (const [i, j] of POSE_CONNECTIONS) {
      const p1 = lm[i];
      const p2 = lm[j];
      if (!p1 || !p2 || (p1.visibility ?? 1) < 0.4 || (p2.visibility ?? 1) < 0.4) continue;

      const isArm = (i === LM.LEFT_SHOULDER && j === LM.LEFT_ELBOW) ||
                    (i === LM.LEFT_ELBOW && j === LM.LEFT_WRIST) ||
                    (i === LM.RIGHT_SHOULDER && j === LM.RIGHT_ELBOW) ||
                    (i === LM.RIGHT_ELBOW && j === LM.RIGHT_WRIST);

      if (isArm && evaluation.guard && !evaluation.guard.intact) {
        ctx.strokeStyle = this.warningYellow;
        ctx.shadowColor = this.warningYellow;
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = this.neonCyan;
        ctx.shadowColor = this.neonCyan;
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  }

  drawJoints(ctx, lm, evaluation, width, height) {
    for (let i = 0; i < lm.length; i++) {
      const p = lm[i];
      if (!p || (p.visibility ?? 1) < 0.4) continue;

      // Skip facial landmark dots except nose to avoid cluttering face
      if (i >= 1 && i <= 10) continue;

      const isWrist = i === LM.LEFT_WRIST || i === LM.RIGHT_WRIST;
      const isElbow = i === LM.LEFT_ELBOW || i === LM.RIGHT_ELBOW;

      let radius = 4;
      let color = this.neonGreen;

      if (isWrist) {
        radius = 8;
        color = evaluation.guard && !evaluation.guard.intact ? this.warningRed : '#00f3ff';
      } else if (isElbow) {
        radius = 5;
        color = '#00f3ff';
      }

      const x = p.x * width;
      const y = p.y * height;

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isWrist) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawBalanceHUD(ctx, lm, balance, width, height) {
    if (!balance || !balance.com) return;

    const comX = balance.com.x * width;
    const comY = balance.com.y * height;
    const isBalanced = balance.isBalanced;

    ctx.save();

    // Base of Support floor indicator
    if (balance.bos) {
      const bMinX = balance.bos.minX * width;
      const bMaxX = balance.bos.maxX * width;
      const floorY = balance.bos.y * height + 15;

      ctx.strokeStyle = isBalanced ? 'rgba(0, 243, 255, 0.4)' : 'rgba(255, 51, 102, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bMinX, floorY);
      ctx.lineTo(bMaxX, floorY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // CoM crosshair
    const reticleColor = isBalanced ? this.neonGreen : this.warningYellow;
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = reticleColor;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.arc(comX, comY, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(comX - 16, comY);
    ctx.lineTo(comX + 16, comY);
    ctx.moveTo(comX, comY - 16);
    ctx.lineTo(comX, comY + 16);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Realistic Chin-Level Guard Zone
   * Anchors specifically at the jawline/chin — NEVER covers the face or eyes!
   */
  drawChinGuardZone(ctx, lm, guard, width, height) {
    const mouthL = lm[LM.MOUTH_LEFT] || lm[LM.NOSE];
    const mouthR = lm[LM.MOUTH_RIGHT] || lm[LM.NOSE];
    if (!mouthL || !mouthR) return;

    // Chin coordinates (just below mouth)
    const chinX = ((mouthL.x + mouthR.x) / 2) * width;
    const chinY = (((mouthL.y + mouthR.y) / 2) + 0.05) * height;

    const isIntact = guard && guard.intact;
    const shieldColor = isIntact ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 51, 102, 0.2)';
    const strokeColor = isIntact ? '#00ff66' : '#ff3366';

    ctx.save();
    ctx.fillStyle = shieldColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

    // Sleek chin-guard capsule bar protecting the jawline
    const barW = 100;
    const barH = 26;
    ctx.beginPath();
    ctx.roundRect(chinX - barW / 2, chinY, barW, barH, 13);
    ctx.fill();
    ctx.stroke();

    // Crisp label
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isIntact ? '#00ff66' : '#ff3366';
    ctx.shadowBlur = 0;
    ctx.fillText(isIntact ? 'CHIN PROTECTED' : 'CHIN EXPOSED', chinX, chinY + 17);

    ctx.restore();
  }
}
