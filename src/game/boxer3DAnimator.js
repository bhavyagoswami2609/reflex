import * as THREE from 'three';
import { createHumanBoxer, HUMAN_BOXER_POSES } from './humanBoxerModel.js';
import { createBoxer3D as createRobotBoxer, BOXER_POSES as ROBOT_BOXER_POSES } from './boxer3DModel.js';
import { COMBO_DEFINITIONS } from './boxingCombos.js';
import { BoxingRing3D } from './boxingRing3D.js';
import { PlayerGloves3D } from './playerGloves3D.js';

/**
 * Easing Functions for Crisp, Snappy Combat Keyframing
 */
export const EASING = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: t => (--t) * t * t + 1,
  easeInCubic: t => t * t * t,
  // Snappy boxing punch snap with elastic pop
  easeOutBack: (t, s = 1.35) => {
    const c1 = s;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  // Explosive forward punch curve
  punchSnap: t => {
    if (t < 0.6) {
      // Explosive forward launch
      return Math.pow(t / 0.6, 2.5);
    } else {
      // Slight hold at apex before retracting
      return 1.0;
    }
  }
};

/**
 * Additional Attack Poses & Kinematics Keyframes
 */
export const EXTENDED_POSES = {
  ...HUMAN_BOXER_POSES,

  // Right Hook - Sweeping rear power hook
  RIGHT_HOOK_WINDUP: {
    pelvis: { pos: [0, 0.94, 0], rot: [0, -0.28, 0] },
    spine: { rot: [-0.06, -0.25, -0.05] },
    head: { rot: [0.06, 0.18, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.1, -0.25, 0.2] },
    rightUpperArm: { rot: [-0.45, -0.35, 0.35] },
    rightElbow: { rot: [-1.75, 0, 0] },
    rightWrist: { rot: [0.15, -0.2, 0] }
  },
  RIGHT_HOOK_IMPACT: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.22, 0] },
    spine: { rot: [-0.08, 0.28, 0] },
    head: { rot: [0.08, -0.32, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.98, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.22, 0.15, 0.25] },
    rightUpperArm: { rot: [-1.35, -0.25, 0.72] },
    rightElbow: { rot: [-1.55, 0, 0] },
    rightWrist: { rot: [0.1, -0.25, 0] }
  },

  // Uppercut - Rear upward power shovel
  UPPERCUT_WINDUP: {
    pelvis: { pos: [0, 0.84, -0.05], rot: [0, -0.15, 0] },
    spine: { rot: [-0.18, -0.12, -0.08] },
    head: { rot: [0.12, 0.15, 0] },
    leftShoulder: { rot: [-0.12, -0.08, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.05, 0.1, 0.12] },
    rightUpperArm: { rot: [-0.25, 0.1, 0.2] },
    rightElbow: { rot: [-2.15, 0, 0] },
    rightWrist: { rot: [0.35, 0, 0] },
    leftThigh: { rot: [-0.35, 0.1, 0] },
    leftKnee: { rot: [0.65, 0, 0] },
    rightThigh: { rot: [-0.25, 0.15, 0] },
    rightKnee: { rot: [0.75, 0, 0] }
  },
  UPPERCUT_IMPACT: {
    pelvis: { pos: [0, 0.98, 0.08], rot: [0, 0.18, 0] },
    spine: { rot: [0.08, 0.22, 0] },
    head: { rot: [-0.05, -0.15, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.98, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.35, 0.25, 0.1] },
    rightUpperArm: { rot: [-1.15, 0.05, 0.1] },
    rightElbow: { rot: [-1.35, 0, 0] },
    rightWrist: { rot: [0.55, 0, 0] },
    leftThigh: { rot: [-0.12, 0.1, 0] },
    leftKnee: { rot: [0.22, 0, 0] },
    rightThigh: { rot: [0.18, 0.15, 0] },
    rightKnee: { rot: [0.28, 0, 0] }
  },

  // Overhand Right - Looping over-the-top missile
  OVERHAND_WINDUP: {
    pelvis: { pos: [-0.05, 0.92, 0], rot: [0, -0.22, 0] },
    spine: { rot: [-0.12, -0.18, 0.18] },
    head: { rot: [0.12, 0.22, -0.1] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [0.15, -0.2, 0.35] },
    rightUpperArm: { rot: [-0.65, -0.25, 0.55] },
    rightElbow: { rot: [-1.65, 0, 0] },
    rightWrist: { rot: [0.1, -0.15, 0] }
  },
  OVERHAND_IMPACT: {
    pelvis: { pos: [0.06, 0.93, 0.05], rot: [0, 0.18, 0] },
    spine: { rot: [-0.18, 0.22, -0.22] },
    head: { rot: [0.15, -0.25, 0.15] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.98, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.35, 0.25, 0.2] },
    rightUpperArm: { rot: [-1.65, -0.1, 0.25] },
    rightElbow: { rot: [-0.45, 0, 0] },
    rightWrist: { rot: [-0.2, -0.15, 0] }
  },

  // Body Shot - Crouching shovel hook to the ribs
  BODY_SHOT_WINDUP: {
    pelvis: { pos: [-0.05, 0.82, 0], rot: [0, 0.2, 0] },
    spine: { rot: [-0.15, 0.18, 0.15] },
    head: { rot: [0.12, -0.15, -0.1] },
    leftShoulder: { rot: [-0.1, 0.1, -0.15] },
    leftUpperArm: { rot: [-0.35, 0.2, -0.25] },
    leftElbow: { rot: [-1.85, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.05, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.38, 0.15, 0] },
    leftKnee: { rot: [0.72, 0, 0] }
  },
  BODY_SHOT_IMPACT: {
    pelvis: { pos: [0.04, 0.84, 0.06], rot: [0, -0.18, 0] },
    spine: { rot: [-0.12, -0.22, -0.12] },
    head: { rot: [0.1, 0.22, 0.08] },
    leftShoulder: { rot: [-0.25, -0.15, -0.15] },
    leftUpperArm: { rot: [-1.15, 0.25, -0.35] },
    leftElbow: { rot: [-1.45, 0, 0] },
    leftWrist: { rot: [0.35, 0.15, 0] },
    rightShoulder: { rot: [-0.1, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.05, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.25, 0.15, 0] },
    leftKnee: { rot: [0.55, 0, 0] }
  },

  // Feint Jab: Optical stutter and half-extension to draw early slips
  FEINT_JAB_WINDUP: {
    pelvis: { pos: [0, 0.95, 0.02], rot: [0, 0.16, 0] },
    spine: { rot: [-0.07, 0.14, 0] },
    head: { rot: [0.06, -0.22, 0] },
    leftShoulder: { rot: [-0.15, -0.22, 0] },
    leftUpperArm: { rot: [-0.85, 0.08, 0] },
    leftElbow: { rot: [-1.4, 0, 0] },
    leftWrist: { rot: [0.15, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0.12, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] }
  },
  FEINT_JAB_IMPACT: {
    pelvis: { pos: [0, 0.95, 0.04], rot: [0, 0.14, 0] },
    spine: { rot: [-0.08, 0.10, 0] },
    head: { rot: [0.05, -0.24, 0] },
    leftShoulder: { rot: [-0.16, -0.26, 0] },
    leftUpperArm: { rot: [-1.25, 0.05, 0] },
    leftElbow: { rot: [-1.15, 0, 0] }, // Half extension twitch
    leftWrist: { rot: [0.08, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0.12, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] }
  },

  // Feint Stutter Chamber: Retracts feint twitch and loads looping overhand
  FEINT_STUTTER_CHAMBER: {
    pelvis: { pos: [-0.04, 0.93, 0], rot: [0, -0.18, 0] },
    spine: { rot: [-0.1, -0.16, 0.16] },
    head: { rot: [0.1, 0.2, -0.08] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [0.12, -0.18, 0.32] },
    rightUpperArm: { rot: [-0.6, -0.22, 0.52] },
    rightElbow: { rot: [-1.68, 0, 0] },
    rightWrist: { rot: [0.1, -0.15, 0] }
  },

  // Kinetic Chamber 1: Jab recoil drives rear hip torque to load cross
  JAB_TO_CROSS_CHAMBER: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, -0.06, 0] },
    spine: { rot: [-0.06, -0.06, 0] },
    head: { rot: [0.06, 0.12, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.65, 0.1, -0.1] },
    leftElbow: { rot: [-1.65, 0, 0] },
    leftWrist: { rot: [0.2, 0.1, 0] },
    rightShoulder: { rot: [-0.12, 0.22, 0.06] },
    rightUpperArm: { rot: [-0.4, -0.22, 0.18] },
    rightElbow: { rot: [-1.9, 0, 0] },
    rightWrist: { rot: [0.15, -0.1, 0] }
  },

  // Kinetic Chamber 2: Cross recoil torques lead shoulder to load hook
  CROSS_TO_HOOK_CHAMBER: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.08, 0] },
    spine: { rot: [-0.06, 0.16, 0] },
    head: { rot: [0.06, -0.16, 0] },
    leftShoulder: { rot: [-0.2, -0.16, -0.15] },
    leftUpperArm: { rot: [-1.22, 0.15, -0.52] },
    leftElbow: { rot: [-1.65, 0, 0] },
    leftWrist: { rot: [0.12, 0.15, 0] },
    rightShoulder: { rot: [-0.1, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-1.98, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] }
  },

  // Kinetic Chamber 3: Hook follow-through sinks weight onto rear leg for uppercut
  HOOK_TO_UPPERCUT_CHAMBER: {
    pelvis: { pos: [0, 0.86, -0.04], rot: [0, -0.12, 0] },
    spine: { rot: [-0.15, -0.1, -0.06] },
    head: { rot: [0.1, 0.12, 0] },
    leftShoulder: { rot: [-0.14, -0.08, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.08, 0.12, 0.1] },
    rightUpperArm: { rot: [-0.3, 0.08, 0.18] },
    rightElbow: { rot: [-2.1, 0, 0] },
    rightWrist: { rot: [0.35, 0, 0] },
    leftThigh: { rot: [-0.32, 0.1, 0] },
    leftKnee: { rot: [0.60, 0, 0] },
    rightThigh: { rot: [-0.22, 0.15, 0] },
    rightKnee: { rot: [0.70, 0, 0] }
  },

  // Kinetic Chamber 4: High jab level change crouches down to shovel ribs
  JAB_TO_BODY_CHAMBER: {
    pelvis: { pos: [-0.04, 0.83, 0], rot: [0, 0.18, 0] },
    spine: { rot: [-0.14, 0.15, 0.12] },
    head: { rot: [0.1, -0.12, -0.08] },
    leftShoulder: { rot: [-0.12, 0.1, -0.12] },
    leftUpperArm: { rot: [-0.38, 0.18, -0.22] },
    leftElbow: { rot: [-1.82, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.08, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.05, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.35, 0.15, 0] },
    leftKnee: { rot: [0.68, 0, 0] }
  },

  // Kinetic Chamber 5: Hook recoil re-loads rear cross
  HOOK_TO_CROSS_CHAMBER: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, -0.08, 0] },
    spine: { rot: [-0.06, -0.08, 0] },
    head: { rot: [0.06, 0.15, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.95, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.12, 0.25, 0.08] },
    rightUpperArm: { rot: [-0.42, -0.22, 0.2] },
    rightElbow: { rot: [-1.92, 0, 0] },
    rightWrist: { rot: [0.15, -0.1, 0] }
  },

  // Vulnerable Opening / Guard Dropped Stagger
  OPENING: {
    pelvis: { pos: [0, 0.93, 0.04], rot: [0, 0.06, 0] },
    spine: { rot: [-0.14, 0.06, 0] },
    head: { rot: [0.16, 0, 0] },
    leftShoulder: { rot: [0.08, 0, -0.16] },
    leftUpperArm: { rot: [-0.18, 0.1, -0.28] },
    leftElbow: { rot: [-1.15, 0, 0] },
    leftWrist: { rot: [0.1, 0, 0] },
    rightShoulder: { rot: [0.08, 0, 0.16] },
    rightUpperArm: { rot: [-0.18, -0.1, 0.28] },
    rightElbow: { rot: [-1.15, 0, 0] },
    rightWrist: { rot: [0.1, 0, 0] },
    leftThigh: { rot: [-0.22, 0.1, 0] },
    leftKnee: { rot: [0.45, 0, 0] },
    rightThigh: { rot: [0.18, 0.15, 0] },
    rightKnee: { rot: [0.38, 0, 0] }
  },

  // Recoil: Struck by Left Hook to Right Jaw
  HURT_HOOK_LEFT: {
    pelvis: { pos: [-0.07, 0.93, -0.04], rot: [0, -0.22, 0] },
    spine: { rot: [0.16, -0.32, -0.14] },
    head: { rot: [0.08, -0.46, -0.24] },
    leftShoulder: { rot: [-0.05, 0, -0.18] },
    leftUpperArm: { rot: [-0.28, 0.12, -0.36] },
    leftElbow: { rot: [-1.25, 0, 0] },
    leftWrist: { rot: [0.1, 0.1, 0] },
    rightShoulder: { rot: [0.12, -0.15, 0.25] },
    rightUpperArm: { rot: [-0.38, -0.14, 0.52] },
    rightElbow: { rot: [-1.02, 0, 0] },
    rightWrist: { rot: [0.12, -0.12, 0] },
    leftThigh: { rot: [-0.12, 0.1, 0] },
    leftKnee: { rot: [0.28, 0, 0] },
    rightThigh: { rot: [0.28, 0.18, 0] },
    rightKnee: { rot: [0.42, 0, 0] }
  },

  // Recoil: Struck by Right Hook to Left Jaw
  HURT_HOOK_RIGHT: {
    pelvis: { pos: [0.07, 0.93, -0.04], rot: [0, 0.22, 0] },
    spine: { rot: [0.16, 0.32, 0.14] },
    head: { rot: [0.08, 0.46, 0.24] },
    leftShoulder: { rot: [0.12, 0.15, -0.25] },
    leftUpperArm: { rot: [-0.38, 0.14, -0.52] },
    leftElbow: { rot: [-1.02, 0, 0] },
    leftWrist: { rot: [0.12, 0.12, 0] },
    rightShoulder: { rot: [-0.05, 0, 0.18] },
    rightUpperArm: { rot: [-0.28, -0.12, 0.36] },
    rightElbow: { rot: [-1.25, 0, 0] },
    rightWrist: { rot: [0.1, -0.1, 0] },
    leftThigh: { rot: [-0.18, 0.1, 0] },
    leftKnee: { rot: [0.38, 0, 0] },
    rightThigh: { rot: [0.16, 0.14, 0] },
    rightKnee: { rot: [0.26, 0, 0] }
  },

  // Recoil: Struck by Uppercut directly under Chin
  HURT_UPPERCUT: {
    pelvis: { pos: [0, 1.01, -0.09], rot: [0, 0, 0] },
    spine: { rot: [0.38, 0, 0] },
    head: { rot: [-0.46, 0, 0] },
    leftShoulder: { rot: [0.12, 0, -0.25] },
    leftUpperArm: { rot: [0.12, 0.12, -0.42] },
    leftElbow: { rot: [-0.82, 0, 0] },
    leftWrist: { rot: [0.05, 0, 0] },
    rightShoulder: { rot: [0.12, 0, 0.25] },
    rightUpperArm: { rot: [0.12, -0.12, 0.42] },
    rightElbow: { rot: [-0.82, 0, 0] },
    rightWrist: { rot: [0.05, 0, 0] },
    leftThigh: { rot: [-0.15, 0.1, 0] },
    leftKnee: { rot: [0.22, 0, 0] },
    rightThigh: { rot: [0.22, 0.15, 0] },
    rightKnee: { rot: [0.32, 0, 0] }
  },

  // Recoil: Struck by Straight Jab or Cross
  HURT_STRAIGHT: {
    pelvis: { pos: [0, 0.94, -0.08], rot: [0, 0.05, 0] },
    spine: { rot: [0.28, -0.08, 0.04] },
    head: { rot: [0.36, -0.12, 0.08] },
    leftShoulder: { rot: [-0.05, 0, -0.2] },
    leftUpperArm: { rot: [-0.22, 0.1, -0.35] },
    leftElbow: { rot: [-1.2, 0, 0] },
    leftWrist: { rot: [0.1, 0.1, 0] },
    rightShoulder: { rot: [0.06, 0, 0.2] },
    rightUpperArm: { rot: [-0.26, -0.1, 0.35] },
    rightElbow: { rot: [-1.1, 0, 0] },
    rightWrist: { rot: [0.1, -0.1, 0] },
    leftThigh: { rot: [-0.1, 0.1, 0] },
    leftKnee: { rot: [0.2, 0, 0] },
    rightThigh: { rot: [0.25, 0.15, 0] },
    rightKnee: { rot: [0.35, 0, 0] }
  },

  // Authentic Boxing High Guard Block
  // Forearms tight and vertical, elbows tucked to ribs, chin tucked, gloves shielding temples & eyes
  HIGH_GUARD_BLOCK: {
    pelvis: { pos: [0, 0.90, -0.02], rot: [0, 0, 0] },
    spine: { rot: [-0.18, 0, 0] },
    head: { rot: [0.22, 0, 0] },
    leftShoulder: { rot: [-0.25, -0.15, 0.22] },
    leftUpperArm: { rot: [-0.85, 0.15, 0.35] },
    leftElbow: { rot: [-2.45, 0, 0] },
    leftWrist: { rot: [0.35, 0.15, 0] },
    rightShoulder: { rot: [-0.25, 0.15, -0.22] },
    rightUpperArm: { rot: [-0.85, -0.15, -0.35] },
    rightElbow: { rot: [-2.45, 0, 0] },
    rightWrist: { rot: [0.35, -0.15, 0] },
    leftThigh: { rot: [-0.28, 0.1, 0] },
    leftKnee: { rot: [0.55, 0, 0] },
    rightThigh: { rot: [0.22, 0.15, 0] },
    rightKnee: { rot: [0.48, 0, 0] }
  }
};

/**
 * Full Attack Definitions with Biomechanical Targets & Required Defenses
 * With realistic Forward Kinetic Lunges (forwardReach in meters)
 */
export const ATTACK_DEFINITIONS = {
  FEINT_JAB: {
    id: 'FEINT_JAB',
    name: 'SHOULDER FEINT',
    arm: 'LEFT',
    requiredDefense: 'NONE',
    alternativeDefense: 'HIGH_GUARD_BLOCK',
    targetRegion: 'CHIN',
    screenTargetOffset: { x: 0.0, y: -0.05 },
    windupPose: 'GUARD',
    strikePose: 'FEINT_JAB_IMPACT',
    recoverPose: 'GUARD',
    windupRatio: 0.50,
    strikeRatio: 0.25,
    recoverRatio: 0.25,
    threatRadius: 0.20,
    baseWindupMs: 260,
    forwardReach: 0.22,
    isFeint: true
  },
  LEFT_JAB: {
    id: 'LEFT_JAB',
    name: 'LEAD JAB',
    arm: 'LEFT',
    requiredDefense: 'SLIP_RIGHT',
    alternativeDefense: 'HIGH_GUARD_BLOCK',
    targetRegion: 'CHIN',
    screenTargetOffset: { x: 0.0, y: -0.06 },
    windupPose: 'GUARD',
    strikePose: 'JAB',
    recoverPose: 'GUARD',
    windupRatio: 0.54,
    strikeRatio: 0.22,
    recoverRatio: 0.24,
    threatRadius: 0.22,
    baseWindupMs: 330,
    forwardReach: 0.52 // Half-meter explosive step forward into player's face!
  },
  RIGHT_CROSS: {
    id: 'RIGHT_CROSS',
    name: 'POWER CROSS',
    arm: 'RIGHT',
    requiredDefense: 'SLIP_LEFT',
    alternativeDefense: 'HIGH_GUARD_BLOCK',
    targetRegion: 'CHIN',
    screenTargetOffset: { x: 0.0, y: -0.05 },
    windupPose: 'GUARD',
    strikePose: 'CROSS',
    recoverPose: 'GUARD',
    windupRatio: 0.56,
    strikeRatio: 0.22,
    recoverRatio: 0.22,
    threatRadius: 0.24,
    baseWindupMs: 360,
    forwardReach: 0.62 // Rear hip drive drives whole body 0.62m forward!
  },
  LEFT_HOOK: {
    id: 'LEFT_HOOK',
    name: 'LEAD HOOK',
    arm: 'LEFT',
    requiredDefense: 'DUCK',
    alternativeDefense: 'SLIP_RIGHT',
    targetRegion: 'RIGHT_TEMPLE',
    screenTargetOffset: { x: 0.12, y: -0.08 },
    windupPose: 'GUARD',
    strikePose: 'HOOK',
    recoverPose: 'GUARD',
    windupRatio: 0.58,
    strikeRatio: 0.22,
    recoverRatio: 0.20,
    threatRadius: 0.26,
    baseWindupMs: 370,
    forwardReach: 0.46
  },
  RIGHT_HOOK: {
    id: 'RIGHT_HOOK',
    name: 'REAR POWER HOOK',
    arm: 'RIGHT',
    requiredDefense: 'DUCK',
    alternativeDefense: 'SLIP_LEFT',
    targetRegion: 'LEFT_TEMPLE',
    screenTargetOffset: { x: -0.12, y: -0.08 },
    windupPose: 'RIGHT_HOOK_WINDUP',
    strikePose: 'RIGHT_HOOK_IMPACT',
    recoverPose: 'GUARD',
    windupRatio: 0.58,
    strikeRatio: 0.22,
    recoverRatio: 0.20,
    threatRadius: 0.26,
    baseWindupMs: 380,
    forwardReach: 0.48
  },
  UPPERCUT: {
    id: 'UPPERCUT',
    name: 'RISING UPPERCUT',
    arm: 'RIGHT',
    requiredDefense: 'SLIP_LEFT',
    alternativeDefense: 'HIGH_GUARD_BLOCK',
    targetRegion: 'UNDER_CHIN',
    screenTargetOffset: { x: 0.0, y: 0.02 },
    windupPose: 'UPPERCUT_WINDUP',
    strikePose: 'UPPERCUT_IMPACT',
    recoverPose: 'GUARD',
    windupRatio: 0.60,
    strikeRatio: 0.20,
    recoverRatio: 0.20,
    threatRadius: 0.22,
    baseWindupMs: 380,
    forwardReach: 0.45
  },
  OVERHAND: {
    id: 'OVERHAND',
    name: 'LOOPING OVERHAND',
    arm: 'RIGHT',
    requiredDefense: 'DUCK',
    alternativeDefense: 'HIGH_GUARD_BLOCK',
    targetRegion: 'FOREHEAD',
    screenTargetOffset: { x: -0.04, y: -0.14 },
    windupPose: 'OVERHAND_WINDUP',
    strikePose: 'OVERHAND_IMPACT',
    recoverPose: 'GUARD',
    windupRatio: 0.62,
    strikeRatio: 0.20,
    recoverRatio: 0.18,
    threatRadius: 0.28,
    baseWindupMs: 390,
    forwardReach: 0.58
  },
  BODY_SHOT: {
    id: 'BODY_SHOT',
    name: 'SHOVEL BODY HOOK',
    arm: 'LEFT',
    requiredDefense: 'HIGH_GUARD_BLOCK',
    alternativeDefense: 'DUCK',
    targetRegion: 'RIBS',
    screenTargetOffset: { x: 0.08, y: 0.18 },
    windupPose: 'BODY_SHOT_WINDUP',
    strikePose: 'BODY_SHOT_IMPACT',
    recoverPose: 'GUARD',
    windupRatio: 0.56,
    strikeRatio: 0.22,
    recoverRatio: 0.22,
    threatRadius: 0.25,
    baseWindupMs: 360,
    forwardReach: 0.48
  }
};

/**
 * Smooth Joint Pose Interpolator
 */
function interpolateJointTransforms(startPose, endPose, t) {
  const result = {};
  const allJoints = new Set([
    ...Object.keys(startPose || {}),
    ...Object.keys(endPose || {})
  ]);

  for (const jName of allJoints) {
    const s = startPose?.[jName];
    const e = endPose?.[jName];

    if (!s && !e) continue;
    if (!s) {
      result[jName] = e;
      continue;
    }
    if (!e) {
      result[jName] = s;
      continue;
    }

    const transform = {};
    if (s.pos || e.pos) {
      const sp = s.pos || [0, 0, 0];
      const ep = e.pos || [0, 0, 0];
      transform.pos = [
        sp[0] + (ep[0] - sp[0]) * t,
        sp[1] + (ep[1] - sp[1]) * t,
        sp[2] + (ep[2] - sp[2]) * t
      ];
    }
    if (s.rot || e.rot) {
      const sr = s.rot || [0, 0, 0];
      const er = e.rot || [0, 0, 0];
      transform.rot = [
        sr[0] + (er[0] - sr[0]) * t,
        sr[1] + (er[1] - sr[1]) * t,
        sr[2] + (er[2] - sr[2]) * t
      ];
    }
    result[jName] = transform;
  }
  return result;
}

/**
 * 3D Boxer Fight Scene & High-Precision Kinematic Animation Engine
 */
export class Boxer3DScene {
  constructor(options = {}) {
    this.name = 'REFLEX';
    this.container = null;
    this.canvas = null;

    // Character choice: 'human' (Shane Fazen fightTIPS sparring partner) or 'robot'
    this.characterType = options.characterType || 'human';

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Boxer Model Instance
    this.boxer = null;
    this.ring = null;
    this.playerGloves3D = null;

    // State Machine: 'IDLE', 'WINDUP', 'STRIKING', 'RECOVERING', 'HURT', 'KO', 'DEFENDING'
    this.state = 'IDLE';
    this.attackType = null;
    this.activeAttackDef = null;
    this.requiredDefense = null;
    this.counterWindow = false;

    // Defense AI State: 'BLOCK' | 'SLIP_LEFT' | 'SLIP_RIGHT' | 'DUCK'
    this.defenseType = null;
    this.defenseDuration = 400;

    // Multi-Strike Combo Engine State
    this.activeCombo = null;
    this.comboStepIndex = 0;
    this.comboTotalSteps = 0;
    this.comboSpeedMultiplier = 1.0;
    this.activeStepDef = null;
    this.stepEvaluated = false;
    this.comboEvadedSteps = [];
    this.comboFullyEvaded = true;
    this.comboHitPlayer = false;
    this.massiveCounter = false;
    this.massiveCounterDuration = 1400;
    this.transitionDuration = 130;

    // Difficulty & Opening Mechanics
    this.difficulty = 'PRO'; // 'ROOKIE' | 'PRO' | 'CHAMPION'
    this.openingDuration = 1350;
    this.lastIdleOpeningCheck = performance.now() + 4500;
    this.lastHitPunchType = 'JAB';

    // Timers & Lifecycles
    this.stateTimer = performance.now();
    this.stateDuration = 0;
    this.animClock = 0;

    // Fast Attack Timers
    this.windupDuration = 600;
    this.strikeDuration = 180;
    this.recoverDuration = 320;
    this.hurtDuration = 420;

    // Lighting References
    this.lights = {};

    // Hit Tracking Telemetry
    this.hitTelemetry = {
      fistWorldPos: new THREE.Vector3(),
      screenPos: { x: 0.5, y: 0.5 },
      depthZ: 0,
      threatProgress: 0,
      targetRegion: 'CHIN',
      requiredDefense: 'SLIP_RIGHT',
      isActiveStrike: false,
      isDangerZone: false
    };

    // Stored Poses
    this.currentInterpolatedPose = {};
    this.currentBasePose = EXTENDED_POSES.GUARD;

    this.isInitialized = false;
    this.isVisible = true;
  }

  /**
   * Initializes WebGL scene, camera, lights, and creates the 3D boxer model
   */
  init(parentElement) {
    if (this.isInitialized) return;

    this.container = parentElement;

    // Clean up any stray DOM canvas from previous hot-reloads to prevent duplicate robot
    const strayCanvas = document.getElementById('boxer-3d-canvas');
    if (strayCanvas && strayCanvas.parentNode) {
      strayCanvas.parentNode.removeChild(strayCanvas);
    }

    // Create dedicated offscreen WebGL Canvas - NEVER append to DOM!
    // This offscreen canvas is composited exclusively via ctx.drawImage in main.js.
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'boxer-3d-canvas-offscreen';
    this.canvas.style.display = 'none';

    // Three.js Scene
    this.scene = new THREE.Scene();

    // Perspective Camera: Sparring Pocket Range (Shane Fazen fightTIPS reference)
    // Opponent stands inside the ring within reach, eye to eye, filling ~75% of viewport
    const aspect = (this.container?.clientWidth || window.innerWidth) / ((this.container?.clientHeight || window.innerHeight) || 1);
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 100);
    this.camera.position.set(0, 1.48, 1.45);
    this.camera.lookAt(0, 1.36, 0);

    // CRITICAL: Add camera to scene so camera children (player gloves & virtual hands) are rendered!
    this.scene.add(this.camera);

    // Dedicated Player POV Headlight: brightly illuminates the 3D translucent gloves and virtual hands
    const cameraLight = new THREE.DirectionalLight(0xfff8ee, 2.8);
    cameraLight.position.set(0, 0.4, 0.6);
    this.camera.add(cameraLight);

    // Hardware Accelerated WebGL Renderer with Alpha Transparency & Preserved Buffer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    const initW = this.container?.clientWidth || window.innerWidth;
    const initH = this.container?.clientHeight || window.innerHeight;
    this.renderer.setSize(initW, initH);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 3D Championship Boxing Ring Environment (Canvas Mat, Ropes, Posts, Lighting Rig, Stadium Bleachers)
    this.ring = new BoxingRing3D(this.scene);

    // 3D Translucent Player Boxing Gloves (6-DOF Hand Orientation & Punch Surging)
    this.playerGloves3D = new PlayerGloves3D(this.camera, this.scene);

    // Boxing Ring Sparring Lighting
    this.setupLighting();

    // Instantiate Sparring Opponent (Human Shane Fazen by default)
    this.spawnFighter(this.characterType);

    this.isInitialized = true;
  }

  /**
   * Spawns or swaps the 3D Boxer Character Model
   * @param {'human' | 'robot'} type
   */
  spawnFighter(type = 'human') {
    if (this.boxer) {
      this.scene.remove(this.boxer.model);
      this.boxer.dispose();
      this.boxer = null;
    }

    this.characterType = type;
    if (type === 'human') {
      this.boxer = createHumanBoxer({
        scale: 1.0,
        initialPose: 'GUARD'
      });
    } else {
      this.boxer = createRobotBoxer({
        scale: 1.0,
        initialPose: 'GUARD',
        primaryColor: 0x111622,
        secondaryColor: 0x1e2738,
        accentColor: 0x00f3ff,
        gloveColor: 0xee2244
      });
    }

    this.scene.add(this.boxer.model);
    this.currentBasePose = EXTENDED_POSES.GUARD;
    this.boxer.applyPose(this.currentBasePose);
  }

  /**
   * Sets the active character model
   */
  setCharacterType(type) {
    if (this.characterType === type) return;
    this.spawnFighter(type);
  }

  /**
   * Toggles between Human Shane Sparring Partner and Titan Cyberbot
   */
  toggleCharacterType() {
    const nextType = this.characterType === 'human' ? 'robot' : 'human';
    this.spawnFighter(nextType);
    return nextType;
  }

  /**
   * Boxing Ring / Gym Lighting Setup
   */
  setupLighting() {
    // Ambient Gym Atmosphere
    const ambientLight = new THREE.AmbientLight(0x222a3a, 1.8);
    this.scene.add(ambientLight);

    // Overhead Key Spotlight (sculpts muscles, face contours, and gloves)
    const keyLight = new THREE.DirectionalLight(0xfff6ee, 2.6);
    keyLight.position.set(0.4, 3.2, 2.2);
    this.scene.add(keyLight);

    // Cyan Neon Rim Light (dramatic gym accent from camera-left)
    const rimLeft = new THREE.DirectionalLight(0x00f3ff, 2.4);
    rimLeft.position.set(-2.4, 1.8, -0.8);
    this.scene.add(rimLeft);

    // Crimson Neon Rim Light (counter rim from camera-right)
    const rimRight = new THREE.DirectionalLight(0xff3355, 2.2);
    rimRight.position.set(2.4, 1.8, -0.8);
    this.scene.add(rimRight);

    // Ground Neon Floor Bounce
    const floorGlow = new THREE.PointLight(0x00f3ff, 1.0, 6);
    floorGlow.position.set(0, 0.1, 0.8);
    this.scene.add(floorGlow);

    this.lights = { ambientLight, keyLight, rimLeft, rimRight, floorGlow };
  }

  /**
   * Resizes viewport renderer
   */
  resize(width, height) {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Controls visibility of 3D Canvas
   */
  setVisible(visible) {
    this.isVisible = visible;
  }

  /**
   * Updates current difficulty mode
   */
  setDifficulty(diff = 'PRO') {
    this.difficulty = diff;
    if (diff === 'ROOKIE') {
      this.openingDuration = 1850;
    } else if (diff === 'CHAMPION') {
      this.openingDuration = 850;
    } else {
      this.openingDuration = 1350;
    }
  }

  /**
   * Opens an explicit vulnerable counter-attack window for the bot
   */
  openOpeningWindow(timestamp, durationMs = null) {
    const baseDur = durationMs || this.openingDuration;
    this.state = 'OPENING';
    this.stateTimer = timestamp;
    this.counterWindow = true;
    this.recoverDuration = baseDur;
    if (this.boxer) {
      if (this.boxer.setVisorColor) {
        this.boxer.setVisorColor(0xffb700, 3.5); // Golden opening cue
      }
    }
  }

  /**
   * Resets opponent back to neutral guard stance
   */
  reset() {
    this.state = 'IDLE';
    this.attackType = null;
    this.activeAttackDef = null;
    this.activeStepDef = null;
    this.activeCombo = null;
    this.comboStepIndex = 0;
    this.comboTotalSteps = 0;
    this.comboEvadedSteps = [];
    this.comboFullyEvaded = true;
    this.comboHitPlayer = false;
    this.stepEvaluated = false;
    this.requiredDefense = null;
    this.counterWindow = false;
    this.massiveCounter = false;
    this.stateTimer = performance.now();
    this.lastIdleOpeningCheck = performance.now() + 4500;
    if (this.boxer) {
      this.boxer.setMaterialHurtState(false);
      if (this.boxer.setVisorColor) {
        this.boxer.setVisorColor(0x00f3ff, 2.0);
      }
      this.boxer.applyPose('GUARD');
    }
  }

  /**
   * Triggers a fast, crisp attack with specific windup duration
   */
  startAttack(attackName = 'LEFT_JAB', customWindupMs = 450) {
    const def = ATTACK_DEFINITIONS[attackName] || ATTACK_DEFINITIONS.LEFT_JAB;
    this.activeCombo = null;
    this.comboStepIndex = 0;
    this.comboTotalSteps = 1;
    this.activeStepDef = null;
    this.stepEvaluated = false;
    this.comboEvadedSteps = [false];
    this.comboFullyEvaded = true;
    this.comboHitPlayer = false;
    this.attackType = def.id;
    this.activeAttackDef = def;
    this.requiredDefense = def.requiredDefense;
    this.state = 'WINDUP';
    this.stateTimer = performance.now();
    this.windupDuration = Math.max(240, customWindupMs || def.baseWindupMs);
    this.strikeDuration = Math.max(90, Math.round(this.windupDuration * 0.25));
    this.recoverDuration = Math.max(160, Math.round(this.windupDuration * 0.35));
    this.counterWindow = false;
    this.massiveCounter = false;

    if (this.boxer) {
      this.boxer.setMaterialHurtState(false);
    }
  }

  /**
   * Initiates an authentic multi-strike boxing combination with snappy athletic cadence
   */
  startCombo(combo, speedMultiplier = 1.0) {
    if (!combo || !combo.steps || combo.steps.length === 0) return;
    this.activeCombo = combo;
    this.comboStepIndex = 0;
    this.comboTotalSteps = combo.steps.length;
    this.comboSpeedMultiplier = (speedMultiplier || 1.0) * 1.25; // 25% faster snappier flow
    this.comboEvadedSteps = new Array(this.comboTotalSteps).fill(false);
    this.comboFullyEvaded = true;
    this.comboHitPlayer = false;
    this.counterWindow = false;
    this.massiveCounter = false;

    if (this.boxer) {
      this.boxer.setMaterialHurtState(false);
    }

    this.startComboStep(0);
  }

  /**
   * Starts a specific strike step in the active combination
   */
  startComboStep(stepIndex) {
    if (!this.activeCombo || stepIndex >= this.comboTotalSteps) {
      this.state = 'RECOVERING';
      this.stateTimer = performance.now();
      return;
    }

    this.comboStepIndex = stepIndex;
    const step = this.activeCombo.steps[stepIndex];
    this.activeStepDef = step;
    this.activeAttackDef = step;
    this.attackType = step.attackId;
    this.requiredDefense = step.requiredDefense;
    this.stepEvaluated = false;

    this.state = 'COMBO_WINDUP';
    this.stateTimer = performance.now();

    const mult = this.comboSpeedMultiplier || 1.25;
    this.windupDuration = Math.max(170, Math.round(step.windupMs / mult));
    this.strikeDuration = Math.max(85, Math.round(step.strikeMs / mult));
    this.transitionDuration = Math.max(70, Math.round((step.transitionMs || 100) / mult));
    this.counterWindow = false;
  }

  /**
   * Records whether player successfully evaded the current strike step
   */
  recordComboStepEvaded(evaded) {
    this.stepEvaluated = true;
    this.comboEvadedSteps[this.comboStepIndex] = !!evaded;
    if (!evaded) {
      this.comboFullyEvaded = false;
      this.comboHitPlayer = true;
    }
  }

  /**
   * Opens an extended Massive Punish Counter window with heavy bonuses
   */
  openMassiveCounterWindow(timestamp, durationMs = 1400) {
    this.counterWindow = true;
    this.massiveCounter = true;
    this.massiveCounterDuration = durationMs;
    this.recoverDuration = Math.max(this.recoverDuration, durationMs);
    this.stateTimer = timestamp;
  }

  /**
   * Executes a dynamic 3D defensive maneuver (Block, Slip Left, Slip Right, or Duck)
   * with authentic boxing biomechanics and centerline evasion physics.
   * @param {'BLOCK' | 'SLIP_LEFT' | 'SLIP_RIGHT' | 'DUCK'} actionType 
   */
  defend(actionType = 'BLOCK') {
    // Cannot interrupt active hurt recoil or knockout
    if (this.state === 'HURT' || this.state === 'KO') {
      return false;
    }

    this.defenseType = actionType;
    this.defenseDuration = (actionType === 'BLOCK') ? 340 : (actionType === 'DUCK') ? 480 : 420;
    this.state = 'DEFENDING';
    this.stateTimer = performance.now();
    this.counterWindow = false;
    this.massiveCounter = false;
    return true;
  }

  /**
   * Registers a hit received by opponent with specific recoil for hooks, uppercuts, jabs, and crosses
   */
  takeHit(damage = 220, punchType = 'JAB') {
    this.lastHitPunchType = punchType;
    this.state = 'HURT';
    this.stateTimer = performance.now();
    this.counterWindow = false;
    this.massiveCounter = false;

    // Recoil timing tuned for crisp punch physics
    if (punchType.includes('UPPERCUT')) {
      this.hurtDuration = 520;
    } else if (punchType.includes('HOOK')) {
      this.hurtDuration = 480;
    } else if (punchType === 'CROSS') {
      this.hurtDuration = 420;
    } else {
      this.hurtDuration = 360;
    }

    if (this.boxer) {
      this.boxer.setMaterialHurtState(true);
      if (this.boxer.setVisorColor) {
        this.boxer.setVisorColor(0xff2244, 4.0); // Crimson pain flash
      }
    }
  }

  /**
   * Knocks out the opponent
   */
  knockout() {
    this.state = 'KO';
    this.stateTimer = performance.now();
    this.counterWindow = false;
    if (this.boxer) {
      this.boxer.setMaterialHurtState(true);
    }
  }

  /**
   * Kinematic Animation Update Loop
   */
  update(timestamp, dt, vrOffsets = null, handData = null, mirroredPoseLM = null, evaluation = null, width = 1280, height = 720) {
    if (!this.boxer) return;
    this.animClock += dt;

    if (vrOffsets) {
      this.applyPOVCamera(vrOffsets);
    }

    if (this.ring) {
      this.ring.update(dt);
    }

    if (this.playerGloves3D) {
      this.playerGloves3D.update(handData, mirroredPoseLM, evaluation, width, height, dt);
    }

    const elapsed = timestamp - this.stateTimer;

    // --- STATE MACHINE ---
    if (this.state === 'WINDUP') {
      const progress = Math.min(1.0, elapsed / this.windupDuration);
      const easedProgress = EASING.easeInOutQuad(progress);

      const startPose = EXTENDED_POSES.GUARD;
      const windupPoseName = this.activeAttackDef?.windupPose || 'GUARD';
      const targetPose = EXTENDED_POSES[windupPoseName] || EXTENDED_POSES.GUARD;

      const currentPose = interpolateJointTransforms(startPose, targetPose, easedProgress);
      this.applyJointPoseWithBounce(currentPose, timestamp, 0.2);

      // Biomechanical Step Forward: Boxer transfers weight and steps into pocket
      const reach = this.activeAttackDef?.forwardReach || 0.52;
      if (this.boxer && this.boxer.model) {
        const stepZ = reach * 0.20 * Math.max(0, (progress - 0.3) / 0.7);
        this.boxer.model.position.set(0, 0, stepZ);
      }

      if (elapsed >= this.windupDuration) {
        this.state = 'STRIKING';
        this.stateTimer = timestamp;
      }
    } else if (this.state === 'STRIKING') {
      const progress = Math.min(1.0, elapsed / this.strikeDuration);
      // Punch Snap curve launches fist explosively
      const easedProgress = EASING.punchSnap(progress);

      const windupPoseName = this.activeAttackDef?.windupPose || 'GUARD';
      const windupPose = EXTENDED_POSES[windupPoseName] || EXTENDED_POSES.GUARD;
      const strikePoseName = this.activeAttackDef?.strikePose || 'JAB';
      const strikePose = EXTENDED_POSES[strikePoseName] || EXTENDED_POSES.JAB;

      const currentPose = interpolateJointTransforms(windupPose, strikePose, easedProgress);
      this.applyJointPose(currentPose);

      // Full Forward Lunge & Follow-Through Surge:
      // Boxer drives entire body forward into the pocket right at the camera!
      const reach = this.activeAttackDef?.forwardReach || 0.52;
      if (this.boxer && this.boxer.model) {
        const forwardZ = reach * (0.20 + 0.80 * easedProgress);
        const verticalPop = (this.attackType === 'UPPERCUT') ? 0.09 * Math.sin(easedProgress * Math.PI) : 0;
        this.boxer.model.position.set(0, verticalPop, forwardZ);
      }

      if (elapsed >= this.strikeDuration) {
        // Attack reaches end of follow-through: snaps back to guard (unless player countered/evaded)
        this.state = 'RECOVERING';
        this.stateTimer = timestamp;
      }
    } else if (this.state === 'COMBO_WINDUP') {
      const progress = Math.min(1.0, elapsed / this.windupDuration);
      const easedProgress = EASING.easeInOutQuad(progress);

      // Strike 0 starts from GUARD; subsequent strikes start from previous step's chamber pose
      let startPose = EXTENDED_POSES.GUARD;
      if (this.comboStepIndex > 0 && this.activeCombo) {
        const prevStep = this.activeCombo.steps[this.comboStepIndex - 1];
        if (prevStep?.chamberPose && EXTENDED_POSES[prevStep.chamberPose]) {
          startPose = EXTENDED_POSES[prevStep.chamberPose];
        }
      }

      const windupPoseName = this.activeAttackDef?.windupPose || 'GUARD';
      const targetPose = EXTENDED_POSES[windupPoseName] || startPose;

      const currentPose = interpolateJointTransforms(startPose, targetPose, easedProgress);
      this.applyJointPoseWithBounce(currentPose, timestamp, 0.15);

      const reach = this.activeAttackDef?.forwardReach || 0.50;
      if (this.boxer && this.boxer.model) {
        const baseZ = (this.comboStepIndex > 0) ? reach * 0.45 : 0;
        const currentZ = baseZ + reach * 0.25 * easedProgress;
        this.boxer.model.position.set(0, 0, currentZ);
      }

      if (elapsed >= this.windupDuration) {
        this.state = 'COMBO_STRIKING';
        this.stateTimer = timestamp;
        this.stepEvaluated = false;
      }
    } else if (this.state === 'COMBO_STRIKING') {
      const progress = Math.min(1.0, elapsed / this.strikeDuration);
      const easedProgress = EASING.punchSnap(progress);

      const windupPoseName = this.activeAttackDef?.windupPose || 'GUARD';
      const windupPose = EXTENDED_POSES[windupPoseName] || EXTENDED_POSES.GUARD;
      const strikePoseName = this.activeAttackDef?.strikePose || 'JAB';
      const strikePose = EXTENDED_POSES[strikePoseName] || EXTENDED_POSES.JAB;

      const currentPose = interpolateJointTransforms(windupPose, strikePose, easedProgress);
      this.applyJointPose(currentPose);

      // Follow-Through drive in combination sequence
      const reach = this.activeAttackDef?.forwardReach || 0.50;
      if (this.boxer && this.boxer.model) {
        const forwardZ = reach * (0.45 + 0.55 * easedProgress);
        this.boxer.model.position.set(0, 0, forwardZ);
      }

      if (elapsed >= this.strikeDuration) {
        // Check if this was the final strike of the combination
        if (this.comboStepIndex >= this.comboTotalSteps - 1) {
          if (this.comboFullyEvaded) {
            this.openMassiveCounterWindow(timestamp, 1400);
          } else {
            this.openOpeningWindow(timestamp, 1000);
          }
        } else {
          // Kinetic transition into next punch chamber without returning to guard!
          this.state = 'COMBO_TRANSITION';
          this.stateTimer = timestamp;
        }
      }
    } else if (this.state === 'COMBO_TRANSITION') {
      const progress = Math.min(1.0, elapsed / this.transitionDuration);
      const easedProgress = EASING.easeInOutQuad(progress);

      const strikePoseName = this.activeAttackDef?.strikePose || 'JAB';
      const strikePose = EXTENDED_POSES[strikePoseName] || EXTENDED_POSES.JAB;
      const chamberPoseName = this.activeAttackDef?.chamberPose || 'GUARD';
      const chamberPose = EXTENDED_POSES[chamberPoseName] || EXTENDED_POSES.GUARD;

      // Kinetic momentum and weight shift loads the hips and shoulders for the next strike
      const currentPose = interpolateJointTransforms(strikePose, chamberPose, easedProgress);
      this.applyJointPose(currentPose);

      // Holds ground deep inside the sparring pocket
      const reach = this.activeAttackDef?.forwardReach || 0.50;
      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(0, 0, reach * 0.75);
      }

      if (elapsed >= this.transitionDuration) {
        // Launch next strike in combo sequence
        this.startComboStep(this.comboStepIndex + 1);
      }
    } else if (this.state === 'RECOVERING') {
      const progress = Math.min(1.0, elapsed / this.recoverDuration);
      const easedProgress = EASING.easeOutCubic(progress);

      const strikePoseName = this.activeAttackDef?.strikePose || 'JAB';
      const strikePose = EXTENDED_POSES[strikePoseName] || EXTENDED_POSES.JAB;
      const guardPose = EXTENDED_POSES.GUARD;

      const currentPose = interpolateJointTransforms(strikePose, guardPose, easedProgress);
      this.applyJointPose(currentPose);

      // Snap back from forward punch surge back to stance
      const reach = this.activeAttackDef?.forwardReach || 0.50;
      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(0, 0, reach * (1.0 - easedProgress));
      }

      if (elapsed >= this.recoverDuration) {
        this.state = 'IDLE';
        this.counterWindow = false;
        this.massiveCounter = false;
        this.attackType = null;
        this.activeAttackDef = null;
        this.activeStepDef = null;
        this.activeCombo = null;
        this.requiredDefense = null;
        if (this.boxer && this.boxer.model) {
          this.boxer.model.position.set(0, 0, 0);
        }
        if (this.boxer && this.boxer.setVisorColor) {
          this.boxer.setVisorColor(0x00f3ff, 2.0);
        }
      }
    } else if (this.state === 'OPENING') {
      // Vulnerable guard dropped state - prime time for counter punches!
      const progress = Math.min(1.0, elapsed / this.openingDuration);
      const easedProgress = EASING.easeOutQuad(Math.min(1.0, progress * 2.2));
      const currentPose = interpolateJointTransforms(EXTENDED_POSES.GUARD, EXTENDED_POSES.OPENING, easedProgress);
      this.applyJointPoseWithBounce(currentPose, timestamp, 0.28);

      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(0, 0, 0.12 * (1.0 - easedProgress));
      }

      if (elapsed >= this.openingDuration) {
        this.state = 'IDLE';
        this.counterWindow = false;
        this.massiveCounter = false;
        this.lastIdleOpeningCheck = timestamp + (this.difficulty === 'ROOKIE' ? 5500 : this.difficulty === 'CHAMPION' ? 13000 : 8000);
        if (this.boxer && this.boxer.model) {
          this.boxer.model.position.set(0, 0, 0);
        }
        if (this.boxer && this.boxer.setVisorColor) {
          this.boxer.setVisorColor(0x00f3ff, 2.0);
        }
      }
    } else if (this.state === 'DEFENDING') {
      // Dynamic 3D Bot Defense (High Guard Block, Slip Left, Slip Right, Duck)
      const progress = Math.min(1.0, elapsed / this.defenseDuration);
      const arc = Math.sin(progress * Math.PI);
      const easedArc = EASING.easeInOutQuad(arc);

      let targetPose = EXTENDED_POSES.HIGH_GUARD_BLOCK;
      let posX = 0;
      let posY = 0;
      let posZ = 0;

      if (this.defenseType === 'SLIP_LEFT') {
        targetPose = EXTENDED_POSES.SLIP_LEFT;
        posX = -0.26 * easedArc;
        posY = -0.06 * easedArc;
      } else if (this.defenseType === 'SLIP_RIGHT') {
        targetPose = EXTENDED_POSES.SLIP_RIGHT;
        posX = 0.26 * easedArc;
        posY = -0.06 * easedArc;
      } else if (this.defenseType === 'DUCK') {
        targetPose = EXTENDED_POSES.DUCK;
        posY = -0.28 * easedArc;
        posZ = 0.08 * easedArc;
      } else {
        // High Guard Block: Forearms vertical, elbows tight, elastic shudder
        targetPose = EXTENDED_POSES.HIGH_GUARD_BLOCK;
        posZ = -0.09 * Math.sin(progress * Math.PI * 1.5) * Math.exp(-progress * 2.0);
      }

      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(posX, posY, posZ);
      }

      const currentPose = interpolateJointTransforms(EXTENDED_POSES.GUARD, targetPose, easedArc);
      this.applyJointPose(currentPose);

      if (elapsed >= this.defenseDuration) {
        this.state = 'IDLE';
        this.defenseType = null;
        if (this.boxer && this.boxer.model) {
          this.boxer.model.position.set(0, 0, 0);
        }
      }
    } else if (this.state === 'HURT') {
      const progress = Math.min(1.0, elapsed / this.hurtDuration);
      let hurtPose = EXTENDED_POSES.HURT;
      if (this.lastHitPunchType === 'LEFT_UPPERCUT' || this.lastHitPunchType === 'RIGHT_UPPERCUT') {
        hurtPose = EXTENDED_POSES.HURT_UPPERCUT;
      } else if (this.lastHitPunchType === 'LEFT_HOOK') {
        hurtPose = EXTENDED_POSES.HURT_HOOK_LEFT;
      } else if (this.lastHitPunchType === 'RIGHT_HOOK') {
        hurtPose = EXTENDED_POSES.HURT_HOOK_RIGHT;
      } else if (this.lastHitPunchType === 'CROSS') {
        hurtPose = EXTENDED_POSES.HURT_STRAIGHT;
      }

      // Hurt Recoil Physics: knockback along Z axis
      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(0, 0, -0.16 * (1.0 - progress));
      }

      if (progress < 0.35) {
        // Fast snap back into hurt recoil with punch-specific keyframes
        const subT = progress / 0.35;
        const currentPose = interpolateJointTransforms(EXTENDED_POSES.GUARD, hurtPose, EASING.easeOutQuad(subT));
        this.applyJointPose(currentPose);
      } else {
        // Recover from hurt back into guard
        const subT = (progress - 0.35) / 0.65;
        const currentPose = interpolateJointTransforms(hurtPose, EXTENDED_POSES.GUARD, EASING.easeInOutQuad(subT));
        this.applyJointPose(currentPose);
      }

      if (elapsed >= this.hurtDuration) {
        this.state = 'IDLE';
        this.lastIdleOpeningCheck = timestamp + 3500;
        if (this.boxer && this.boxer.model) {
          this.boxer.model.position.set(0, 0, 0);
        }
        if (this.boxer) {
          this.boxer.setMaterialHurtState(false);
          if (this.boxer.setVisorColor) {
            this.boxer.setVisorColor(0x00f3ff, 2.0);
          }
        }
      }
    } else if (this.state === 'KO') {
      const progress = Math.min(1.0, elapsed / 1800);
      const easedProgress = EASING.easeOutQuad(progress);
      const currentPose = interpolateJointTransforms(EXTENDED_POSES.HURT, EXTENDED_POSES.KO, easedProgress);
      this.applyJointPose(currentPose);
    } else {
      // --- IDLE COMBAT STANCE BOUNCE OR PERIODIC GUARD DROP OPENING ---
      if (this.boxer && this.boxer.model) {
        this.boxer.model.position.set(0, 0, 0);
      }
      const idleOpeningInterval = this.difficulty === 'ROOKIE' ? 6000 : this.difficulty === 'CHAMPION' ? 13500 : 8500;
      if (timestamp > this.lastIdleOpeningCheck + idleOpeningInterval) {
        this.openOpeningWindow(timestamp);
        this.lastIdleOpeningCheck = timestamp + this.openingDuration + 1500;
      } else {
        this.applyIdleBreathingAndBounce(timestamp);
      }
    }

    // --- UPDATE HIT TRACKING TELEMETRY ---
    this.updateHitTelemetry(timestamp);
  }

  /**
   * Authentic Boxing Idle Bounce (Weight shift, breathing core, rhythmic guard pulse)
   */
  applyIdleBreathingAndBounce(timestamp) {
    const t = timestamp * 0.0035;

    // Organic athletic bounce and weight transfer
    const bounceY = Math.abs(Math.sin(t * 1.8)) * 0.018;
    const swayX = Math.sin(t * 1.4) * 0.028;
    const torsoBreath = Math.sin(t * 1.6) * 0.022;

    // Apply guard baseline
    const basePose = EXTENDED_POSES.GUARD;
    this.boxer.applyPose(basePose);

    // Realistic sparring head slips, active distance measuring lead glove, and footwork
    const joints = this.boxer.joints;
    if (joints.pelvis) {
      joints.pelvis.position.y = 0.95 + bounceY;
      joints.pelvis.position.x = swayX;
      joints.pelvis.position.z = Math.sin(t * 1.2) * 0.015;
    }
    if (joints.spine) {
      joints.spine.rotation.x = -0.07 + torsoBreath;
      joints.spine.rotation.y = 0.09 + swayX * 1.1;
      joints.spine.rotation.z = Math.sin(t * 1.4) * 0.015;
    }
    if (joints.head) {
      // Active head movement: slipping off centerline to evade counters
      joints.head.rotation.x = 0.09 + Math.sin(t * 1.8) * 0.025;
      joints.head.rotation.y = -0.24 + Math.sin(t * 1.4) * 0.05;
      joints.head.rotation.z = Math.cos(t * 1.4) * 0.03;
    }
    if (joints.leftShoulder) {
      joints.leftShoulder.rotation.z = -0.06 + Math.sin(t * 1.4) * 0.025;
    }
    if (joints.leftUpperArm) {
      // Lead hand pumping forward and backward measuring distance
      joints.leftUpperArm.rotation.x = -0.46 + Math.sin(t * 2.8) * 0.05;
    }
    if (joints.leftForearm) {
      joints.leftForearm.rotation.x = Math.sin(t * 2.8) * 0.03;
    }
    if (joints.rightUpperArm) {
      // Rear hand tightly guarding jaw
      joints.rightUpperArm.rotation.x = -0.36 + Math.cos(t * 2.0) * 0.02;
    }
  }

  /**
   * Applies joint pose with slight athletic weight bounce
   */
  applyJointPoseWithBounce(pose, timestamp, factor = 0.2) {
    this.applyJointPose(pose);
    const t = timestamp * 0.005;
    const microBounce = Math.sin(t * 2) * (0.015 * factor);
    if (this.boxer.joints.pelvis) {
      this.boxer.joints.pelvis.position.y += microBounce;
    }
  }

  /**
   * Applies transform dictionary to boxer joints
   */
  applyJointPose(pose) {
    if (!pose) return;
    const joints = this.boxer.joints;

    for (const [jointName, transform] of Object.entries(pose)) {
      const joint = joints[jointName];
      if (!joint) continue;

      if (transform.pos) {
        joint.position.set(transform.pos[0], transform.pos[1], transform.pos[2]);
      }
      if (transform.rot) {
        joint.rotation.set(transform.rot[0], transform.rot[1], transform.rot[2]);
      }
    }
  }

  /**
   * Real-Time Hit Tracking:
   * Maps 3D Knuckle World Position -> Screen Space NDC & Pixels
   * Computes Threat Trajectory & Hit Target Point
   */
  updateHitTelemetry(timestamp) {
    if (!this.boxer || !this.camera || !this.canvas) return;

    const isLeftArm = this.activeAttackDef?.arm === 'LEFT';
    const fistWorldPos = isLeftArm
      ? this.boxer.getLeftFistWorldPos()
      : this.boxer.getRightFistWorldPos();

    // Screen Space Projection
    const ndc = fistWorldPos.clone().project(this.camera);

    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    const screenX = ((ndc.x + 1) / 2) * w;
    const screenY = ((-ndc.y + 1) / 2) * h;

    // Calculate Strike Danger Progress (0 to 1)
    let threatProgress = 0;
    let isActiveStrike = false;
    let isDangerZone = false;

    if (this.state === 'WINDUP' || this.state === 'COMBO_WINDUP') {
      const elapsed = timestamp - this.stateTimer;
      threatProgress = Math.min(1.0, (elapsed / this.windupDuration) * 0.7);
    } else if (this.state === 'STRIKING' || this.state === 'COMBO_STRIKING') {
      threatProgress = 0.7 + Math.min(0.3, ((timestamp - this.stateTimer) / this.strikeDuration) * 0.3);
      isActiveStrike = true;
      isDangerZone = true;
    } else if (this.state === 'COMBO_TRANSITION') {
      threatProgress = 0.82;
      isActiveStrike = false;
      isDangerZone = false;
    } else if (this.state === 'RECOVERING') {
      threatProgress = 1.0;
      isActiveStrike = false;
      isDangerZone = false;
    }

    this.hitTelemetry = {
      fistWorldPos,
      screenPos: { x: screenX, y: screenY },
      depthZ: fistWorldPos.z,
      threatProgress,
      targetRegion: this.activeAttackDef?.targetRegion || 'CHIN',
      requiredDefense: this.requiredDefense || 'NONE',
      isActiveStrike,
      isDangerZone,
      attackName: this.activeAttackDef?.name || 'ATTACK',
      screenOffset: this.activeAttackDef?.screenTargetOffset || { x: 0, y: 0 }
    };
  }

  /**
   * Applies 6-DOF POV Head-Tracking to Three.js perspective camera
   * Directly unmirrored: moving head left shifts camera left; moving head right shifts camera right;
   * ducking drops camera down; leaning in surges camera forward into close pocket.
   */
  applyPOVCamera(vrOffsets = {}) {
    if (!this.camera) return;

    const camX = vrOffsets.camX || 0;
    const camY = vrOffsets.camY || 0;
    const camZ = vrOffsets.camZ || 0;
    const roll = vrOffsets.roll || 0;

    // Base close sparring pocket anchor (Shane Fazen fightTIPS reference)
    const baseCamX = 0.0;
    const baseCamY = 1.48;
    const baseCamZ = 1.45;

    // Direct, unmirrored 1:1 POV head tracking:
    // Move head LEFT (camX < 0) -> POV camera moves LEFT (-X) in ring -> opponent shifts RIGHT
    // Move head RIGHT (camX > 0) -> POV camera moves RIGHT (+X) in ring -> opponent shifts LEFT
    this.camera.position.x = baseCamX + camX * 0.45;

    // Duck DOWN (camY > 0) -> POV camera drops DOWN (-Y) -> opponent punches fly overhead
    // Stand UP (camY < 0) -> POV camera rises UP (+Y)
    this.camera.position.y = baseCamY - camY * 0.38;

    // Lean IN towards screen (camZ > 0) -> camera surges closer into sparring pocket (-Z)
    // Pull BACK out of reach (camZ < 0) -> camera pulls back (+Z)
    this.camera.position.z = baseCamZ - camZ * 0.55;

    // Aim eyes at opponent's chin/core with dynamic eye-tracking
    const lookTargetX = camX * 0.12;
    const lookTargetY = 1.36 - camY * 0.12;
    const lookTargetZ = 0.0;
    this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

    // Apply head roll tilt (tilting head tilts your view of the ring)
    this.camera.rotation.z += -roll * 0.40;
  }

  /**
   * Renders the 3D scene coupled to the POV Head-Tracking Camera
   * @param {Object} vrOffsets Head-Coupled Perspective offsets { camX, camY, camZ, roll, pitch }
   */
  render(vrOffsets = {}) {
    if (!this.renderer || !this.scene || !this.camera || !this.isVisible) return;
    this.applyPOVCamera(vrOffsets);
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Draws Dynamic Holographic Targeting Reticle on 2D Game Canvas
   * Shows user where bot is aiming, combo progression, and flying fist trajectory
   */
  renderTargetingHUD(ctx, width, height) {
    const isAttackingState =
      this.state === 'WINDUP' ||
      this.state === 'STRIKING' ||
      this.state === 'COMBO_WINDUP' ||
      this.state === 'COMBO_STRIKING' ||
      this.state === 'COMBO_TRANSITION';

    if (!isAttackingState) {
      if (this.state === 'OPENING' || this.counterWindow) {
        this.renderOpeningNotice(ctx, width, height);
      }
      return;
    }

    const { screenPos, threatProgress, targetRegion, requiredDefense, attackName, isDangerZone } = this.hitTelemetry;

    const tx = screenPos.x;
    const ty = screenPos.y;

    ctx.save();

    // 1. Threat Expanding Rings
    const ringRadius = 24 + (1 - threatProgress) * 45;
    const pulseAlpha = 0.4 + Math.sin(performance.now() * 0.015) * 0.3;

    // Dynamic color: Cyan -> Warning Gold -> Danger Crimson
    let ringColor = '#00f3ff';
    if (threatProgress > 0.75 || isDangerZone) {
      ringColor = '#ff2255';
    } else if (threatProgress > 0.45) {
      ringColor = '#ffc700';
    }

    // Outer Target Bracket
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = isDangerZone ? 3.5 : 2.0;
    ctx.globalAlpha = pulseAlpha;

    ctx.beginPath();
    ctx.arc(tx, ty, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Crosshair Reticle
    const crossSize = 12;
    ctx.beginPath();
    ctx.moveTo(tx - crossSize, ty);
    ctx.lineTo(tx + crossSize, ty);
    ctx.moveTo(tx, ty - crossSize);
    ctx.lineTo(tx, ty + crossSize);
    ctx.stroke();

    // Center Warning Bullseye
    ctx.fillStyle = ringColor;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(tx, ty, 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. HUD Danger Callout Capsule
    ctx.globalAlpha = 0.95;
    let labelText = `⚠️ ${attackName} → AIM: ${targetRegion}`;
    if (this.activeCombo) {
      const stepNum = this.comboStepIndex + 1;
      const totalSteps = this.comboTotalSteps;
      labelText = `🔥 COMBO [${stepNum}/${totalSteps}]: ${attackName} → AIM: ${targetRegion}`;
    }

    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(labelText).width;

    const capsuleX = tx - textW * 0.5 - 12;
    const capsuleY = ty - ringRadius - 32;

    ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(capsuleX, capsuleY, textW + 24, 24, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ringColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, tx, capsuleY + 12);

    // 3. Evasion Hint Pill Below Target
    const hintText = `DODGE: [ ${requiredDefense} ]`;
    ctx.font = '800 12px "Russo One", sans-serif';
    const hintW = ctx.measureText(hintText).width;

    const hintY = ty + ringRadius + 14;
    ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
    ctx.strokeStyle = '#00f3ff';
    ctx.beginPath();
    ctx.roundRect(tx - hintW * 0.5 - 10, hintY, hintW + 20, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.fillText(hintText, tx, hintY + 11);

    // 4. Multi-Strike Combo Progress Pips (e.g. ● ● ○)
    if (this.activeCombo && this.comboTotalSteps > 1) {
      const pipRadius = 5;
      const pipSpacing = 16;
      const totalPipW = (this.comboTotalSteps - 1) * pipSpacing;
      const startPipX = tx - totalPipW * 0.5;
      const pipY = hintY + 30;

      for (let i = 0; i < this.comboTotalSteps; i++) {
        const px = startPipX + i * pipSpacing;
        ctx.beginPath();
        ctx.arc(px, pipY, pipRadius, 0, Math.PI * 2);

        if (i < this.comboStepIndex) {
          // Completed strike
          if (this.comboEvadedSteps[i]) {
            ctx.fillStyle = '#00ff88'; // Evaded
          } else {
            ctx.fillStyle = '#ff3366'; // Clipped
          }
          ctx.fill();
        } else if (i === this.comboStepIndex) {
          // Current active strike
          ctx.fillStyle = ringColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Upcoming strike
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Renders glowing Counter Opening opportunity notification with target brackets
   */
  renderOpeningNotice(ctx, width, height) {
    ctx.save();
    const cx = width * 0.5;
    const cy = height * 0.40;
    const now = performance.now();
    const pulse = 0.75 + Math.sin(now * 0.016) * 0.25;
    const isMassive = this.massiveCounter;

    // 1. Expanding Golden Target Ring over Chin / Center
    const ringRadius = 30 + (Math.sin(now * 0.012) + 1) * 7;
    const ringColor = isMassive ? '#ff0055' : '#ffb700';

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = isMassive ? 3.5 : 2.5;
    ctx.globalAlpha = pulse;

    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(cx - ringRadius - 6, cy); ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + ringRadius + 6, cy);
    ctx.moveTo(cx, cy - ringRadius - 6); ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + ringRadius + 6);
    ctx.stroke();

    // Center Golden Bullseye
    ctx.fillStyle = ringColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Glowing Banner
    ctx.globalAlpha = 0.96;
    const noticeText = isMassive
      ? '⚡⚡ MASSIVE PUNISH OPENING! STRIKE NOW! ⚡⚡'
      : '⚡ OPENING! COUNTER ATTACK NOW! ⚡';
    ctx.font = '800 15px "Russo One", sans-serif';
    const textW = ctx.measureText(noticeText).width;
    const bannerH = 34;
    const bannerY = cy - ringRadius - 38;

    ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(cx - textW * 0.5 - 16, bannerY, textW + 32, bannerH, 17);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ringColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(noticeText, cx, bannerY + bannerH * 0.5);

    // 3. Recommended Strike Hints Pill Below
    const hintText = 'HIT: HOOK • UPPERCUT • CROSS';
    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    const hintW = ctx.measureText(hintText).width;
    const hintY = cy + ringRadius + 14;

    ctx.fillStyle = 'rgba(10, 14, 24, 0.88)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(cx - hintW * 0.5 - 12, hintY, hintW + 24, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f3ff';
    ctx.fillText(hintText, cx, hintY + 11);

    ctx.restore();
  }

  /**
   * Set Player 3D Gloves Color Theme
   */
  setGloveTheme(theme) {
    if (this.playerGloves3D) {
      this.playerGloves3D.setTheme(theme);
    }
  }

  toggleGloves() {
    if (this.playerGloves3D) {
      return this.playerGloves3D.toggle();
    }
    return false;
  }

  /**
   * Clean up WebGL resources
   */
  dispose() {
    if (this.boxer) {
      this.boxer.dispose();
    }
    if (this.ring) {
      this.ring.dispose();
      this.ring = null;
    }
    if (this.playerGloves3D) {
      this.playerGloves3D.dispose();
      this.playerGloves3D = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export default Boxer3DScene;
