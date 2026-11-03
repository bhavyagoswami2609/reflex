/**
 * MediaPipe Pose 33 Landmark Constants & Biomechanical Math Utilities
 */

export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
};

// Skeletal connections for rendering
export const POSE_CONNECTIONS = [
  // Head
  [LM.LEFT_EAR, LM.LEFT_EYE], [LM.LEFT_EYE, LM.NOSE],
  [LM.NOSE, LM.RIGHT_EYE], [LM.RIGHT_EYE, LM.RIGHT_EAR],
  // Shoulders & Torso
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],
  // Left Arm
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],
  [LM.LEFT_WRIST, LM.LEFT_INDEX],
  // Right Arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  [LM.RIGHT_WRIST, LM.RIGHT_INDEX],
  // Left Leg
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],
  // Right Leg
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX]
];

/**
 * 3D interior angle at vertex B formed by points A - B - C in degrees
 */
export function calculateAngle3D(A, B, C) {
  if (!A || !B || !C) return 0;
  const u = { x: A.x - B.x, y: A.y - B.y, z: (A.z ?? 0) - (B.z ?? 0) };
  const v = { x: C.x - B.x, y: C.y - B.y, z: (C.z ?? 0) - (B.z ?? 0) };

  const dot = u.x * v.x + u.y * v.y + u.z * v.z;
  const magU = Math.hypot(u.x, u.y, u.z);
  const magV = Math.hypot(v.x, v.y, v.z);

  if (magU === 0 || magV === 0) return 0;
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot / (magU * magV)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

/**
 * 2D angle at vertex B formed by points A - B - C in degrees
 */
export function calculateAngle2D(A, B, C) {
  if (!A || !B || !C) return 0;
  const u = { x: A.x - B.x, y: A.y - B.y };
  const v = { x: C.x - B.x, y: C.y - B.y };

  const dot = u.x * v.x + u.y * v.y;
  const magU = Math.hypot(u.x, u.y);
  const magV = Math.hypot(v.x, v.y);

  if (magU === 0 || magV === 0) return 0;
  const cosTheta = Math.max(-1.0, Math.min(1.0, dot / (magU * magV)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

/**
 * Linear 3D interpolation between two points
 */
export function interp(p1, p2, ratio) {
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
    z: (p1.z ?? 0) + ((p2.z ?? 0) - (p1.z ?? 0)) * ratio
  };
}

/**
 * 2D Euclidean distance
 */
export function dist2D(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * 3D Euclidean distance
 */
export function dist3D(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z ?? 0) - (p2.z ?? 0));
}

/**
 * Computes body scale metrics: shoulder width and torso length for normalized checks
 */
export function getBodyMetrics(lm) {
  if (!lm || !lm[LM.LEFT_SHOULDER] || !lm[LM.RIGHT_SHOULDER]) {
    return { shoulderWidth: 0.3, torsoLength: 0.5, shoulderMid: { x: 0.5, y: 0.5, z: 0 }, hipMid: { x: 0.5, y: 0.7, z: 0 } };
  }

  const sL = lm[LM.LEFT_SHOULDER];
  const sR = lm[LM.RIGHT_SHOULDER];
  const hL = lm[LM.LEFT_HIP] || sL;
  const hR = lm[LM.RIGHT_HIP] || sR;

  const shoulderMid = interp(sL, sR, 0.5);
  const hipMid = interp(hL, hR, 0.5);

  const shoulderWidth = Math.max(0.08, dist2D(sL, sR));
  const torsoLength = Math.max(0.12, dist2D(shoulderMid, hipMid));

  return { shoulderWidth, torsoLength, shoulderMid, hipMid };
}

/**
 * Perpendicular distance of elbow from the direct shoulder-wrist line
 * Used to detect "Chicken Wing" / elbow flare
 */
export function calculateElbowPerpendicularDeviation(shoulder, elbow, wrist) {
  const lineDist = dist2D(shoulder, wrist);
  if (lineDist < 0.001) return 0;
  // Area of triangle using cross product
  const cross = Math.abs(
    (wrist.x - shoulder.x) * (shoulder.y - elbow.y) -
    (shoulder.x - elbow.x) * (wrist.y - shoulder.y)
  );
  return cross / lineDist;
}

/**
 * Transverse shoulder yaw in degrees relative to camera coronal plane
 */
export function calculateShoulderYaw(lm) {
  const sL = lm[LM.LEFT_SHOULDER];
  const sR = lm[LM.RIGHT_SHOULDER];
  const dz = (sL.z ?? 0) - (sR.z ?? 0);
  const dx = sL.x - sR.x;
  return Math.atan2(dz, dx) * (180 / Math.PI);
}

/**
 * Transverse hip yaw in degrees
 */
export function calculateHipYaw(lm) {
  const hL = lm[LM.LEFT_HIP];
  const hR = lm[LM.RIGHT_HIP];
  if (!hL || !hR) return 0;
  const dz = (hL.z ?? 0) - (hR.z ?? 0);
  const dx = hL.x - hR.x;
  return Math.atan2(dz, dx) * (180 / Math.PI);
}
