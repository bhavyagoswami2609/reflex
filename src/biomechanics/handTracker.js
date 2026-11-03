import { dist2D } from './landmarks.js';

/**
 * MediaPipe Hands 21-Joint Landmark Indices:
 * 0: WRIST
 * 1-4: THUMB (CMC, MCP, IP, TIP)
 * 5-8: INDEX (MCP, PIP, DIP, TIP)
 * 9-12: MIDDLE (MCP, PIP, DIP, TIP)
 * 13-16: RING (MCP, PIP, DIP, TIP)
 * 17-20: PINKY (MCP, PIP, DIP, TIP)
 */
export const HAND_LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
};

/**
 * High-Precision 21-Joint Hand Biomechanics & 3D Kinematics Tracker
 * - Tracks every individual finger joint in 3D
 * - Extracts 6-DOF hand rotation (Pitch, Yaw, Roll) and 3D pointing vectors
 */
export class HandTracker {
  constructor() {
    this.leftHand = null;   // 21 3D landmarks for left hand
    this.rightHand = null;  // 21 3D landmarks for right hand
  }

  /**
   * Distribute detected hands to Left vs Right based on physical correlation with Pose wrists
   * @param {Object} results MediaPipe Hands results
   * @param {Array} mirroredPoseLM Mirrored 33 Pose landmarks
   */
  processHands(results, mirroredPoseLM) {
    this.leftHand = null;
    this.rightHand = null;

    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return { left: null, right: null };
    }

    const poseWristL = mirroredPoseLM ? mirroredPoseLM[15] : null;
    const poseWristR = mirroredPoseLM ? mirroredPoseLM[16] : null;

    // Process and mirror all detected hands
    const detectedHands = results.multiHandLandmarks.map((lmList, idx) => {
      // Mirror X coordinates for direct 1:1 screen mapping
      const mirroredList = lmList.map(pt => ({
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z ?? 0
      }));

      const wrist = mirroredList[HAND_LM.WRIST];
      const handedness = results.multiHandedness?.[idx]?.label || 'Unknown';

      return {
        landmarks: mirroredList,
        wrist,
        handedness
      };
    });

    // Correlate with Pose Wrists for 100% reliable Left / Right assignment
    detectedHands.forEach(handObj => {
      let isLeft = false;

      if (poseWristL && poseWristR) {
        const dL = dist2D(handObj.wrist, poseWristL);
        const dR = dist2D(handObj.wrist, poseWristR);
        isLeft = dL < dR;
      } else {
        // Fallback: screen left vs screen right
        isLeft = handObj.wrist.x < 0.5;
      }

      const kinematics = this.computeHandKinematics(handObj.landmarks, isLeft);

      if (isLeft) {
        this.leftHand = kinematics;
      } else {
        this.rightHand = kinematics;
      }
    });

    return {
      left: this.leftHand,
      right: this.rightHand
    };
  }

  /**
   * Computes 6-DOF Hand Orientation, Pointing Vectors, and Finger Curl Metrics
   * @param {Array} lm 21 hand landmarks
   * @param {boolean} isLeft Whether hand is left
   */
  computeHandKinematics(lm, isLeft) {
    if (!lm || lm.length < 21) return null;

    const wrist = lm[HAND_LM.WRIST];
    const indexMCP = lm[HAND_LM.INDEX_MCP];
    const indexTip = lm[HAND_LM.INDEX_TIP];
    const middleMCP = lm[HAND_LM.MIDDLE_MCP];
    const middlePIP = lm[HAND_LM.MIDDLE_PIP];
    const middleTip = lm[HAND_LM.MIDDLE_TIP];
    const ringMCP = lm[HAND_LM.RING_MCP];
    const ringPIP = lm[HAND_LM.RING_PIP];
    const ringTip = lm[HAND_LM.RING_TIP];
    const pinkyMCP = lm[HAND_LM.PINKY_MCP];
    const pinkyTip = lm[HAND_LM.PINKY_TIP];
    const thumbMCP = lm[HAND_LM.THUMB_MCP];
    const thumbTip = lm[HAND_LM.THUMB_TIP];

    // Palm scale reference (wrist to middle MCP)
    const palmLength = Math.max(0.02, Math.sqrt(
      Math.pow(middleMCP.x - wrist.x, 2) +
      Math.pow(middleMCP.y - wrist.y, 2) +
      Math.pow(middleMCP.z - wrist.z, 2)
    ));

    // 1. Hand Longitudinal Pointing Vector (Wrist -> Middle Knuckle)
    // When fingers point up towards clouds, vy < 0 (since screen Y=0 is top)
    const dirX = (middleMCP.x - wrist.x) / palmLength;
    const dirY = (middleMCP.y - wrist.y) / palmLength;
    const dirZ = (middleMCP.z - wrist.z) / palmLength;

    // 2. Transverse Knuckle Vector (Index Knuckle -> Pinky Knuckle)
    // Controls roll / pronation / supination
    const kx = pinkyMCP.x - indexMCP.x;
    const ky = pinkyMCP.y - indexMCP.y;
    const kz = pinkyMCP.z - indexMCP.z;
    const kLen = Math.max(0.01, Math.sqrt(kx * kx + ky * ky + kz * kz));
    const knuckNormX = kx / kLen;
    const knuckNormY = ky / kLen;
    const knuckNormZ = kz / kLen;

    // 3. Palm Normal Vector (Cross product: pointingVector x knuckleVector)
    const normX = dirY * knuckNormZ - dirZ * knuckNormY;
    const normY = dirZ * knuckNormX - dirX * knuckNormZ;
    const normZ = dirX * knuckNormY - dirY * knuckNormX;

    // 4. Euler Angles in Radians
    // PITCH: Hand tilting up/down (if dirY < 0, fingers point UP towards ceiling!)
    // When hands face upward towards clouds, pitch reaches +PI/2
    const pitch = Math.atan2(-dirY, Math.sqrt(dirX * dirX + dirZ * dirZ));

    // YAW: Hand turning left/right
    const yaw = Math.atan2(dirX, -dirZ);

    // ROLL: Hand pronation / supination (rotating on its longitudinal wrist axis)
    // For left vs right hand, adjust baseline so palms face inward during boxing guard
    const rollAngle = Math.atan2(knuckNormY, knuckNormX);
    const roll = isLeft ? rollAngle : -rollAngle;

    // 5. Individual Finger Curl Assessment (Ratio of tip-to-wrist distance vs pip-to-wrist)
    const checkExtended = (tip, pip, mcp) => {
      const dTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2) + Math.pow(tip.z - wrist.z, 2));
      const dPip = Math.sqrt(Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2) + Math.pow(pip.z - wrist.z, 2));
      return dTip > dPip * 1.15;
    };

    const checkCurled = (tip, pip, mcp) => {
      const dTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2) + Math.pow(tip.z - wrist.z, 2));
      const dPip = Math.sqrt(Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2) + Math.pow(pip.z - wrist.z, 2));
      const dTipMcp = Math.sqrt(Math.pow(tip.x - mcp.x, 2) + Math.pow(tip.y - mcp.y, 2) + Math.pow(tip.z - mcp.z, 2));
      return (dTip < dPip * 1.05) || (dTipMcp < palmLength * 0.65);
    };

    const indexExtended = checkExtended(indexTip, indexMCP, wrist);
    const middleCurled = checkCurled(middleTip, middlePIP, middleMCP);
    const ringCurled = checkCurled(ringTip, ringPIP, ringMCP);
    const pinkyExtended = checkExtended(pinkyTip, pinkyMCP, wrist);

    // Thumb extended outward
    const dThumbIndex = Math.sqrt(Math.pow(thumbTip.x - indexMCP.x, 2) + Math.pow(thumbTip.y - indexMCP.y, 2));
    const thumbExtended = dThumbIndex > palmLength * 0.60;

    // Is Hand in a Fist (all 4 fingers curled)
    const indexCurled = checkCurled(indexTip, lm[HAND_LM.INDEX_PIP], indexMCP);
    const pinkyCurled = checkCurled(pinkyTip, lm[HAND_LM.PINKY_PIP], pinkyMCP);
    const isFist = indexCurled && middleCurled && ringCurled && pinkyCurled;

    // Palm Center
    const palmCenter = {
      x: (wrist.x + middleMCP.x) * 0.5,
      y: (wrist.y + middleMCP.y) * 0.5,
      z: (wrist.z + middleMCP.z) * 0.5
    };

    return {
      landmarks: lm,
      wrist,
      palmCenter,
      palmLength,
      // 3D Direction & Orientation
      pointingVector: { x: dirX, y: dirY, z: dirZ },
      knuckleVector: { x: knuckNormX, y: knuckNormY, z: knuckNormZ },
      palmNormal: { x: normX, y: normY, z: normZ },
      pitch,
      yaw,
      roll,
      // Finger States
      fingers: {
        thumbExtended,
        indexExtended,
        middleCurled,
        ringCurled,
        pinkyExtended,
        isFist
      },
      isLeft
    };
  }
}

export default HandTracker;
