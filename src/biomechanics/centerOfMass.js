import { LM, interp, dist2D } from './landmarks.js';

/**
 * Whole-Body Center of Mass (CoM) using Paolo de Leva's (1996) anthropometric segment parameters.
 */
export function computeCenterOfMass(lm) {
  if (!lm || lm.length < 33) {
    return { x: 0.5, y: 0.5, z: 0 };
  }

  const sL = lm[LM.LEFT_SHOULDER];
  const sR = lm[LM.RIGHT_SHOULDER];
  const hL = lm[LM.LEFT_HIP];
  const hR = lm[LM.RIGHT_HIP];
  const eL = lm[LM.LEFT_EAR] || sL;
  const eR = lm[LM.RIGHT_EAR] || sR;

  const shoulderMid = interp(sL, sR, 0.5);
  const hipMid = interp(hL, hR, 0.5);
  const earMid = interp(eL, eR, 0.5);

  // 14 standard body segments & masses according to de Leva (1996)
  const segments = [
    // Head & Neck (6.9%)
    { pos: interp(earMid, lm[LM.NOSE], 0.50), weight: 0.069 },
    // Trunk: Thorax + Pelvis (43.5%)
    { pos: interp(shoulderMid, hipMid, 0.44), weight: 0.435 },
    // Left Upper Arm (2.7%)
    { pos: interp(sL, lm[LM.LEFT_ELBOW], 0.575), weight: 0.027 },
    // Right Upper Arm (2.7%)
    { pos: interp(sR, lm[LM.RIGHT_ELBOW], 0.575), weight: 0.027 },
    // Left Forearm (1.6%)
    { pos: interp(lm[LM.LEFT_ELBOW], lm[LM.LEFT_WRIST], 0.456), weight: 0.016 },
    // Right Forearm (1.6%)
    { pos: interp(lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_WRIST], 0.456), weight: 0.016 },
    // Left Hand (0.6%)
    { pos: interp(lm[LM.LEFT_WRIST], lm[LM.LEFT_INDEX] || lm[LM.LEFT_WRIST], 0.468), weight: 0.006 },
    // Right Hand (0.6%)
    { pos: interp(lm[LM.RIGHT_WRIST], lm[LM.RIGHT_INDEX] || lm[LM.RIGHT_WRIST], 0.468), weight: 0.006 },
    // Left Thigh (14.2%)
    { pos: interp(hL, lm[LM.LEFT_KNEE], 0.372), weight: 0.142 },
    // Right Thigh (14.2%)
    { pos: interp(hR, lm[LM.RIGHT_KNEE], 0.372), weight: 0.142 },
    // Left Shank/Calf (4.3%)
    { pos: interp(lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE], 0.371), weight: 0.043 },
    // Right Shank/Calf (4.3%)
    { pos: interp(lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE], 0.371), weight: 0.043 },
    // Left Foot (1.4%)
    { pos: interp(lm[LM.LEFT_ANKLE], lm[LM.LEFT_FOOT_INDEX] || lm[LM.LEFT_ANKLE], 0.401), weight: 0.014 },
    // Right Foot (1.4%)
    { pos: interp(lm[LM.RIGHT_ANKLE], lm[LM.RIGHT_FOOT_INDEX] || lm[LM.RIGHT_ANKLE], 0.401), weight: 0.014 }
  ];

  let totalWeight = 0;
  let cx = 0, cy = 0, cz = 0;

  for (const seg of segments) {
    if (!seg.pos) continue;
    cx += seg.pos.x * seg.weight;
    cy += seg.pos.y * seg.weight;
    cz += (seg.pos.z ?? 0) * seg.weight;
    totalWeight += seg.weight;
  }

  if (totalWeight > 0) {
    cx /= totalWeight;
    cy /= totalWeight;
    cz /= totalWeight;
  }

  return { x: cx, y: cy, z: cz };
}

/**
 * Analyzes Center of Mass in relation to the Base of Support (BoS)
 */
export function analyzeBalance(lm) {
  const com = computeCenterOfMass(lm);
  if (!lm || lm.length < 33) {
    return { com, isBalanced: true, balanceRatio: 0.5, stanceWidth: 0.3, warning: null };
  }

  // Base of Support (BoS) reference points: ankles and hips fallback
  const aL = lm[LM.LEFT_ANKLE];
  const aR = lm[LM.RIGHT_ANKLE];
  const hL = lm[LM.LEFT_HIP];
  const hR = lm[LM.RIGHT_HIP];

  const hasFeet = (aL.visibility ?? 1) > 0.4 && (aR.visibility ?? 1) > 0.4;
  const leftRef = hasFeet ? aL : hL;
  const rightRef = hasFeet ? aR : hR;

  const minX = Math.min(leftRef.x, rightRef.x);
  const maxX = Math.max(leftRef.x, rightRef.x);
  const stanceWidth = Math.max(0.1, maxX - minX);

  // Position of CoM relative to stance width (0 = left foot/hip, 1 = right foot/hip)
  const balanceRatio = (com.x - minX) / stanceWidth;

  let warning = null;
  let isBalanced = true;

  if (balanceRatio < 0.2) {
    warning = 'LEANING TOO FAR LEFT';
    isBalanced = false;
  } else if (balanceRatio > 0.8) {
    warning = 'LEANING TOO FAR RIGHT';
    isBalanced = false;
  }

  // Check posture lean angle (nose vs hip center)
  const hipCenterX = (hL.x + hR.x) / 2;
  const noseX = lm[LM.NOSE].x;
  const leanOffset = Math.abs(noseX - hipCenterX);

  if (leanOffset > stanceWidth * 0.75) {
    warning = 'OVERBALANCED / LURCHING FORWARD';
    isBalanced = false;
  }

  return {
    com,
    bos: { minX, maxX, width: stanceWidth, y: Math.max(leftRef.y, rightRef.y) },
    balanceRatio: Math.max(0, Math.min(1, balanceRatio)),
    stanceWidth,
    isBalanced,
    warning
  };
}
