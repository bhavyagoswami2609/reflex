import {
  LM,
  dist2D,
  dist3D,
  calculateAngle3D,
  getBodyMetrics,
  calculateElbowPerpendicularDeviation,
  calculateShoulderYaw
} from './landmarks.js';
import { analyzeBalance } from './centerOfMass.js';

/**
 * Biomechanical Boxing Form Checker & Multi-Punch Kinematics Classifier
 * Identifies:
 * - JAB (Lead straight punch down the centerline)
 * - CROSS (Rear straight punch with hip/shoulder torque)
 * - HOOK (Lead or rear horizontal circular arc with bent elbow)
 * - UPPERCUT (Vertical upward kinetic drive with bent elbow from waist to chin)
 */
export class FormChecker {
  constructor() {
    this.history = []; // rolling frame buffer (last 20 frames)
    
    // Per-arm punch state machine: 'GUARD' | 'EXTENDING' | 'RETRACTING'
    this.armState = {
      LEFT: {
        state: 'GUARD',
        startAngle: 80,
        peakAngle: 80,
        startTime: 0,
        startWrist: null,
        peakWrist: null,
        maxVelX: 0,
        maxVelY: 0
      },
      RIGHT: {
        state: 'GUARD',
        startAngle: 80,
        peakAngle: 80,
        startTime: 0,
        startWrist: null,
        peakWrist: null,
        maxVelX: 0,
        maxVelY: 0
      }
    };
    
    this.lastPunchTime = 0;
    this.stats = {
      totalPunches: 0,
      jabs: 0,
      crosses: 0,
      hooks: 0,
      uppercuts: 0,
      perfectCount: 0,
      flawsCount: {
        droppedGuard: 0,
        chickenWing: 0,
        noHipRotation: 0,
        incompleteExtension: 0,
        offBalance: 0
      },
      averageScore: 100,
      scores: []
    };
  }

  resetStats() {
    this.stats = {
      totalPunches: 0,
      jabs: 0,
      crosses: 0,
      hooks: 0,
      uppercuts: 0,
      perfectCount: 0,
      flawsCount: {
        droppedGuard: 0,
        chickenWing: 0,
        noHipRotation: 0,
        incompleteExtension: 0,
        offBalance: 0
      },
      averageScore: 100,
      scores: []
    };
    this.armState.LEFT.state = 'GUARD';
    this.armState.RIGHT.state = 'GUARD';
  }

  /**
   * Process incoming frame landmarks
   */
  processFrame(lm, timestamp = performance.now()) {
    if (!lm || lm.length < 33) {
      return {
        guard: { intact: true, score: 100, warnings: [] },
        punchEvent: null,
        balance: { isBalanced: true, com: { x: 0.5, y: 0.5 } }
      };
    }

    const { shoulderWidth, torsoLength, shoulderMid } = getBodyMetrics(lm);
    const balance = analyzeBalance(lm);

    // Save frame to rolling buffer
    const frameData = {
      timestamp,
      lm,
      wristL: { ...lm[LM.LEFT_WRIST] },
      wristR: { ...lm[LM.RIGHT_WRIST] },
      elbowL: { ...lm[LM.LEFT_ELBOW] },
      elbowR: { ...lm[LM.RIGHT_ELBOW] },
      shoulderL: { ...lm[LM.LEFT_SHOULDER] },
      shoulderR: { ...lm[LM.RIGHT_SHOULDER] }
    };

    this.history.push(frameData);
    if (this.history.length > 20) {
      this.history.shift();
    }

    // 1. Realistic Chin Guard Evaluation
    const guard = this.evaluateChinGuard(lm, shoulderWidth, torsoLength);

    // 2. High-Precision Punch State Machine & Multi-Attack Classifier
    let punchEvent = null;
    if (this.history.length >= 3) {
      punchEvent = this.evaluatePunchStateMachine(lm, shoulderWidth, torsoLength, balance, timestamp);
    }

    return {
      guard,
      punchEvent,
      balance
    };
  }

  /**
   * Evaluates Realistic Boxing Chin Guard
   */
  evaluateChinGuard(lm, shoulderWidth, torsoLength) {
    const warnings = [];
    let guardScore = 100;

    const wristL = lm[LM.LEFT_WRIST];
    const wristR = lm[LM.RIGHT_WRIST];
    const mouthL = lm[LM.MOUTH_LEFT] || lm[LM.NOSE];
    const mouthR = lm[LM.MOUTH_RIGHT] || lm[LM.NOSE];
    
    const chinY = ((mouthL.y + mouthR.y) / 2) + 0.04;

    const droppedThreshold = chinY + torsoLength * 0.28;
    const leftDropped = wristL.y > droppedThreshold;
    const rightDropped = wristR.y > droppedThreshold;

    if (leftDropped && rightDropped) {
      guardScore -= 40;
      warnings.push({ code: 'DROPPED_BOTH_HANDS', message: '⚠️ GUARD DOWN! Bring hands up to chin!' });
    } else if (leftDropped) {
      guardScore -= 20;
      warnings.push({ code: 'LEFT_HAND_LOW', message: '⚠️ LEFT GLOVE LOW! Anchor to chin!' });
    } else if (rightDropped) {
      guardScore -= 20;
      warnings.push({ code: 'RIGHT_HAND_LOW', message: '⚠️ RIGHT GLOVE LOW! Anchor to chin!' });
    }

    const elbowL = lm[LM.LEFT_ELBOW];
    const elbowR = lm[LM.RIGHT_ELBOW];
    const elbowSeparation = Math.abs(elbowL.x - elbowR.x);
    if (elbowSeparation > shoulderWidth * 1.45) {
      guardScore -= 15;
      warnings.push({ code: 'FLARED_ELBOWS', message: '⚠️ TUCK ELBOWS! Protect ribs from body shots!' });
    }

    return {
      intact: guardScore >= 70,
      score: Math.max(0, guardScore),
      warnings,
      chinY
    };
  }

  /**
   * Evaluates punch strokes across straight punches (Jab/Cross), Hooks, and Uppercuts
   */
  evaluatePunchStateMachine(lm, shoulderWidth, torsoLength, balance, now) {
    const sides = ['LEFT', 'RIGHT'];
    let result = null;

    for (const side of sides) {
      const isLeft = side === 'LEFT';
      const sIdx = isLeft ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
      const eIdx = isLeft ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
      const wIdx = isLeft ? LM.LEFT_WRIST : LM.RIGHT_WRIST;

      const oppGuardWristIdx = isLeft ? LM.RIGHT_WRIST : LM.LEFT_WRIST;
      const oppGuardEarIdx = isLeft ? LM.RIGHT_EAR : LM.LEFT_EAR;

      const shoulder = lm[sIdx];
      const elbow = lm[eIdx];
      const wrist = lm[wIdx];
      const elbowAngle = calculateAngle3D(shoulder, elbow, wrist);
      const arm = this.armState[side];

      // Calculate recent wrist velocity from history
      const prevFrame = this.history[Math.max(0, this.history.length - 3)];
      const prevWrist = isLeft ? prevFrame.wristL : prevFrame.wristR;
      const dt = Math.max(0.016, (now - prevFrame.timestamp) / 1000);
      const velX = Math.abs(wrist.x - prevWrist.x) / dt;
      const velY = (wrist.y - prevWrist.y) / dt; // Negative means moving UP
      const velTotal = Math.sqrt((wrist.x - prevWrist.x) ** 2 + (wrist.y - prevWrist.y) ** 2) / dt;

      // Essential Guard & Elevation Check:
      // A punch is thrown from or through elevated torso/chin height.
      // If hands are resting down at the waist, thighs, or in lap (wrist.y > shoulder.y + torsoLength * 0.70), it is NEVER a punch!
      const isHandElevated = wrist.y < (shoulder.y + torsoLength * 0.70);

      // --- STATE 1: GUARD ---
      if (arm.state === 'GUARD') {
        // Record baseline guard angle only when arm is bent and elevated in guard stance
        if (elbowAngle < 105 && isHandElevated) {
          arm.startAngle = elbowAngle;
          arm.startWrist = { ...wrist };
        }

        // Must be elevated and have real explosive strike velocity!
        const isStraightExtend = isHandElevated && (elbowAngle > 125) && (elbowAngle - (arm.startAngle || 85) > 32) && (velTotal > 1.45);
        const isHookArc = isHandElevated && (velX > 1.6) && Math.abs(elbow.y - shoulder.y) < torsoLength * 0.28 && (elbowAngle >= 70 && elbowAngle <= 125);
        const isUppercutDrive = isHandElevated && (velY < -1.3) && (wrist.y < elbow.y + 0.10) && (elbowAngle >= 65 && elbowAngle <= 120);

        if (isStraightExtend || isHookArc || isUppercutDrive) {
          arm.state = 'EXTENDING';
          arm.peakAngle = elbowAngle;
          arm.startTime = now;
          arm.startWrist = arm.startWrist || { ...wrist };
          arm.peakWrist = { ...wrist };
          arm.maxVelX = velX;
          arm.maxVelY = velY;
          arm.maxVelTotal = velTotal;
        }
      } 
      // --- STATE 2: EXTENDING / STRIKING ---
      else if (arm.state === 'EXTENDING') {
        if (!isHandElevated) {
          // Hand dropped down to waist/lap: cancel punch
          arm.state = 'GUARD';
          continue;
        }

        if (elbowAngle > arm.peakAngle) {
          arm.peakAngle = elbowAngle;
        }
        arm.peakWrist = { ...wrist };
        arm.maxVelX = Math.max(arm.maxVelX, velX);
        if (velY < arm.maxVelY) arm.maxVelY = velY;
        arm.maxVelTotal = Math.max(arm.maxVelTotal || 0, velTotal);

        const duration = now - arm.startTime;
        const reachedFullStraight = arm.peakAngle >= 142;
        const isRetracting = elbowAngle < arm.peakAngle - 8;

        // Hook trigger: swept across with bent elbow and high velocity
        const startW = arm.startWrist || wrist;
        const sweptDistX = Math.abs(wrist.x - startW.x);
        const isHookFinished = sweptDistX > torsoLength * 0.20 && arm.peakAngle <= 130 && arm.maxVelX > 1.6 && isRetracting;

        // Uppercut trigger: driven upward with bent elbow and high upward velocity
        const upwardDistY = startW.y - wrist.y;
        const isUppercutFinished = upwardDistY > torsoLength * 0.15 && arm.peakAngle <= 125 && arm.maxVelY < -1.3 && isRetracting;

        // Straight punch MUST be retracting and had true explosive speed!
        const isStraightFinished = reachedFullStraight && isRetracting && (arm.maxVelTotal > 1.5);

        const apexReached = isStraightFinished || isHookFinished || isUppercutFinished;

        if (apexReached) {
          if (now - this.lastPunchTime > 280) {
            result = this.gradeDeliberatePunch(
              side,
              arm.peakAngle,
              arm.peakWrist,
              startW,
              lm,
              shoulderWidth,
              torsoLength,
              balance,
              oppGuardWristIdx,
              oppGuardEarIdx,
              duration,
              arm.maxVelX,
              arm.maxVelY
            );
            this.lastPunchTime = now;
          }
          arm.state = 'RETRACTING';
        } else if (duration > 550) {
          // Timed out without proper punch retraction or speed - reset cleanly
          arm.state = 'GUARD';
        }
      } 
      // --- STATE 3: RETRACTING ---
      else if (arm.state === 'RETRACTING') {
        if (elbowAngle < 115 || !isHandElevated) {
          arm.state = 'GUARD';
          arm.startAngle = elbowAngle;
        }
      }
    }

    return result;
  }

  /**
   * Grades punch mechanics and classifies exact attack type (JAB, CROSS, HOOK, UPPERCUT)
   */
  gradeDeliberatePunch(side, elbowAngle, wristPos, startWrist, lm, shoulderWidth, torsoLength, balance, oppWIdx, oppEarIdx, duration, maxVelX, maxVelY) {
    const sIdx = side === 'LEFT' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
    const eIdx = side === 'LEFT' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
    const wIdx = side === 'LEFT' ? LM.LEFT_WRIST : LM.RIGHT_WRIST;

    const shoulder = lm[sIdx];
    const elbow = lm[eIdx];
    const wrist = lm[wIdx];

    // Absolute safeguard: wrist must be elevated above lower torso level (never resting at waist/lap)
    if (wristPos.y > shoulder.y + torsoLength * 0.70) {
      return null;
    }

    const shoulderYaw = Math.abs(calculateShoulderYaw(lm));
    const mouthL = lm[LM.MOUTH_LEFT] || lm[LM.NOSE];
    const chinY = mouthL.y + 0.04;

    // Classification criteria
    let type = 'JAB';

    const sweptDistX = Math.abs(wristPos.x - startWrist.x);
    const upwardDistY = startWrist.y - wristPos.y;

    if (elbowAngle < 132 && upwardDistY > torsoLength * 0.14 && maxVelY < -1.1) {
      // 1. UPPERCUT: Upward vertical drive with bent elbow
      type = side === 'LEFT' ? 'LEFT_UPPERCUT' : 'RIGHT_UPPERCUT';
    } else if (elbowAngle < 135 && sweptDistX > torsoLength * 0.18 && Math.abs(elbow.y - shoulder.y) < torsoLength * 0.28) {
      // 2. HOOK: Lateral circular sweep with bent elbow at shoulder level
      type = side === 'LEFT' ? 'LEFT_HOOK' : 'RIGHT_HOOK';
    } else {
      // 3. STRAIGHT PUNCH: Full linear extension down centerline
      if (side === 'LEFT') {
        type = shoulderYaw > 22 ? 'CROSS' : 'JAB';
      } else {
        type = 'CROSS';
      }
    }

    let formScore = 100;
    const flaws = [];
    const praise = [];

    // 1. Opposite Hand Chin Guard Check
    const oppWrist = lm[oppWIdx];
    const maxGuardY = chinY + torsoLength * 0.28;
    if (oppWrist.y > maxGuardY) {
      formScore -= 25;
      const droppedSide = side === 'LEFT' ? 'RIGHT' : 'LEFT';
      flaws.push(`DROPPED ${droppedSide} GUARD! Keep other hand glued to your chin!`);
      this.stats.flawsCount.droppedGuard++;
    } else {
      praise.push('TIGHT CHIN GUARD MAINTAINED!');
    }

    // 2. Mechanics Checks Specific to Attack Type
    if (type === 'JAB' || type === 'CROSS') {
      if (elbowAngle < 152) {
        formScore -= 20;
        flaws.push('SHORT ARM PUNCH! Snap to full straight extension!');
        this.stats.flawsCount.incompleteExtension++;
      } else {
        praise.push('EXCELLENT FULL EXTENSION!');
      }

      if (type === 'CROSS') {
        if (shoulderYaw < 18) {
          formScore -= 20;
          flaws.push('NO HIP TORQUE! Rotate hips & rear foot on the cross!');
          this.stats.flawsCount.noHipRotation++;
        } else {
          praise.push('POWERFUL HIP SNAP!');
        }
      }
    } else if (type.includes('HOOK')) {
      if (Math.abs(elbow.y - shoulder.y) > torsoLength * 0.26) {
        formScore -= 20;
        flaws.push('DROPPED ELBOW ON HOOK! Raise elbow level with shoulder!');
      } else {
        praise.push('CRISP HORIZONTAL HOOK ARC!');
      }
      if (shoulderYaw < 15) {
        formScore -= 20;
        flaws.push('ENGAGE CORE! Pivot lead foot and hips through the hook!');
      }
    } else if (type.includes('UPPERCUT')) {
      if (wristPos.y > chinY + 0.08) {
        formScore -= 20;
        flaws.push('DRIVE HIGHER! Accelerate uppercut directly up through the chin!');
      } else {
        praise.push('EXPLOSIVE VERTICAL DRIVE!');
      }
    }

    // 3. Balance Check
    if (!balance.isBalanced) {
      formScore -= 15;
      flaws.push(`OFF BALANCE! Keep center of mass grounded!`);
      this.stats.flawsCount.offBalance++;
    }

    formScore = Math.max(10, Math.min(100, formScore));

    let grade = 'GOOD';
    if (formScore >= 90) {
      grade = 'PERFECT!';
      this.stats.perfectCount++;
    } else if (formScore >= 75) {
      grade = 'GREAT!';
    } else if (formScore >= 55) {
      grade = 'DECENT';
    } else {
      grade = 'FLAWED';
    }

    // Speed estimation in km/h
    const strokeDistance = torsoLength * 0.85;
    const speedMs = strokeDistance / Math.max(0.08, duration / 1000);
    const speedKmh = Math.min(52, Math.max(18, Math.round(speedMs * 3.6)));

    // Stats recording
    this.stats.totalPunches++;
    if (type === 'JAB') this.stats.jabs++;
    else if (type === 'CROSS') this.stats.crosses++;
    else if (type.includes('HOOK')) this.stats.hooks++;
    else if (type.includes('UPPERCUT')) this.stats.uppercuts++;

    this.stats.scores.push(formScore);
    if (this.stats.scores.length > 50) this.stats.scores.shift();
    const sum = this.stats.scores.reduce((a, b) => a + b, 0);
    this.stats.averageScore = Math.round(sum / this.stats.scores.length);

    return {
      type,
      side,
      elbowAngle: Math.round(elbowAngle),
      speedKmh,
      score: formScore,
      grade,
      flaws,
      praise,
      wristPos: { x: wristPos.x, y: wristPos.y }
    };
  }
}

export default FormChecker;
