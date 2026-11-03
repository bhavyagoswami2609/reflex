import * as THREE from 'three';

/**
 * Authentic Human Sparring Boxer 3D Character Model
 * Inspired by Shane Fazen (fightTIPS) Virtual Sparring Boxing:
 * - Natural athletic human proportions (toned neck, broad shoulders, athletic chest & arms)
 * - Realistic athlete skin materials with warm specular response
 * - Sculpted human head with athletic brow, nose, ears, and backwards athletic baseball cap
 * - Blonde/brown hair fringe visible beneath backwards cap
 * - White fitted athletic performance sparring t-shirt with black aerodynamic side panels
 * - Dark charcoal/black athletic sparring shorts with elastic waistband and drawstring
 * - Pro 16oz sparring boxing gloves (matte white knuckle punch casing, black palm/thumb, red accent stripe)
 * - Athletic crew socks with double stripes and black/white boxing boots
 * - 100% seamless kinematic joint hierarchy matching boxer3DAnimator.js
 */

// Preset Human Sparring Poses (Euler rotations in radians [x, y, z])
export const HUMAN_BOXER_POSES = {
  // Authentic Orthodox Guard:
  // Head tilted forward, chin tucked behind raised lead left shoulder.
  // Left glove out front protecting centerline, right glove held tightly against right cheek/jaw.
  // Elbows tucked tight protecting liver and ribs. Weight balanced over bent knees.
  GUARD: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.16, 0] },
    spine: { rot: [-0.07, 0.09, -0.02] },
    neck: { rot: [-0.05, 0, 0] },
    head: { rot: [0.09, -0.24, 0] },
    leftShoulder: { rot: [-0.16, -0.12, -0.06] },
    leftUpperArm: { rot: [-0.46, 0.12, -0.12] },
    leftElbow: { rot: [-1.84, 0, 0] },
    leftWrist: { rot: [0.26, 0.12, 0] },
    rightShoulder: { rot: [-0.10, 0.12, 0.06] },
    rightUpperArm: { rot: [-0.36, -0.16, 0.10] },
    rightElbow: { rot: [-1.98, 0, 0] },
    rightWrist: { rot: [0.22, -0.16, 0] },
    leftThigh: { rot: [-0.15, 0.13, 0] },
    leftKnee: { rot: [0.30, 0, 0] },
    leftFoot: { rot: [-0.15, 0, 0] },
    rightThigh: { rot: [0.19, 0.22, 0] },
    rightKnee: { rot: [0.34, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Blinding Straight Lead Jab:
  // Snapping lead fist straight down the pipe into camera, chin buried behind lead shoulder,
  // right glove glued to right cheek.
  JAB: {
    pelvis: { pos: [0, 0.95, 0.02], rot: [0, 0.16, 0] },
    spine: { rot: [-0.09, 0.14, 0] },
    neck: { rot: [0.03, 0, 0] },
    head: { rot: [0.06, -0.27, 0] },
    leftShoulder: { rot: [-0.16, -0.34, 0] },
    leftUpperArm: { rot: [-1.52, 0.06, 0] },
    leftElbow: { rot: [-0.05, 0, 0] },
    leftWrist: { rot: [0.06, 0.12, 0] },
    rightShoulder: { rot: [-0.11, 0.14, 0.06] },
    rightUpperArm: { rot: [-0.36, -0.16, 0.11] },
    rightElbow: { rot: [-2.04, 0, 0] },
    rightWrist: { rot: [0.22, -0.16, 0] },
    leftThigh: { rot: [-0.22, 0.12, 0] },
    leftKnee: { rot: [0.38, 0, 0] },
    leftFoot: { rot: [-0.16, 0, 0] },
    rightThigh: { rot: [0.24, 0.16, 0] },
    rightKnee: { rot: [0.40, 0, 0] },
    rightFoot: { rot: [-0.16, 0, 0] }
  },

  // Devastating Rear Right Cross:
  // Power hip rotation driving forward, right arm extended straight,
  // left glove shielding left jaw, right shoulder covering right chin.
  CROSS: {
    pelvis: { pos: [0, 0.95, 0.03], rot: [0, -0.17, 0] },
    spine: { rot: [-0.09, -0.14, 0] },
    neck: { rot: [0.03, 0, 0] },
    head: { rot: [0.07, 0.27, 0] },
    leftShoulder: { rot: [-0.16, -0.12, -0.06] },
    leftUpperArm: { rot: [-0.44, 0.14, -0.12] },
    leftElbow: { rot: [-2.02, 0, 0] },
    leftWrist: { rot: [0.24, 0.12, 0] },
    rightShoulder: { rot: [-0.17, 0.35, 0] },
    rightUpperArm: { rot: [-1.52, -0.06, 0] },
    rightElbow: { rot: [-0.05, 0, 0] },
    rightWrist: { rot: [0.06, -0.12, 0] },
    leftThigh: { rot: [-0.12, 0.16, 0] },
    leftKnee: { rot: [0.27, 0, 0] },
    leftFoot: { rot: [-0.13, 0, 0] },
    rightThigh: { rot: [0.17, 0.27, 0] },
    rightKnee: { rot: [0.45, 0, 0] },
    rightFoot: { rot: [-0.18, 0, 0] }
  },

  // High Horizontal Lead Hook:
  // Sweeping across the camera field of view, elbow at 90 degrees, torso rotated with the hook.
  HOOK: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, -0.14, 0] },
    spine: { rot: [-0.07, -0.24, 0] },
    neck: { rot: [0.03, 0, 0] },
    head: { rot: [0.07, 0.30, 0] },
    leftShoulder: { rot: [-0.24, -0.12, -0.16] },
    leftUpperArm: { rot: [-1.38, 0.24, -0.68] },
    leftElbow: { rot: [-1.57, 0, 0] },
    leftWrist: { rot: [0.12, 0.22, 0] },
    rightShoulder: { rot: [-0.11, 0.12, 0.06] },
    rightUpperArm: { rot: [-0.36, -0.16, 0.11] },
    rightElbow: { rot: [-2.04, 0, 0] },
    rightWrist: { rot: [0.22, -0.16, 0] },
    leftThigh: { rot: [-0.16, 0.14, 0] },
    leftKnee: { rot: [0.30, 0, 0] },
    leftFoot: { rot: [-0.15, 0, 0] },
    rightThigh: { rot: [0.20, 0.22, 0] },
    rightKnee: { rot: [0.34, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Looping Rear Power Hook:
  RIGHT_HOOK: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.24, 0] },
    spine: { rot: [-0.09, 0.30, 0] },
    neck: { rot: [0.03, 0, 0] },
    head: { rot: [0.09, -0.34, 0] },
    leftShoulder: { rot: [-0.16, -0.12, -0.06] },
    leftUpperArm: { rot: [-0.46, 0.12, -0.12] },
    leftElbow: { rot: [-2.02, 0, 0] },
    leftWrist: { rot: [0.26, 0.12, 0] },
    rightShoulder: { rot: [-0.24, 0.16, 0.27] },
    rightUpperArm: { rot: [-1.38, -0.27, 0.75] },
    rightElbow: { rot: [-1.55, 0, 0] },
    rightWrist: { rot: [0.12, -0.27, 0] },
    leftThigh: { rot: [-0.16, 0.14, 0] },
    leftKnee: { rot: [0.30, 0, 0] },
    leftFoot: { rot: [-0.15, 0, 0] },
    rightThigh: { rot: [0.20, 0.22, 0] },
    rightKnee: { rot: [0.34, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Upward Thrusting Rear Uppercut:
  UPPERCUT: {
    pelvis: { pos: [0, 0.98, 0.08], rot: [0, 0.20, 0] },
    spine: { rot: [0.09, 0.24, 0] },
    neck: { rot: [-0.02, 0, 0] },
    head: { rot: [-0.05, -0.16, 0] },
    leftShoulder: { rot: [-0.16, -0.12, -0.06] },
    leftUpperArm: { rot: [-0.46, 0.12, -0.12] },
    leftElbow: { rot: [-2.02, 0, 0] },
    leftWrist: { rot: [0.26, 0.12, 0] },
    rightShoulder: { rot: [-0.37, 0.27, 0.12] },
    rightUpperArm: { rot: [-1.18, 0.06, 0.12] },
    rightElbow: { rot: [-1.35, 0, 0] },
    rightWrist: { rot: [0.58, 0, 0] },
    leftThigh: { rot: [-0.13, 0.12, 0] },
    leftKnee: { rot: [0.24, 0, 0] },
    rightThigh: { rot: [0.20, 0.16, 0] },
    rightKnee: { rot: [0.30, 0, 0] }
  },

  // Downward Looping Overhand Missile:
  OVERHAND: {
    pelvis: { pos: [0.06, 0.93, 0.05], rot: [0, 0.20, 0] },
    spine: { rot: [-0.20, 0.24, -0.24] },
    neck: { rot: [0.05, 0, 0] },
    head: { rot: [0.16, -0.27, 0.16] },
    leftShoulder: { rot: [-0.16, -0.12, -0.06] },
    leftUpperArm: { rot: [-0.46, 0.12, -0.12] },
    leftElbow: { rot: [-2.02, 0, 0] },
    leftWrist: { rot: [0.26, 0.12, 0] },
    rightShoulder: { rot: [-0.37, 0.27, 0.22] },
    rightUpperArm: { rot: [-1.68, -0.12, 0.27] },
    rightElbow: { rot: [-0.45, 0, 0] },
    rightWrist: { rot: [-0.22, -0.16, 0] }
  },

  // Level-Change Crouching Shovel Hook into Ribs:
  BODY_SHOT: {
    pelvis: { pos: [0.04, 0.84, 0.06], rot: [0, -0.20, 0] },
    spine: { rot: [-0.14, -0.24, -0.14] },
    neck: { rot: [0.05, 0, 0] },
    head: { rot: [0.11, 0.24, 0.09] },
    leftShoulder: { rot: [-0.27, -0.16, -0.16] },
    leftUpperArm: { rot: [-1.18, 0.27, -0.37] },
    leftElbow: { rot: [-1.45, 0, 0] },
    leftWrist: { rot: [0.37, 0.16, 0] },
    rightShoulder: { rot: [-0.11, 0.12, 0.06] },
    rightUpperArm: { rot: [-0.36, -0.16, 0.11] },
    rightElbow: { rot: [-2.08, 0, 0] },
    rightWrist: { rot: [0.22, -0.16, 0] },
    leftThigh: { rot: [-0.27, 0.16, 0] },
    leftKnee: { rot: [0.58, 0, 0] }
  },

  // Defensive Slip Left:
  SLIP_LEFT: {
    pelvis: { pos: [-0.08, 0.93, 0], rot: [0, 0.30, 0] },
    spine: { rot: [-0.08, 0.15, 0.22] },
    head: { rot: [0.12, -0.25, -0.15] },
    leftShoulder: { rot: [-0.15, 0, -0.10] },
    leftUpperArm: { rot: [-0.48, 0.15, -0.12] },
    leftElbow: { rot: [-1.88, 0, 0] },
    leftWrist: { rot: [0.20, 0.10, 0] },
    rightShoulder: { rot: [-0.10, 0, 0.05] },
    rightUpperArm: { rot: [-0.40, -0.20, 0.10] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.20, -0.15, 0] },
    leftThigh: { rot: [-0.20, 0.15, 0] },
    leftKnee: { rot: [0.38, 0, 0] },
    leftFoot: { rot: [-0.18, 0, 0] },
    rightThigh: { rot: [0.15, 0.20, 0] },
    rightKnee: { rot: [0.28, 0, 0] },
    rightFoot: { rot: [-0.12, 0, 0] }
  },

  // Defensive Slip Right:
  SLIP_RIGHT: {
    pelvis: { pos: [0.08, 0.93, 0], rot: [0, 0.15, 0] },
    spine: { rot: [-0.08, 0.08, -0.22] },
    head: { rot: [0.12, -0.38, 0.15] },
    leftShoulder: { rot: [-0.15, 0, -0.10] },
    leftUpperArm: { rot: [-0.42, 0.15, -0.15] },
    leftElbow: { rot: [-1.80, 0, 0] },
    leftWrist: { rot: [0.20, 0.10, 0] },
    rightShoulder: { rot: [-0.10, 0, 0.05] },
    rightUpperArm: { rot: [-0.45, -0.25, 0.15] },
    rightElbow: { rot: [-1.98, 0, 0] },
    rightWrist: { rot: [0.20, -0.15, 0] },
    leftThigh: { rot: [-0.12, 0.10, 0] },
    leftKnee: { rot: [0.25, 0, 0] },
    leftFoot: { rot: [-0.12, 0, 0] },
    rightThigh: { rot: [0.22, 0.22, 0] },
    rightKnee: { rot: [0.42, 0, 0] },
    rightFoot: { rot: [-0.20, 0, 0] }
  },

  // Duck / Bob & Weave:
  DUCK: {
    pelvis: { pos: [0, 0.76, 0.05], rot: [0, 0.20, 0] },
    spine: { rot: [-0.22, 0.10, 0] },
    neck: { rot: [0.10, 0, 0] },
    head: { rot: [0.18, -0.28, 0] },
    leftShoulder: { rot: [-0.10, 0, -0.10] },
    leftUpperArm: { rot: [-0.40, 0.15, -0.10] },
    leftElbow: { rot: [-1.92, 0, 0] },
    leftWrist: { rot: [0.20, 0.10, 0] },
    rightShoulder: { rot: [-0.08, 0, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.20, 0.10] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.20, -0.15, 0] },
    leftThigh: { rot: [-0.45, 0.12, 0] },
    leftKnee: { rot: [0.85, 0, 0] },
    leftFoot: { rot: [-0.40, 0, 0] },
    rightThigh: { rot: [-0.35, 0.18, 0] },
    rightKnee: { rot: [0.88, 0, 0] },
    rightFoot: { rot: [-0.42, 0, 0] }
  },

  // Struck / Hurt Recoil Stun:
  HURT: {
    pelvis: { pos: [0, 0.94, -0.05], rot: [0, 0.10, 0] },
    spine: { rot: [0.24, -0.15, 0.05] },
    neck: { rot: [0.25, 0, 0] },
    head: { rot: [0.38, -0.25, 0.15] },
    leftShoulder: { rot: [-0.05, 0, -0.20] },
    leftUpperArm: { rot: [-0.20, 0.10, -0.35] },
    leftElbow: { rot: [-1.20, 0, 0] },
    leftWrist: { rot: [0.10, 0.10, 0] },
    rightShoulder: { rot: [0.05, 0, 0.20] },
    rightUpperArm: { rot: [-0.25, -0.10, 0.35] },
    rightElbow: { rot: [-1.10, 0, 0] },
    rightWrist: { rot: [0.10, -0.10, 0] },
    leftThigh: { rot: [-0.10, 0.10, 0] },
    leftKnee: { rot: [0.20, 0, 0] },
    leftFoot: { rot: [-0.10, 0, 0] },
    rightThigh: { rot: [0.25, 0.15, 0] },
    rightKnee: { rot: [0.35, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Full Knockout Collapse:
  KO: {
    pelvis: { pos: [0, 0.45, -0.20], rot: [0, 0.10, 0] },
    spine: { rot: [0.55, -0.10, 0] },
    neck: { rot: [0.30, 0, 0] },
    head: { rot: [0.45, -0.20, 0] },
    leftShoulder: { rot: [0.10, 0, -0.30] },
    leftUpperArm: { rot: [0.15, 0, -0.40] },
    leftElbow: { rot: [-0.35, 0, 0] },
    leftWrist: { rot: [0, 0, 0] },
    rightShoulder: { rot: [0.10, 0, 0.30] },
    rightUpperArm: { rot: [0.15, 0, 0.40] },
    rightElbow: { rot: [-0.35, 0, 0] },
    rightWrist: { rot: [0, 0, 0] },
    leftThigh: { rot: [-0.80, 0.20, 0] },
    leftKnee: { rot: [1.35, 0, 0] },
    leftFoot: { rot: [-0.55, 0, 0] },
    rightThigh: { rot: [-0.75, -0.15, 0] },
    rightKnee: { rot: [1.40, 0, 0] },
    rightFoot: { rot: [-0.60, 0, 0] }
  },

  // Standing Neutral T/A Rest:
  NEUTRAL: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0, 0] },
    spine: { rot: [0, 0, 0] },
    neck: { rot: [0, 0, 0] },
    head: { rot: [0, 0, 0] },
    leftShoulder: { rot: [0, 0, 0] },
    leftUpperArm: { rot: [0, 0, 0] },
    leftElbow: { rot: [0, 0, 0] },
    leftWrist: { rot: [0, 0, 0] },
    rightShoulder: { rot: [0, 0, 0] },
    rightUpperArm: { rot: [0, 0, 0] },
    rightElbow: { rot: [0, 0, 0] },
    rightWrist: { rot: [0, 0, 0] },
    leftThigh: { rot: [0, 0, 0] },
    leftKnee: { rot: [0, 0, 0] },
    leftFoot: { rot: [0, 0, 0] },
    rightThigh: { rot: [0, 0, 0] },
    rightKnee: { rot: [0, 0, 0] },
    rightFoot: { rot: [0, 0, 0] }
  }
};

/**
 * Creates authentic human materials palette.
 */
function createHumanBoxerMaterials(options = {}) {
  // Athlete skin tone: warm, natural athletic skin tone
  const skinToneHex = options.skinTone || 0xd89b7b;
  // Hair color: dirty blonde / light golden brown (Shane Fazen)
  const hairHex = options.hairColor || 0x725134;
  // Backwards cap color: light athletic heather grey / white
  const capHex = options.capColor || 0xe2e5ea;
  // Performance sparring shirt: athletic crisp white
  const shirtWhiteHex = options.shirtColor || 0xf5f7fb;
  // Shirt aerodynamic side panels: deep charcoal black
  const shirtPanelHex = options.shirtPanelColor || 0x181a1f;
  // Sparring shorts: athletic dark charcoal/black
  const shortsHex = options.shortsColor || 0x181a20;
  // Glove knuckle punch surface: crisp matte white
  const gloveWhiteHex = options.gloveWhite || 0xf2f4f8;
  // Glove inner palm & thumb: black competition leather
  const gloveBlackHex = options.gloveBlack || 0x17191d;
  // Glove & apparel brand accent stripe: fight red
  const accentRedHex = options.accentColor || 0xd81c30;
  // Athletic wrap tape: pure white
  const tapeHex = options.tapeColor || 0xf8fafd;

  const materials = {
    skin: new THREE.MeshStandardMaterial({
      color: skinToneHex,
      roughness: 0.55,
      metalness: 0.04,
      name: 'humanSkin'
    }),
    skinShadow: new THREE.MeshStandardMaterial({
      color: 0xbc7d5f,
      roughness: 0.58,
      metalness: 0.02,
      name: 'skinShadow'
    }),
    hair: new THREE.MeshStandardMaterial({
      color: hairHex,
      roughness: 0.85,
      metalness: 0.0,
      name: 'hair'
    }),
    eyebrows: new THREE.MeshStandardMaterial({
      color: 0x483220,
      roughness: 0.90,
      metalness: 0.0,
      name: 'eyebrows'
    }),
    eyeWhite: new THREE.MeshStandardMaterial({
      color: 0xf6f8fc,
      roughness: 0.20,
      metalness: 0.0,
      name: 'eyeWhite'
    }),
    eyeIris: new THREE.MeshStandardMaterial({
      color: 0x4b311e,
      roughness: 0.30,
      metalness: 0.1,
      name: 'eyeIris'
    }),
    eyePupil: new THREE.MeshBasicMaterial({
      color: 0x0a0a0c,
      name: 'eyePupil'
    }),
    lips: new THREE.MeshStandardMaterial({
      color: 0xb87368,
      roughness: 0.58,
      metalness: 0.02,
      name: 'lips'
    }),
    capFabric: new THREE.MeshStandardMaterial({
      color: capHex,
      roughness: 0.78,
      metalness: 0.02,
      name: 'capFabric'
    }),
    capBrim: new THREE.MeshStandardMaterial({
      color: 0xcfd3da,
      roughness: 0.75,
      metalness: 0.02,
      name: 'capBrim'
    }),
    capAccents: new THREE.MeshStandardMaterial({
      color: 0x242730,
      roughness: 0.60,
      metalness: 0.2,
      name: 'capAccents'
    }),
    shirtWhite: new THREE.MeshStandardMaterial({
      color: shirtWhiteHex,
      roughness: 0.68,
      metalness: 0.02,
      name: 'shirtWhite'
    }),
    shirtPanels: new THREE.MeshStandardMaterial({
      color: shirtPanelHex,
      roughness: 0.56,
      metalness: 0.05,
      name: 'shirtPanels'
    }),
    shirtTrim: new THREE.MeshStandardMaterial({
      color: 0x15171b,
      roughness: 0.60,
      metalness: 0.05,
      name: 'shirtTrim'
    }),
    brandRed: new THREE.MeshStandardMaterial({
      color: accentRedHex,
      roughness: 0.40,
      metalness: 0.15,
      name: 'brandRed'
    }),
    shortsMain: new THREE.MeshStandardMaterial({
      color: shortsHex,
      roughness: 0.75,
      metalness: 0.04,
      name: 'shortsMain'
    }),
    shortsWaistband: new THREE.MeshStandardMaterial({
      color: 0x22252d,
      roughness: 0.70,
      metalness: 0.06,
      name: 'shortsWaistband'
    }),
    shortsDrawstring: new THREE.MeshStandardMaterial({
      color: 0xeff1f5,
      roughness: 0.85,
      metalness: 0.0,
      name: 'shortsDrawstring'
    }),
    shortsStripe: new THREE.MeshStandardMaterial({
      color: 0xe8ebf0,
      roughness: 0.65,
      metalness: 0.02,
      name: 'shortsStripe'
    }),
    gloveWhite: new THREE.MeshStandardMaterial({
      color: gloveWhiteHex,
      roughness: 0.35,
      metalness: 0.08,
      name: 'gloveWhite'
    }),
    gloveBlack: new THREE.MeshStandardMaterial({
      color: gloveBlackHex,
      roughness: 0.44,
      metalness: 0.12,
      name: 'gloveBlack'
    }),
    gloveRed: new THREE.MeshStandardMaterial({
      color: accentRedHex,
      roughness: 0.38,
      metalness: 0.12,
      name: 'gloveRed'
    }),
    tapeWrap: new THREE.MeshStandardMaterial({
      color: tapeHex,
      roughness: 0.86,
      metalness: 0.02,
      name: 'tapeWrap'
    }),
    socks: new THREE.MeshStandardMaterial({
      color: 0xf2f4f8,
      roughness: 0.88,
      metalness: 0.0,
      name: 'socks'
    }),
    boxingBoots: new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.62,
      metalness: 0.08,
      name: 'boxingBoots'
    }),
    bootSole: new THREE.MeshStandardMaterial({
      color: 0x282a32,
      roughness: 0.90,
      metalness: 0.05,
      name: 'bootSole'
    })
  };

  return materials;
}

// Geometry helper utilities
function createBoxMesh(w, h, d, mat, castShadow = true) {
  const geom = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function createCylinderMesh(rt, rb, h, seg, mat, castShadow = true) {
  const geom = new THREE.CylinderGeometry(rt, rb, h, seg);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function createCapsuleMesh(r, len, capSub, radSeg, mat, castShadow = true) {
  const geom = new THREE.CapsuleGeometry(r, len, capSub, radSeg);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function createSphereMesh(r, wSeg, hSeg, mat, castShadow = true) {
  const geom = new THREE.SphereGeometry(r, wSeg, hSeg);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds the Pelvis / Hips & Dark Charcoal Sparring Shorts Assembly
 */
function buildPelvisMesh(mat) {
  const group = new THREE.Group();
  group.name = 'pelvis_visuals';

  // Main pelvic athletic girdle core
  const pelvisCore = createBoxMesh(0.30, 0.14, 0.19, mat.shortsMain);
  pelvisCore.position.set(0, -0.02, 0);
  group.add(pelvisCore);

  // Elastic Waistband of Sparring Shorts
  const waistband = createCylinderMesh(0.18, 0.176, 0.085, 24, mat.shortsWaistband);
  waistband.position.set(0, 0.035, 0);
  group.add(waistband);

  // Waistband drawstrings detail (Athletic cord hanging in front)
  const drawKnot = createSphereMesh(0.014, 10, 8, mat.shortsDrawstring);
  drawKnot.position.set(0, 0.035, 0.179);
  group.add(drawKnot);

  // Left cord aglet
  const leftCord = createCylinderMesh(0.0035, 0.0035, 0.065, 8, mat.shortsDrawstring);
  leftCord.position.set(0.012, 0.0, 0.183);
  leftCord.rotation.z = -0.15;
  group.add(leftCord);

  // Right cord aglet
  const rightCord = createCylinderMesh(0.0035, 0.0035, 0.065, 8, mat.shortsDrawstring);
  rightCord.position.set(-0.012, 0.0, 0.183);
  rightCord.rotation.z = 0.15;
  group.add(rightCord);

  // Boxing shorts leg trunks (Loose athletic fit down to upper thighs)
  const leftTrunk = createCylinderMesh(0.125, 0.135, 0.20, 18, mat.shortsMain);
  leftTrunk.position.set(0.115, -0.11, 0);
  group.add(leftTrunk);

  const rightTrunk = createCylinderMesh(0.125, 0.135, 0.20, 18, mat.shortsMain);
  rightTrunk.position.set(-0.115, -0.11, 0);
  group.add(rightTrunk);

  // Athletic contrast white racing stripes along the lateral flank of the shorts
  const leftStripe = createBoxMesh(0.012, 0.19, 0.035, mat.shortsStripe);
  leftStripe.position.set(0.195, -0.09, 0);
  group.add(leftStripe);

  const rightStripe = createBoxMesh(0.012, 0.19, 0.035, mat.shortsStripe);
  rightStripe.position.set(-0.195, -0.09, 0);
  group.add(rightStripe);

  // Red fightTIPS / SHADOW sparring brand patch on left shorts hem
  const brandPatch = createBoxMesh(0.035, 0.024, 0.008, mat.brandRed);
  brandPatch.position.set(0.145, -0.15, 0.125);
  brandPatch.rotation.y = 0.45;
  group.add(brandPatch);

  return group;
}

/**
 * Builds the Torso:
 * Fitted athletic performance white sparring t-shirt with black aerodynamic side panels,
 * muscular chest contours, and black crew-neck collar trim.
 */
function buildTorsoMesh(mat) {
  const group = new THREE.Group();
  group.name = 'torso_visuals';

  // Lumbar torso core (compression t-shirt midsection)
  const lumbarCore = createCylinderMesh(0.142, 0.152, 0.22, 20, mat.shirtWhite);
  lumbarCore.position.set(0, 0.11, 0);
  group.add(lumbarCore);

  // Athletic rectus abdominis muscle contours under fitted compression shirt
  const abYPositions = [0.05, 0.125, 0.20];
  for (let row = 0; row < 3; row++) {
    const yPos = abYPositions[row];
    const width = 0.068 + row * 0.004;
    const height = 0.058;
    const depth = 0.032;

    const leftAb = createBoxMesh(width, height, depth, mat.shirtWhite);
    leftAb.position.set(0.046, yPos, 0.118 + row * 0.008);
    leftAb.rotation.y = 0.06;
    group.add(leftAb);

    const rightAb = createBoxMesh(width, height, depth, mat.shirtWhite);
    rightAb.position.set(-0.046, yPos, 0.118 + row * 0.008);
    rightAb.rotation.y = -0.06;
    group.add(rightAb);
  }

  // Aerodynamic Black Performance Side Panels (matching the reference video)
  const leftSidePanel = createBoxMesh(0.045, 0.22, 0.145, mat.shirtPanels);
  leftSidePanel.position.set(0.155, 0.12, 0.015);
  leftSidePanel.rotation.z = -0.12;
  group.add(leftSidePanel);

  const rightSidePanel = createBoxMesh(0.045, 0.22, 0.145, mat.shirtPanels);
  rightSidePanel.position.set(-0.155, 0.12, 0.015);
  rightSidePanel.rotation.z = 0.12;
  group.add(rightSidePanel);

  // Upper Chest / Muscular Ribcage Barrel
  const chestCore = createCylinderMesh(0.24, 0.185, 0.22, 22, mat.shirtWhite);
  chestCore.position.set(0, 0.31, 0.0);
  chestCore.scale.set(1.16, 1.0, 0.88);
  group.add(chestCore);

  // Broad Athletic Pectoral Muscle Contours (Fitted white sparring t-shirt)
  const leftPec = createBoxMesh(0.145, 0.13, 0.065, mat.shirtWhite);
  leftPec.position.set(0.090, 0.32, 0.10);
  leftPec.rotation.set(-0.05, 0.10, -0.04);
  group.add(leftPec);

  const rightPec = createBoxMesh(0.145, 0.13, 0.065, mat.shirtWhite);
  rightPec.position.set(-0.090, 0.32, 0.10);
  rightPec.rotation.set(-0.05, -0.10, 0.04);
  group.add(rightPec);

  // Upper aerodynamic black panels extending up along the lats into the armpits
  const leftUpperPanel = createBoxMesh(0.055, 0.19, 0.13, mat.shirtPanels);
  leftUpperPanel.position.set(0.205, 0.29, -0.02);
  leftUpperPanel.rotation.set(0, 0, -0.22);
  group.add(leftUpperPanel);

  const rightUpperPanel = createBoxMesh(0.055, 0.19, 0.13, mat.shirtPanels);
  rightUpperPanel.position.set(-0.205, 0.29, -0.02);
  rightUpperPanel.rotation.set(0, 0, 0.22);
  group.add(rightUpperPanel);

  // Upper back scapular musculature under shirt
  const leftScapula = createBoxMesh(0.13, 0.16, 0.04, mat.shirtWhite);
  leftScapula.position.set(0.095, 0.32, -0.09);
  leftScapula.rotation.set(0.07, 0.09, -0.05);
  group.add(leftScapula);

  const rightScapula = createBoxMesh(0.13, 0.16, 0.04, mat.shirtWhite);
  rightScapula.position.set(-0.095, 0.32, -0.09);
  rightScapula.rotation.set(0.07, -0.09, 0.05);
  group.add(rightScapula);

  // Black Crew-Neck Collar Ring framing the neck
  const collarRing = createCylinderMesh(0.080, 0.082, 0.024, 20, mat.shirtTrim);
  collarRing.position.set(0, 0.435, 0.015);
  collarRing.rotation.x = -0.12;
  group.add(collarRing);

  // Red Fight Brand Graphic Badge on left pectoral
  const chestBadge = createBoxMesh(0.038, 0.022, 0.008, mat.brandRed);
  chestBadge.position.set(0.085, 0.33, 0.136);
  chestBadge.rotation.set(-0.05, 0.10, -0.04);
  group.add(chestBadge);

  return group;
}

/**
 * Builds the Neck Assembly:
 * Muscular, toned human neck with sternocleidomastoid bands and natural athlete skin tone.
 */
function buildNeckMesh(mat) {
  const group = new THREE.Group();
  group.name = 'neck_visuals';

  // Central muscular neck column in warm athlete skin tone
  const neckCol = createCylinderMesh(0.064, 0.075, 0.105, 18, mat.skin);
  neckCol.position.set(0, 0.05, 0);
  group.add(neckCol);

  // Left Sternocleidomastoid muscle band (runs from behind left ear down to clavicle)
  const leftSCM = createCapsuleMesh(0.013, 0.08, 4, 10, mat.skin);
  leftSCM.position.set(0.044, 0.05, 0.024);
  leftSCM.rotation.set(0.14, 0, -0.17);
  group.add(leftSCM);

  // Right Sternocleidomastoid muscle band
  const rightSCM = createCapsuleMesh(0.013, 0.08, 4, 10, mat.skin);
  rightSCM.position.set(-0.044, 0.05, 0.024);
  rightSCM.rotation.set(0.14, 0, 0.17);
  group.add(rightSCM);

  // Subtle Adam's Apple / laryngeal prominence
  const adamsApple = createSphereMesh(0.011, 8, 8, mat.skin);
  adamsApple.position.set(0, 0.055, 0.065);
  group.add(adamsApple);

  // Upper trapezius slope connecting neck into shoulders
  const traps = createBoxMesh(0.13, 0.07, 0.05, mat.skin);
  traps.position.set(0, 0.03, -0.045);
  traps.rotation.x = 0.15;
  group.add(traps);

  return group;
}

/**
 * Builds the Human Head, Sculpted Face, and Backwards Athletic Baseball Cap
 * Inspired by Shane Fazen (fightTIPS):
 * - Chin tucked forward in authentic boxing posture
 * - Athletic brow ridge, focused eyes looking right into camera, nose, ears, jawline
 * - Blonde/brown hair fringe peeking out underneath backwards cap
 * - Stylish backwards athletic baseball cap (light grey/white with brim pointing backwards)
 */
function buildHeadMesh(mat) {
  const group = new THREE.Group();
  group.name = 'head_visuals';

  // 1. Cranium Base / Skull in warm athlete skin tone
  const cranium = createSphereMesh(0.104, 20, 16, mat.skin);
  cranium.position.set(0, 0.05, 0);
  cranium.scale.set(0.95, 1.12, 1.04);
  group.add(cranium);

  // 2. Sculpted Athletic Jaw & Tucked Chin
  const jaw = createBoxMesh(0.088, 0.068, 0.082, mat.skin);
  jaw.position.set(0, -0.045, 0.065);
  jaw.rotation.x = -0.14;
  group.add(jaw);

  // Tapered chin point
  const chin = createSphereMesh(0.024, 10, 8, mat.skin);
  chin.position.set(0, -0.065, 0.088);
  chin.scale.set(1.1, 0.8, 1.0);
  group.add(chin);

  // Athletic cheekbones (zygomatic arches)
  const leftCheek = createBoxMesh(0.034, 0.055, 0.055, mat.skin);
  leftCheek.position.set(0.075, 0.015, 0.058);
  leftCheek.rotation.set(0, -0.22, -0.05);
  group.add(leftCheek);

  const rightCheek = createBoxMesh(0.034, 0.055, 0.055, mat.skin);
  rightCheek.position.set(-0.075, 0.015, 0.058);
  rightCheek.rotation.set(0, 0.22, 0.05);
  group.add(rightCheek);

  // 3. Nose (Bridge, tip, and nostrils)
  const noseBridge = createBoxMesh(0.017, 0.042, 0.026, mat.skin);
  noseBridge.position.set(0, 0.022, 0.098);
  noseBridge.rotation.x = 0.12;
  group.add(noseBridge);

  const noseTip = createSphereMesh(0.013, 10, 8, mat.skin);
  noseTip.position.set(0, 0.005, 0.108);
  group.add(noseTip);

  // Nostril flares
  const leftNostril = createSphereMesh(0.007, 6, 6, mat.skinShadow);
  leftNostril.position.set(0.012, 0.002, 0.102);
  group.add(leftNostril);

  const rightNostril = createSphereMesh(0.007, 6, 6, mat.skinShadow);
  rightNostril.position.set(-0.012, 0.002, 0.102);
  group.add(rightNostril);

  // 4. Mouth & Fighter Lips
  const upperLip = createBoxMesh(0.040, 0.010, 0.014, mat.lips);
  upperLip.position.set(0, -0.022, 0.093);
  group.add(upperLip);

  const lowerLip = createBoxMesh(0.036, 0.012, 0.015, mat.lips);
  lowerLip.position.set(0, -0.034, 0.091);
  group.add(lowerLip);

  // 5. Athletic Brow Ridge (Determined fight grimace)
  const browRidge = createBoxMesh(0.138, 0.024, 0.042, mat.skin);
  browRidge.position.set(0, 0.058, 0.082);
  browRidge.rotation.x = 0.12;
  group.add(browRidge);

  // Left & Right Athletic Eyebrows
  const leftBrow = createBoxMesh(0.045, 0.009, 0.012, mat.eyebrows);
  leftBrow.position.set(0.042, 0.062, 0.092);
  leftBrow.rotation.set(0.12, 0, -0.10);
  group.add(leftBrow);

  const rightBrow = createBoxMesh(0.045, 0.009, 0.012, mat.eyebrows);
  rightBrow.position.set(-0.042, 0.062, 0.092);
  rightBrow.rotation.set(0.12, 0, 0.10);
  group.add(rightBrow);

  // 6. Focused Sparring Eyes (Gazing straight down the pipe into camera)
  // Left Eye
  const leftEyeWhite = createSphereMesh(0.014, 10, 8, mat.eyeWhite);
  leftEyeWhite.position.set(0.040, 0.038, 0.078);
  group.add(leftEyeWhite);

  const leftIris = createSphereMesh(0.008, 8, 8, mat.eyeIris);
  leftIris.position.set(0.040, 0.038, 0.088);
  group.add(leftIris);

  const leftPupil = createSphereMesh(0.004, 6, 6, mat.eyePupil);
  leftPupil.position.set(0.040, 0.038, 0.094);
  group.add(leftPupil);

  // Right Eye
  const rightEyeWhite = createSphereMesh(0.014, 10, 8, mat.eyeWhite);
  rightEyeWhite.position.set(-0.040, 0.038, 0.078);
  group.add(rightEyeWhite);

  const rightIris = createSphereMesh(0.008, 8, 8, mat.eyeIris);
  rightIris.position.set(-0.040, 0.038, 0.088);
  group.add(rightIris);

  const rightPupil = createSphereMesh(0.004, 6, 6, mat.eyePupil);
  rightPupil.position.set(-0.040, 0.038, 0.094);
  group.add(rightPupil);

  // 7. Sculpted Human Ears
  // Left Ear
  const leftEar = createBoxMesh(0.016, 0.048, 0.028, mat.skin);
  leftEar.position.set(0.098, 0.015, -0.012);
  leftEar.rotation.set(0.10, 0.22, -0.15);
  group.add(leftEar);

  const leftEarHole = createSphereMesh(0.007, 6, 6, mat.skinShadow);
  leftEarHole.position.set(0.100, 0.015, -0.010);
  group.add(leftEarHole);

  // Right Ear
  const rightEar = createBoxMesh(0.016, 0.048, 0.028, mat.skin);
  rightEar.position.set(-0.098, 0.015, -0.012);
  rightEar.rotation.set(0.10, -0.22, 0.15);
  group.add(rightEar);

  const rightEarHole = createSphereMesh(0.007, 6, 6, mat.skinShadow);
  rightEarHole.position.set(-0.100, 0.015, -0.010);
  group.add(rightEarHole);

  // 8. Blonde / Light Brown Hair Fringe (Shane Fazen signature style)
  // Hair fringe strands emerging underneath the backwards baseball cap across the forehead
  const hairLockCenter = createBoxMesh(0.038, 0.022, 0.012, mat.hair);
  hairLockCenter.position.set(0.010, 0.052, 0.089);
  hairLockCenter.rotation.set(0.15, 0, -0.18);
  group.add(hairLockCenter);

  const hairLockLeft = createBoxMesh(0.034, 0.025, 0.012, mat.hair);
  hairLockLeft.position.set(0.048, 0.048, 0.082);
  hairLockLeft.rotation.set(0.15, 0.18, -0.25);
  group.add(hairLockLeft);

  const hairLockRight = createBoxMesh(0.034, 0.025, 0.012, mat.hair);
  hairLockRight.position.set(-0.042, 0.050, 0.084);
  hairLockRight.rotation.set(0.15, -0.15, 0.20);
  group.add(hairLockRight);

  // Sideburns descending past the temples in front of ears
  const leftSideburn = createBoxMesh(0.014, 0.038, 0.018, mat.hair);
  leftSideburn.position.set(0.093, 0.022, 0.015);
  group.add(leftSideburn);

  const rightSideburn = createBoxMesh(0.014, 0.038, 0.018, mat.hair);
  rightSideburn.position.set(-0.093, 0.022, 0.015);
  group.add(rightSideburn);

  // Back hair tuft visible below cap arch opening
  const backHair = createBoxMesh(0.085, 0.032, 0.024, mat.hair);
  backHair.position.set(0, -0.015, -0.082);
  backHair.rotation.x = -0.10;
  group.add(backHair);

  // 9. Backwards Athletic Baseball Cap (Light Grey / Heather White)
  // Dome Crown fitted snugly over head
  const capCrown = createSphereMesh(0.108, 20, 16, mat.capFabric);
  capCrown.position.set(0, 0.065, 0.005);
  capCrown.scale.set(0.98, 1.02, 1.06);
  group.add(capCrown);

  // Cap Sweatband Rim encircling the forehead and temples
  const capBand = createCylinderMesh(0.108, 0.108, 0.028, 24, mat.capFabric);
  capBand.position.set(0, 0.058, 0.005);
  capBand.scale.set(0.97, 1.0, 1.05);
  group.add(capBand);

  // Top center button of cap (squatchee)
  const capButton = createCylinderMesh(0.010, 0.010, 0.008, 12, mat.capAccents);
  capButton.position.set(0, 0.170, 0.005);
  group.add(capButton);

  // Authentic Backwards Visor / Brim:
  // Projects backward behind the head over the nape of the neck with authentic curved arc!
  const capBrim = createBoxMesh(0.138, 0.012, 0.095, mat.capBrim);
  capBrim.position.set(0, 0.040, -0.138);
  capBrim.rotation.x = -0.22;
  group.add(capBrim);

  // Curved lateral wings of backwards brim
  const leftBrimWing = createBoxMesh(0.035, 0.010, 0.085, mat.capBrim);
  leftBrimWing.position.set(0.065, 0.044, -0.136);
  leftBrimWing.rotation.set(-0.22, 0, 0.22);
  group.add(leftBrimWing);

  const rightBrimWing = createBoxMesh(0.035, 0.010, 0.085, mat.capBrim);
  rightBrimWing.position.set(-0.065, 0.044, -0.136);
  rightBrimWing.rotation.set(-0.22, 0, -0.22);
  group.add(rightBrimWing);

  // Back opening arch strap & snapback buckle (visible just above backwards brim)
  const capStrap = createBoxMesh(0.065, 0.012, 0.015, mat.capAccents);
  capStrap.position.set(0, 0.052, -0.095);
  group.add(capStrap);

  return group;
}

/**
 * Builds Pro Sparring Boxing Gloves Matching the Shane Fazen fightTIPS Video:
 * - Crisp matte white knuckle/back-of-hand casing facing the opponent
 * - Black leather inner palm & thumb with palm grip bar
 * - Red athletic logo stripe / badge on the wrist
 * - Pure white athletic wrist cuff wrap tape
 */
function buildProSparringGloveMesh(isLeft, mat) {
  const group = new THREE.Group();
  group.name = isLeft ? 'leftGlove_visuals' : 'rightGlove_visuals';

  // 1. Glove Wrist Cuff with athletic white wrap
  const cuff = createCylinderMesh(0.054, 0.049, 0.068, 18, mat.tapeWrap);
  cuff.position.set(0, -0.03, 0);
  group.add(cuff);

  // Red Accent Logo Stripe / Badge wrapping the wrist cuff
  const cuffRedStripe = createCylinderMesh(0.055, 0.050, 0.024, 18, mat.gloveRed);
  cuffRedStripe.position.set(0, -0.03, 0);
  group.add(cuffRedStripe);

  // 2. Main Knuckle Punching Casing (Crisp matte white 16oz sparring dome)
  // Scaled capsule to emulate authentic competition glove padding
  const knucklePad = createCapsuleMesh(0.060, 0.055, 4, 18, mat.gloveWhite);
  knucklePad.position.set(0, -0.095, 0.015);
  knucklePad.scale.set(1.15, 1.25, 0.95);
  group.add(knucklePad);

  // Front striking apex dome facing forward into camera
  const strikingApex = createSphereMesh(0.056, 16, 12, mat.gloveWhite);
  strikingApex.position.set(0, -0.115, 0.022);
  strikingApex.scale.set(1.05, 0.90, 0.85);
  group.add(strikingApex);

  // 3. Inner Palm (Black leather with ventilation and grip bar)
  const palm = createBoxMesh(0.076, 0.076, 0.025, mat.gloveBlack);
  palm.position.set(0, -0.09, -0.032);
  group.add(palm);

  // Inner Leather Grip Bar sewn across the palm inside curled fingers
  const gripBar = createCylinderMesh(0.013, 0.013, 0.066, 12, mat.gloveBlack);
  gripBar.position.set(0, -0.09, -0.036);
  gripBar.rotation.z = Math.PI / 2;
  group.add(gripBar);

  // 4. Anatomical Thumb (Curled inward parallel to index finger, black inner / white outer)
  const thumbX = isLeft ? -0.048 : 0.048;
  const thumbRotZ = isLeft ? -0.35 : 0.35;
  const thumbRotY = isLeft ? 0.30 : -0.30;

  const thumb = createCapsuleMesh(0.024, 0.046, 4, 12, mat.gloveBlack);
  thumb.position.set(thumbX, -0.082, 0.012);
  thumb.rotation.set(0.15, thumbRotY, thumbRotZ);
  group.add(thumb);

  // White outer shell backing on thumb
  const thumbBacking = createSphereMesh(0.022, 10, 8, mat.gloveWhite);
  thumbBacking.position.set(thumbX * 1.08, -0.082, 0.024);
  thumbBacking.scale.set(0.85, 1.1, 0.85);
  group.add(thumbBacking);

  // Red accent brand welt on back of hand
  const emblem = createBoxMesh(0.042, 0.018, 0.008, mat.gloveRed);
  emblem.position.set(0, -0.085, 0.058);
  group.add(emblem);

  return group;
}

/**
 * Builds the complete Arm Kinematics Chain:
 * Shoulder (white sleeve with black trim) -> Upper Arm (bicep/tricep) -> Elbow -> Forearm -> Wrist -> Pro Glove -> HitPoint
 */
function buildArmChain(isLeft, mat) {
  const sideSign = isLeft ? 1 : -1;

  // 1. Shoulder Joint (Clavicle / Deltoid pivot)
  const shoulder = new THREE.Group();
  shoulder.name = isLeft ? 'leftShoulder' : 'rightShoulder';
  shoulder.position.set(sideSign * 0.24, 0.38, 0.0);

  // Deltoid Shoulder Pauldron covered by white athletic short sleeve
  const sleeveCap = createSphereMesh(0.084, 16, 12, mat.shirtWhite);
  sleeveCap.position.set(sideSign * 0.04, 0, 0);
  sleeveCap.scale.set(1.12, 0.95, 1.0);
  shoulder.add(sleeveCap);

  // Black aerodynamic raglan accent stripe on shoulder
  const sleeveStripe = createCylinderMesh(0.076, 0.076, 0.014, 16, mat.shirtPanels);
  sleeveStripe.position.set(sideSign * 0.04, 0, 0);
  sleeveStripe.rotation.z = Math.PI / 2;
  shoulder.add(sleeveStripe);

  // Shoulder glenohumeral joint in skin tone
  const shoulderJoint = createSphereMesh(0.050, 12, 12, mat.skin);
  shoulderJoint.position.set(0, 0, 0);
  shoulder.add(shoulderJoint);

  // 2. Upper Arm (Bicep / Tricep)
  const upperArm = new THREE.Group();
  upperArm.name = isLeft ? 'leftUpperArm' : 'rightUpperArm';
  upperArm.position.set(sideSign * 0.08, -0.04, 0.0);
  shoulder.add(upperArm);

  // White athletic sleeve cuff (ending mid-bicep)
  const sleeveCuff = createCylinderMesh(0.063, 0.063, 0.055, 16, mat.shirtWhite);
  sleeveCuff.position.set(0, -0.03, 0);
  upperArm.add(sleeveCuff);

  const sleeveCuffTrim = createCylinderMesh(0.064, 0.064, 0.012, 16, mat.shirtTrim);
  sleeveCuffTrim.position.set(0, -0.052, 0);
  upperArm.add(sleeveCuffTrim);

  // Muscular bicep & tricep in warm athlete skin tone
  const bicepMesh = createCapsuleMesh(0.058, 0.15, 4, 16, mat.skin);
  bicepMesh.position.set(0, -0.12, 0);
  upperArm.add(bicepMesh);

  // Bicep peak muscle volume
  const bicepPeak = createSphereMesh(0.048, 12, 10, mat.skin);
  bicepPeak.position.set(sideSign * -0.015, -0.11, 0.024);
  bicepPeak.scale.set(0.9, 1.2, 0.9);
  upperArm.add(bicepPeak);

  // 3. Elbow Joint
  const elbow = new THREE.Group();
  elbow.name = isLeft ? 'leftElbow' : 'rightElbow';
  elbow.position.set(0.0, -0.26, 0.0);
  upperArm.add(elbow);

  // Olecranon elbow point in skin tone
  const elbowJoint = createSphereMesh(0.042, 12, 10, mat.skin);
  elbowJoint.position.set(0, 0, -0.015);
  elbow.add(elbowJoint);

  // 4. Forearm
  const forearm = new THREE.Group();
  forearm.name = isLeft ? 'leftForearm' : 'rightForearm';
  forearm.position.set(0.0, 0.0, 0.0);
  elbow.add(forearm);

  // Muscular athletic human forearm tapering to wrist in skin tone
  const forearmMesh = createCylinderMesh(0.054, 0.042, 0.22, 16, mat.skin);
  forearmMesh.position.set(0, -0.11, 0);
  forearm.add(forearmMesh);

  // Brachioradialis muscle definition along lateral forearm
  const forearmMuscle = createCapsuleMesh(0.032, 0.12, 4, 12, mat.skin);
  forearmMuscle.position.set(sideSign * 0.025, -0.08, 0.012);
  forearm.add(forearmMuscle);

  // 5. Wrist Joint with Athletic Tape Wrap
  const wrist = new THREE.Group();
  wrist.name = isLeft ? 'leftWrist' : 'rightWrist';
  wrist.position.set(0.0, -0.23, 0.0);
  forearm.add(wrist);

  const tapeWrapMesh = createCylinderMesh(0.048, 0.048, 0.065, 16, mat.tapeWrap);
  tapeWrapMesh.position.set(0, -0.03, 0);
  wrist.add(tapeWrapMesh);

  // 6. Pro Sparring Glove
  const glove = new THREE.Group();
  glove.name = isLeft ? 'leftGlove' : 'rightGlove';
  glove.position.set(0.0, -0.05, 0.0);
  wrist.add(glove);

  const gloveVisuals = buildProSparringGloveMesh(isLeft, mat);
  glove.add(gloveVisuals);

  // 7. Hit-Tracking Dummy Object
  // Positioned exactly at the knuckle striking apex
  const hitPoint = new THREE.Object3D();
  hitPoint.name = isLeft ? 'leftHitPoint' : 'rightHitPoint';
  hitPoint.position.set(0.0, -0.155, 0.022);
  glove.add(hitPoint);

  return {
    shoulder,
    upperArm,
    elbow,
    forearm,
    wrist,
    glove,
    hitPoint
  };
}

/**
 * Builds the Leg Kinematics Chain:
 * Thigh -> Knee -> Calf (with high athletic crew socks) -> Foot (boxing boots)
 */
function buildLegChain(isLeft, mat) {
  const sideSign = isLeft ? 1 : -1;

  // 1. Thigh (Hip joint pivot)
  const thigh = new THREE.Group();
  thigh.name = isLeft ? 'leftThigh' : 'rightThigh';
  thigh.position.set(sideSign * 0.14, -0.08, 0.0);

  // Muscular athletic quadriceps in warm athlete skin tone
  const quadMesh = createCapsuleMesh(0.066, 0.23, 4, 16, mat.skin);
  quadMesh.position.set(0, -0.18, 0);
  thigh.add(quadMesh);

  // 2. Knee Joint
  const knee = new THREE.Group();
  knee.name = isLeft ? 'leftKnee' : 'rightKnee';
  knee.position.set(0.0, -0.38, 0.0);
  thigh.add(knee);

  // Anatomical patella / kneecap in skin tone
  const kneeCap = createSphereMesh(0.042, 12, 10, mat.skin);
  kneeCap.position.set(0, 0, 0.028);
  knee.add(kneeCap);

  // 3. Calf
  const calf = new THREE.Group();
  calf.name = isLeft ? 'leftCalf' : 'rightCalf';
  calf.position.set(0.0, 0.0, 0.0);
  knee.add(calf);

  // Upper calf musculature (gastrocnemius) in warm skin tone
  const calfMesh = createCylinderMesh(0.056, 0.042, 0.16, 16, mat.skin);
  calfMesh.position.set(0, -0.09, 0);
  calf.add(calfMesh);

  // High Athletic Crew Socks (White with double red/black ring stripes)
  const sockMesh = createCylinderMesh(0.046, 0.044, 0.17, 16, mat.socks);
  sockMesh.position.set(0, -0.24, 0);
  calf.add(sockMesh);

  // Sock double athletic stripes around the upper cuff
  const sockStripe1 = createCylinderMesh(0.047, 0.047, 0.012, 16, mat.brandRed);
  sockStripe1.position.set(0, -0.175, 0);
  calf.add(sockStripe1);

  const sockStripe2 = createCylinderMesh(0.047, 0.047, 0.012, 16, mat.shirtPanels);
  sockStripe2.position.set(0, -0.195, 0);
  calf.add(sockStripe2);

  // 4. Foot & Pro Boxing Boots
  const foot = new THREE.Group();
  foot.name = isLeft ? 'leftFoot' : 'rightFoot';
  foot.position.set(0.0, -0.36, 0.03);
  calf.add(foot);

  // High-top padded ankle boot collar
  const bootCollar = createCylinderMesh(0.047, 0.047, 0.065, 16, mat.boxingBoots);
  bootCollar.position.set(0, 0.02, 0);
  foot.add(bootCollar);

  // Boot main chassis
  const bootBody = createBoxMesh(0.086, 0.075, 0.20, mat.boxingBoots);
  bootBody.position.set(0, -0.04, 0.045);
  foot.add(bootBody);

  // Rounded athletic toe box
  const toeCap = createSphereMesh(0.044, 12, 10, mat.boxingBoots);
  toeCap.position.set(0, -0.04, 0.142);
  toeCap.scale.set(0.95, 0.80, 0.90);
  foot.add(toeCap);

  // White athletic lace stripes across boot tongue
  for (let i = 0; i < 3; i++) {
    const lace = createBoxMesh(0.048, 0.008, 0.018, mat.tapeWrap);
    lace.position.set(0, -0.015, 0.04 + i * 0.035);
    foot.add(lace);
  }

  // Non-marking rubber ring sole
  const sole = createBoxMesh(0.092, 0.020, 0.22, mat.bootSole);
  sole.position.set(0, -0.08, 0.045);
  foot.add(sole);

  return {
    thigh,
    knee,
    calf,
    foot
  };
}

/**
 * Creates the complete Human Sparring Boxer 3D Character Model with Kinematic Rigging.
 * 
 * @param {Object} options Configuration parameters:
 *  - scale: uniform scaling factor (default 1.0)
 *  - initialPose: starting pose key (default 'GUARD')
 *  - skinTone: hex color for skin
 *  - hairColor: hex color for hair fringe
 *  - capColor: hex color for backwards baseball cap
 *  - shirtColor: hex color for sparring t-shirt
 *  - shirtPanelColor: hex color for aerodynamic side panels
 *  - shortsColor: hex color for athletic sparring shorts
 *  - gloveWhite: hex color for glove knuckle casing
 *  - gloveBlack: hex color for glove palm/thumb
 *  - accentColor: hex color for fight brand accents
 * @returns {Object} Complete model interface compatible with boxer3DAnimator.js
 */
export function createHumanBoxer(options = {}) {
  const materials = createHumanBoxerMaterials(options);

  // Top-level container
  const rootGroup = new THREE.Group();
  rootGroup.name = 'humanBoxer_root';

  if (options.scale) {
    rootGroup.scale.setScalar(options.scale);
  }

  // --- KINEMATIC HIERARCHY ASSEMBLY ---
  // 1. Pelvis / Hips (y ≈ 0.95m above floor)
  const pelvis = new THREE.Group();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 0.95, 0);
  rootGroup.add(pelvis);

  const pelvisVisuals = buildPelvisMesh(materials);
  pelvis.add(pelvisVisuals);

  // 2. Spine / Torso (lumbar core pivot)
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.12, 0);
  pelvis.add(spine);

  const torsoVisuals = buildTorsoMesh(materials);
  spine.add(torsoVisuals);

  // 3. Neck (base of neck pivot)
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.45, 0);
  spine.add(neck);

  const neckVisuals = buildNeckMesh(materials);
  neck.add(neckVisuals);

  // 4. Head (base of skull / chin pivot)
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.10, 0);
  neck.add(head);

  const headVisuals = buildHeadMesh(materials);
  head.add(headVisuals);

  // 5. Left Arm Chain
  const leftArm = buildArmChain(true, materials);
  spine.add(leftArm.shoulder);

  // 6. Right Arm Chain
  const rightArm = buildArmChain(false, materials);
  spine.add(rightArm.shoulder);

  // 7. Left Leg Chain
  const leftLeg = buildLegChain(true, materials);
  pelvis.add(leftLeg.thigh);

  // 8. Right Leg Chain
  const rightLeg = buildLegChain(false, materials);
  pelvis.add(rightLeg.thigh);

  // Dictionary of all kinematic joints and hit points
  const joints = {
    rootGroup,
    pelvis,
    hips: pelvis,
    spine,
    torso: spine,
    neck,
    head,
    // Left Arm
    leftShoulder: leftArm.shoulder,
    leftUpperArm: leftArm.upperArm,
    leftElbow: leftArm.elbow,
    leftForearm: leftArm.forearm,
    leftWrist: leftArm.wrist,
    leftGlove: leftArm.glove,
    leftHitPoint: leftArm.hitPoint,
    // Right Arm
    rightShoulder: rightArm.shoulder,
    rightUpperArm: rightArm.upperArm,
    rightElbow: rightArm.elbow,
    rightForearm: rightArm.forearm,
    rightWrist: rightArm.wrist,
    rightGlove: rightArm.glove,
    rightHitPoint: rightArm.hitPoint,
    // Left Leg
    leftThigh: leftLeg.thigh,
    leftKnee: leftLeg.knee,
    leftCalf: leftLeg.calf,
    leftFoot: leftLeg.foot,
    // Right Leg
    rightThigh: rightLeg.thigh,
    rightKnee: rightLeg.knee,
    rightCalf: rightLeg.calf,
    rightFoot: rightLeg.foot
  };

  // --- KINEMATIC POSE HELPERS ---
  function applyPose(poseNameOrDict) {
    const pose = typeof poseNameOrDict === 'string'
      ? HUMAN_BOXER_POSES[poseNameOrDict]
      : poseNameOrDict;

    if (!pose) return;

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

  function resetPose() {
    applyPose('NEUTRAL');
  }

  // Apply default guard stance on creation
  const initialPose = options.initialPose || 'GUARD';
  if (initialPose && HUMAN_BOXER_POSES[initialPose]) {
    applyPose(initialPose);
  }

  // --- HIT-TRACKING WORLD POSITION HELPERS ---
  function getLeftFistWorldPos(targetVec = new THREE.Vector3()) {
    rootGroup.updateMatrixWorld(true);
    return joints.leftHitPoint.getWorldPosition(targetVec);
  }

  function getRightFistWorldPos(targetVec = new THREE.Vector3()) {
    rootGroup.updateMatrixWorld(true);
    return joints.rightHitPoint.getWorldPosition(targetVec);
  }

  // --- MATERIAL HURT / DAMAGE FLASH STATE ---
  let isHurtState = false;

  const baseSkinColor = materials.skin.color.clone();
  const baseSkinEmissive = materials.skin.emissive.clone();
  const baseSkinEmissiveIntensity = materials.skin.emissiveIntensity;

  function setMaterialHurtState(isHurt) {
    isHurtState = !!isHurt;

    if (isHurtState) {
      // Natural flushed combat impact tint
      materials.skin.color.setHex(0xe67c6c);
      materials.skin.emissive.setHex(0xaa2222);
      materials.skin.emissiveIntensity = 0.55;
    } else {
      // Restore pristine warm athletic skin tone
      materials.skin.color.copy(baseSkinColor);
      materials.skin.emissive.copy(baseSkinEmissive);
      materials.skin.emissiveIntensity = baseSkinEmissiveIntensity;
    }
  }

  // Safe compatibility helper for any visor color calls
  function setVisorColor(colorHex, intensity = 2.0) {
    if (materials.capAccents) {
      materials.capAccents.color.setHex(colorHex);
    }
  }

  // --- MEMORY DISPOSAL ---
  function dispose() {
    rootGroup.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });

    if (rootGroup.parent) {
      rootGroup.parent.remove(rootGroup);
    }
  }

  return {
    model: rootGroup,
    joints,
    getLeftFistWorldPos,
    getRightFistWorldPos,
    setMaterialHurtState,
    setVisorColor,
    applyPose,
    resetPose,
    dispose,
    materials
  };
}

// Aliases for seamless drop-in compatibility
export const BOXER_POSES = HUMAN_BOXER_POSES;
export const createBoxer3D = createHumanBoxer;

export default createHumanBoxer;
