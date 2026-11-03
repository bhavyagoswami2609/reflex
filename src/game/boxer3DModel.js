import * as THREE from 'three';

/**
 * Street Fighter / Cyberpunk 3D Boxer Character Model
 * 
 * Features:
 * - Hierarchical humanoid skeleton with realistic boxing pivot kinematics
 * - Athletic heavyweight silhouette with dark carbon/graphite armor & electric cyan/crimson neon
 * - Authentic competition boxing gloves (knuckle pill, thumb seam, white wrist tape wraps, red leather)
 * - Stylized cyber fighter head with glowing visor slit, armored chin guard, and cheek protectors
 * - Explicit tracker dummy objects (`leftHitPoint`, `rightHitPoint`) at glove striking points
 * - Kinematic helper methods (`getLeftFistWorldPos`, `getRightFistWorldPos`, `setMaterialHurtState`)
 */

// Preset Boxing Poses (Euler rotations in radians [x, y, z])
export const BOXER_POSES = {
  // Iconic Street Fighter ready stance (Orthodox guard)
  GUARD: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.15, 0] },
    spine: { rot: [-0.06, 0.08, -0.02] },
    neck: { rot: [-0.04, 0, 0] },
    head: { rot: [0.08, -0.22, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.45, 0.1, -0.1] },
    leftElbow: { rot: [-1.82, 0, 0] },
    leftWrist: { rot: [0.25, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-1.95, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.14, 0.12, 0] },
    leftKnee: { rot: [0.28, 0, 0] },
    leftFoot: { rot: [-0.14, 0, 0] },
    rightThigh: { rot: [0.18, 0.20, 0] },
    rightKnee: { rot: [0.32, 0, 0] },
    rightFoot: { rot: [-0.14, 0, 0] }
  },

  // Snappy Left Jab extension (snapping lead fist forward down the centerline)
  JAB: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, 0.15, 0] },
    spine: { rot: [-0.08, 0.12, 0] },
    neck: { rot: [0.02, 0, 0] },
    head: { rot: [0.05, -0.25, 0] },
    leftShoulder: { rot: [-0.15, -0.32, 0] },
    leftUpperArm: { rot: [-1.48, 0.05, 0] },
    leftElbow: { rot: [-0.05, 0, 0] },
    leftWrist: { rot: [0.05, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0.12, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.2, 0.1, 0] },
    leftKnee: { rot: [0.35, 0, 0] },
    leftFoot: { rot: [-0.15, 0, 0] },
    rightThigh: { rot: [0.22, 0.15, 0] },
    rightKnee: { rot: [0.38, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Devastating Rear Right Cross (power rotation through core and right fist extension)
  CROSS: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, -0.15, 0] },
    spine: { rot: [-0.08, -0.12, 0] },
    neck: { rot: [0.02, 0, 0] },
    head: { rot: [0.06, 0.25, 0] },
    leftShoulder: { rot: [-0.15, -0.1, -0.05] },
    leftUpperArm: { rot: [-0.42, 0.12, -0.1] },
    leftElbow: { rot: [-1.98, 0, 0] },
    leftWrist: { rot: [0.22, 0.1, 0] },
    rightShoulder: { rot: [-0.15, 0.32, 0] },
    rightUpperArm: { rot: [-1.48, -0.05, 0] },
    rightElbow: { rot: [-0.05, 0, 0] },
    rightWrist: { rot: [0.05, -0.1, 0] },
    leftThigh: { rot: [-0.1, 0.15, 0] },
    leftKnee: { rot: [0.25, 0, 0] },
    leftFoot: { rot: [-0.12, 0, 0] },
    rightThigh: { rot: [0.15, 0.25, 0] },
    rightKnee: { rot: [0.42, 0, 0] },
    rightFoot: { rot: [-0.16, 0, 0] }
  },

  // Sweeping Lead Hook (horizontal arm bend and torso rotation)
  HOOK: {
    pelvis: { pos: [0, 0.95, 0], rot: [0, -0.12, 0] },
    spine: { rot: [-0.06, -0.22, 0] },
    neck: { rot: [0.02, 0, 0] },
    head: { rot: [0.06, 0.28, 0] },
    leftShoulder: { rot: [-0.22, -0.1, -0.15] },
    leftUpperArm: { rot: [-1.35, 0.22, -0.65] },
    leftElbow: { rot: [-1.57, 0, 0] },
    leftWrist: { rot: [0.1, 0.2, 0] },
    rightShoulder: { rot: [-0.1, 0.1, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.15, 0.1] },
    rightElbow: { rot: [-2.0, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.15, 0.12, 0] },
    leftKnee: { rot: [0.28, 0, 0] },
    leftFoot: { rot: [-0.14, 0, 0] },
    rightThigh: { rot: [0.18, 0.20, 0] },
    rightKnee: { rot: [0.32, 0, 0] },
    rightFoot: { rot: [-0.14, 0, 0] }
  },

  // Slip Left defense
  SLIP_LEFT: {
    pelvis: { pos: [-0.08, 0.93, 0], rot: [0, 0.3, 0] },
    spine: { rot: [-0.08, 0.15, 0.22] },
    head: { rot: [0.12, -0.25, -0.15] },
    leftShoulder: { rot: [-0.15, 0, -0.1] },
    leftUpperArm: { rot: [-0.48, 0.15, -0.12] },
    leftElbow: { rot: [-1.88, 0, 0] },
    leftWrist: { rot: [0.2, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0, 0.05] },
    rightUpperArm: { rot: [-0.4, -0.2, 0.1] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.2, 0.15, 0] },
    leftKnee: { rot: [0.38, 0, 0] },
    leftFoot: { rot: [-0.18, 0, 0] },
    rightThigh: { rot: [0.15, 0.2, 0] },
    rightKnee: { rot: [0.28, 0, 0] },
    rightFoot: { rot: [-0.12, 0, 0] }
  },

  // Slip Right defense
  SLIP_RIGHT: {
    pelvis: { pos: [0.08, 0.93, 0], rot: [0, 0.15, 0] },
    spine: { rot: [-0.08, 0.08, -0.22] },
    head: { rot: [0.12, -0.38, 0.15] },
    leftShoulder: { rot: [-0.15, 0, -0.1] },
    leftUpperArm: { rot: [-0.42, 0.15, -0.15] },
    leftElbow: { rot: [-1.80, 0, 0] },
    leftWrist: { rot: [0.2, 0.1, 0] },
    rightShoulder: { rot: [-0.1, 0, 0.05] },
    rightUpperArm: { rot: [-0.45, -0.25, 0.15] },
    rightElbow: { rot: [-1.98, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.12, 0.1, 0] },
    leftKnee: { rot: [0.25, 0, 0] },
    leftFoot: { rot: [-0.12, 0, 0] },
    rightThigh: { rot: [0.22, 0.22, 0] },
    rightKnee: { rot: [0.42, 0, 0] },
    rightFoot: { rot: [-0.20, 0, 0] }
  },

  // Duck / Weave
  DUCK: {
    pelvis: { pos: [0, 0.76, 0.05], rot: [0, 0.2, 0] },
    spine: { rot: [-0.22, 0.1, 0] },
    neck: { rot: [0.1, 0, 0] },
    head: { rot: [0.18, -0.28, 0] },
    leftShoulder: { rot: [-0.1, 0, -0.1] },
    leftUpperArm: { rot: [-0.4, 0.15, -0.1] },
    leftElbow: { rot: [-1.92, 0, 0] },
    leftWrist: { rot: [0.2, 0.1, 0] },
    rightShoulder: { rot: [-0.08, 0, 0.05] },
    rightUpperArm: { rot: [-0.35, -0.2, 0.1] },
    rightElbow: { rot: [-2.02, 0, 0] },
    rightWrist: { rot: [0.2, -0.15, 0] },
    leftThigh: { rot: [-0.45, 0.12, 0] },
    leftKnee: { rot: [0.85, 0, 0] },
    leftFoot: { rot: [-0.40, 0, 0] },
    rightThigh: { rot: [-0.35, 0.18, 0] },
    rightKnee: { rot: [0.88, 0, 0] },
    rightFoot: { rot: [-0.42, 0, 0] }
  },

  // Struck / Hurt recoil
  HURT: {
    pelvis: { pos: [0, 0.94, -0.05], rot: [0, 0.1, 0] },
    spine: { rot: [0.24, -0.15, 0.05] },
    neck: { rot: [0.25, 0, 0] },
    head: { rot: [0.38, -0.25, 0.15] },
    leftShoulder: { rot: [-0.05, 0, -0.2] },
    leftUpperArm: { rot: [-0.2, 0.1, -0.35] },
    leftElbow: { rot: [-1.2, 0, 0] },
    leftWrist: { rot: [0.1, 0.1, 0] },
    rightShoulder: { rot: [0.05, 0, 0.2] },
    rightUpperArm: { rot: [-0.25, -0.1, 0.35] },
    rightElbow: { rot: [-1.1, 0, 0] },
    rightWrist: { rot: [0.1, -0.1, 0] },
    leftThigh: { rot: [-0.1, 0.1, 0] },
    leftKnee: { rot: [0.2, 0, 0] },
    leftFoot: { rot: [-0.1, 0, 0] },
    rightThigh: { rot: [0.25, 0.15, 0] },
    rightKnee: { rot: [0.35, 0, 0] },
    rightFoot: { rot: [-0.15, 0, 0] }
  },

  // Knockout collapse
  KO: {
    pelvis: { pos: [0, 0.45, -0.2], rot: [0, 0.1, 0] },
    spine: { rot: [0.55, -0.1, 0] },
    neck: { rot: [0.3, 0, 0] },
    head: { rot: [0.45, -0.2, 0] },
    leftShoulder: { rot: [0.1, 0, -0.3] },
    leftUpperArm: { rot: [0.15, 0, -0.4] },
    leftElbow: { rot: [-0.35, 0, 0] },
    leftWrist: { rot: [0, 0, 0] },
    rightShoulder: { rot: [0.1, 0, 0.3] },
    rightUpperArm: { rot: [0.15, 0, 0.4] },
    rightElbow: { rot: [-0.35, 0, 0] },
    rightWrist: { rot: [0, 0, 0] },
    leftThigh: { rot: [-0.8, 0.2, 0] },
    leftKnee: { rot: [1.35, 0, 0] },
    leftFoot: { rot: [-0.55, 0, 0] },
    rightThigh: { rot: [-0.75, -0.15, 0] },
    rightKnee: { rot: [1.4, 0, 0] },
    rightFoot: { rot: [-0.6, 0, 0] }
  },

  // Neutral T/A-pose standing rest
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
 * Creates the palette of Street Fighter / Cyberpunk materials.
 */
function createBoxerMaterials(options = {}) {
  const primaryColor = options.primaryColor || 0x14171d;      // Dark carbon slate
  const secondaryColor = options.secondaryColor || 0x222731;  // Gunmetal armor plates
  const accentCyan = options.accentColor || 0x00e5ff;         // Electric cyan neon
  const accentCrimson = options.secondaryAccent || 0xff0055;  // Cyber crimson neon
  const gloveColor = options.gloveColor || 0xb50f24;           // Crimson competition leather
  const gloveTapeColor = options.tapeColor || 0xf2f4f8;       // Athletic tape wrap white
  const goldColor = options.goldColor || 0xd4af37;             // Champion gold buckle

  const materials = {
    carbonArmor: new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.38,
      metalness: 0.45,
      name: 'carbonArmor'
    }),
    gunmetalPlates: new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.28,
      metalness: 0.7,
      name: 'gunmetalPlates'
    }),
    neonCyan: new THREE.MeshStandardMaterial({
      color: accentCyan,
      emissive: accentCyan,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.1,
      name: 'neonCyan'
    }),
    neonCrimson: new THREE.MeshStandardMaterial({
      color: accentCrimson,
      emissive: accentCrimson,
      emissiveIntensity: 2.0,
      roughness: 0.2,
      metalness: 0.1,
      name: 'neonCrimson'
    }),
    visor: new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.2,
      name: 'visor'
    }),
    coreReactor: new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.2,
      name: 'coreReactor'
    }),
    boxingLeather: new THREE.MeshStandardMaterial({
      color: gloveColor,
      roughness: 0.36,
      metalness: 0.14,
      name: 'boxingLeather'
    }),
    boxingLeatherTrim: new THREE.MeshStandardMaterial({
      color: 0x16171a,
      roughness: 0.52,
      metalness: 0.1,
      name: 'boxingLeatherTrim'
    }),
    tapeWrap: new THREE.MeshStandardMaterial({
      color: gloveTapeColor,
      roughness: 0.85,
      metalness: 0.05,
      name: 'tapeWrap'
    }),
    jointHydraulics: new THREE.MeshStandardMaterial({
      color: 0x363d4a,
      roughness: 0.25,
      metalness: 0.85,
      name: 'jointHydraulics'
    }),
    goldChampion: new THREE.MeshStandardMaterial({
      color: goldColor,
      roughness: 0.3,
      metalness: 0.88,
      emissive: 0x4a3200,
      emissiveIntensity: 0.25,
      name: 'goldChampion'
    }),
    bootSole: new THREE.MeshStandardMaterial({
      color: 0x0e1013,
      roughness: 0.9,
      metalness: 0.1,
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
 * Builds the Pelvis / Hips & Championship Belt assembly
 */
function buildPelvisMesh(mat) {
  const group = new THREE.Group();
  group.name = 'pelvis_visuals';

  // Main pelvic girdle block
  const pelvisCore = createBoxMesh(0.32, 0.15, 0.20, mat.carbonArmor);
  pelvisCore.position.set(0, -0.02, 0);
  group.add(pelvisCore);

  // Heavy Championship Belt
  const belt = createCylinderMesh(0.18, 0.175, 0.13, 24, mat.carbonArmor);
  belt.position.set(0, 0.02, 0);
  group.add(belt);

  // Gold Championship Buckle
  const buckle = createBoxMesh(0.13, 0.09, 0.03, mat.goldChampion);
  buckle.position.set(0, 0.02, 0.178);
  group.add(buckle);

  // Buckle center cyber neon crest
  const buckleCrest = createBoxMesh(0.05, 0.04, 0.012, mat.neonCyan);
  buckleCrest.position.set(0, 0.02, 0.194);
  group.add(buckleCrest);

  // Groin protector plate
  const groinGuard = createBoxMesh(0.14, 0.12, 0.06, mat.gunmetalPlates);
  groinGuard.position.set(0, -0.09, 0.08);
  groinGuard.rotation.x = -0.15;
  group.add(groinGuard);

  // Boxing trunks skirt segments covering upper thighs
  const leftTrunk = createBoxMesh(0.14, 0.15, 0.19, mat.carbonArmor);
  leftTrunk.position.set(0.11, -0.10, 0);
  group.add(leftTrunk);

  const rightTrunk = createBoxMesh(0.14, 0.15, 0.19, mat.carbonArmor);
  rightTrunk.position.set(-0.11, -0.10, 0);
  group.add(rightTrunk);

  // Crimson racing trim stripes on flanks
  const leftStripe = createBoxMesh(0.015, 0.14, 0.18, mat.neonCrimson);
  leftStripe.position.set(0.185, -0.09, 0);
  group.add(leftStripe);

  const rightStripe = createBoxMesh(0.015, 0.14, 0.18, mat.neonCrimson);
  rightStripe.position.set(-0.185, -0.09, 0);
  group.add(rightStripe);

  return group;
}

/**
 * Builds the Torso (Spine, Six-pack abs, Pectorals, Latissimus dorsi V-taper, Cyber power core)
 */
function buildTorsoMesh(mat) {
  const group = new THREE.Group();
  group.name = 'torso_visuals';

  // Central spine lumbar cylinder
  const spineCore = createCylinderMesh(0.14, 0.15, 0.22, 16, mat.carbonArmor);
  spineCore.position.set(0, 0.11, 0);
  group.add(spineCore);

  // Segmented Spine Vertebrae on back
  for (let i = 0; i < 4; i++) {
    const yPos = 0.05 + i * 0.09;
    const vertebra = createBoxMesh(0.06, 0.045, 0.04, mat.gunmetalPlates);
    vertebra.position.set(0, yPos, -0.10);
    group.add(vertebra);

    if (i < 3) {
      const disc = createCylinderMesh(0.025, 0.025, 0.02, 12, mat.neonCyan);
      disc.position.set(0, yPos + 0.045, -0.095);
      disc.rotation.x = Math.PI / 2;
      group.add(disc);
    }
  }

  // Segmented 6-Pack Cyber Abdominal Plates (3 rows x 2 columns)
  const abYPositions = [0.05, 0.13, 0.21];
  for (let row = 0; row < 3; row++) {
    const yPos = abYPositions[row];
    const width = 0.065 + row * 0.005;
    const height = 0.06;
    const depth = 0.035;

    // Left Ab plate
    const leftAb = createBoxMesh(width, height, depth, mat.gunmetalPlates);
    leftAb.position.set(0.045, yPos, 0.115 + row * 0.01);
    leftAb.rotation.y = 0.06;
    group.add(leftAb);

    // Right Ab plate
    const rightAb = createBoxMesh(width, height, depth, mat.gunmetalPlates);
    rightAb.position.set(-0.045, yPos, 0.115 + row * 0.01);
    rightAb.rotation.y = -0.06;
    group.add(rightAb);
  }

  // Oblique flank armor plates
  const leftOblique = createBoxMesh(0.05, 0.18, 0.14, mat.carbonArmor);
  leftOblique.position.set(0.145, 0.12, 0.02);
  leftOblique.rotation.z = -0.15;
  group.add(leftOblique);

  const rightOblique = createBoxMesh(0.05, 0.18, 0.14, mat.carbonArmor);
  rightOblique.position.set(-0.145, 0.12, 0.02);
  rightOblique.rotation.z = 0.15;
  group.add(rightOblique);

  // Upper Chest / Ribcage Core
  const ribcageCore = createCylinderMesh(0.24, 0.18, 0.22, 18, mat.carbonArmor);
  ribcageCore.position.set(0, 0.31, 0.0);
  ribcageCore.scale.set(1.15, 1.0, 0.85);
  group.add(ribcageCore);

  // Muscular Pectoral Muscle Plates
  const leftPec = createBoxMesh(0.145, 0.13, 0.07, mat.gunmetalPlates);
  leftPec.position.set(0.088, 0.32, 0.10);
  leftPec.rotation.set(-0.06, 0.12, -0.05);
  group.add(leftPec);

  const rightPec = createBoxMesh(0.145, 0.13, 0.07, mat.gunmetalPlates);
  rightPec.position.set(-0.088, 0.32, 0.10);
  rightPec.rotation.set(-0.06, -0.12, 0.05);
  group.add(rightPec);

  // Center Sternum Glowing Cyber Power Core
  const coreFrame = createCylinderMesh(0.045, 0.045, 0.03, 6, mat.goldChampion);
  coreFrame.position.set(0, 0.32, 0.125);
  coreFrame.rotation.x = Math.PI / 2;
  group.add(coreFrame);

  const coreReactor = createCylinderMesh(0.032, 0.032, 0.035, 6, mat.coreReactor);
  coreReactor.position.set(0, 0.32, 0.13);
  coreReactor.rotation.x = Math.PI / 2;
  group.add(coreReactor);

  // Wide Latissimus Dorsi (Lats) V-Taper Wings
  const leftLat = createBoxMesh(0.07, 0.22, 0.13, mat.carbonArmor);
  leftLat.position.set(0.20, 0.27, -0.03);
  leftLat.rotation.set(0, 0, -0.24);
  group.add(leftLat);

  const rightLat = createBoxMesh(0.07, 0.22, 0.13, mat.carbonArmor);
  rightLat.position.set(-0.20, 0.27, -0.03);
  rightLat.rotation.set(0, 0, 0.24);
  group.add(rightLat);

  // Clavicle / Collarbone Armor Bar
  const clavicle = createBoxMesh(0.36, 0.035, 0.08, mat.gunmetalPlates);
  clavicle.position.set(0, 0.40, 0.06);
  group.add(clavicle);

  // Upper back scapular armor plates
  const leftScapula = createBoxMesh(0.12, 0.15, 0.04, mat.gunmetalPlates);
  leftScapula.position.set(0.10, 0.32, -0.09);
  leftScapula.rotation.set(0.08, 0.1, -0.05);
  group.add(leftScapula);

  const rightScapula = createBoxMesh(0.12, 0.15, 0.04, mat.gunmetalPlates);
  rightScapula.position.set(-0.10, 0.32, -0.09);
  rightScapula.rotation.set(0.08, -0.1, 0.05);
  group.add(rightScapula);

  // Cybernetic neon conduit lines running across the ribcage
  const leftRibNeon = createCylinderMesh(0.008, 0.008, 0.18, 8, mat.neonCyan);
  leftRibNeon.position.set(0.12, 0.23, 0.08);
  leftRibNeon.rotation.set(0.2, 0.4, -0.7);
  group.add(leftRibNeon);

  const rightRibNeon = createCylinderMesh(0.008, 0.008, 0.18, 8, mat.neonCyan);
  rightRibNeon.position.set(-0.12, 0.23, 0.08);
  rightRibNeon.rotation.set(0.2, -0.4, 0.7);
  group.add(rightRibNeon);

  return group;
}

/**
 * Builds the Neck assembly with hydraulic sternocleidomastoid pistons
 */
function buildNeckMesh(mat) {
  const group = new THREE.Group();
  group.name = 'neck_visuals';

  // Central neck column
  const neckCol = createCylinderMesh(0.065, 0.075, 0.10, 16, mat.carbonArmor);
  neckCol.position.set(0, 0.05, 0);
  group.add(neckCol);

  // Hydraulic neck pistons (left & right)
  const leftPiston = createCylinderMesh(0.014, 0.014, 0.09, 10, mat.jointHydraulics);
  leftPiston.position.set(0.048, 0.05, 0.02);
  leftPiston.rotation.set(0.15, 0, -0.18);
  group.add(leftPiston);

  const rightPiston = createCylinderMesh(0.014, 0.014, 0.09, 10, mat.jointHydraulics);
  rightPiston.position.set(-0.048, 0.05, 0.02);
  rightPiston.rotation.set(0.15, 0, 0.18);
  group.add(rightPiston);

  // Rear cervical spine armor
  const spinePlate = createBoxMesh(0.045, 0.08, 0.03, mat.gunmetalPlates);
  spinePlate.position.set(0, 0.05, -0.055);
  group.add(spinePlate);

  const neonStripe = createBoxMesh(0.01, 0.08, 0.01, mat.neonCyan);
  neonStripe.position.set(0, 0.05, -0.07);
  group.add(neonStripe);

  return group;
}

/**
 * Builds the Head, Cyber Helmet, Glowing Visor Slit, and Heavy Chin Guard
 */
function buildHeadMesh(mat) {
  const group = new THREE.Group();
  group.name = 'head_visuals';

  // Sculpted Cranium / Helmet
  const cranium = createSphereMesh(0.108, 18, 14, mat.carbonArmor);
  cranium.position.set(0, 0.05, 0);
  cranium.scale.set(0.96, 1.15, 1.05);
  group.add(cranium);

  // Street Fighter Heavy Chin Guard
  const chinGuard = createBoxMesh(0.095, 0.075, 0.085, mat.gunmetalPlates);
  chinGuard.position.set(0, -0.055, 0.072);
  chinGuard.rotation.x = -0.15;
  group.add(chinGuard);

  // Cheek Protectors (Framing the face for aggressive boxing silhouette)
  const leftCheek = createBoxMesh(0.035, 0.085, 0.075, mat.gunmetalPlates);
  leftCheek.position.set(0.082, 0.015, 0.055);
  leftCheek.rotation.set(0, -0.25, -0.05);
  group.add(leftCheek);

  const rightCheek = createBoxMesh(0.035, 0.085, 0.075, mat.gunmetalPlates);
  rightCheek.position.set(-0.082, 0.015, 0.055);
  rightCheek.rotation.set(0, 0.25, 0.05);
  group.add(rightCheek);

  // Forehead Brow Ridge Overhang (Fighting glare grimace)
  const browRidge = createBoxMesh(0.155, 0.04, 0.065, mat.gunmetalPlates);
  browRidge.position.set(0, 0.068, 0.088);
  browRidge.rotation.x = 0.14;
  group.add(browRidge);

  // Glowing Cyber Visor Slit (Electric cyan eye slot)
  const visorMesh = createBoxMesh(0.132, 0.026, 0.035, mat.visor);
  visorMesh.position.set(0, 0.038, 0.092);
  group.add(visorMesh);

  // Cyber Ear Comm Pucks (Left & Right)
  const leftEar = createCylinderMesh(0.032, 0.032, 0.025, 14, mat.jointHydraulics);
  leftEar.position.set(0.112, 0.03, -0.01);
  leftEar.rotation.z = Math.PI / 2;
  group.add(leftEar);

  const leftEarRing = createCylinderMesh(0.018, 0.018, 0.028, 12, mat.neonCyan);
  leftEarRing.position.set(0.118, 0.03, -0.01);
  leftEarRing.rotation.z = Math.PI / 2;
  group.add(leftEarRing);

  const rightEar = createCylinderMesh(0.032, 0.032, 0.025, 14, mat.jointHydraulics);
  rightEar.position.set(-0.112, 0.03, -0.01);
  rightEar.rotation.z = Math.PI / 2;
  group.add(rightEar);

  const rightEarRing = createCylinderMesh(0.018, 0.018, 0.028, 12, mat.neonCyan);
  rightEarRing.position.set(-0.118, 0.03, -0.01);
  rightEarRing.rotation.z = Math.PI / 2;
  group.add(rightEarRing);

  // Mohawk Heatsink Crest on top of helmet
  const crest = createBoxMesh(0.03, 0.038, 0.16, mat.gunmetalPlates);
  crest.position.set(0, 0.135, -0.01);
  group.add(crest);

  const crestNeon = createBoxMesh(0.008, 0.042, 0.15, mat.neonCyan);
  crestNeon.position.set(0, 0.138, -0.01);
  group.add(crestNeon);

  return group;
}

/**
 * Builds authentic competition boxing glove with spherical/pill knuckle pad,
 * thumb seam, white knuckle tape wraps, and red leather finish.
 */
function buildBoxingGloveMesh(isLeft, mat) {
  const group = new THREE.Group();
  group.name = isLeft ? 'leftGlove_visuals' : 'rightGlove_visuals';

  // 1. Wrist Glove Cuff (encircling the wrist)
  const cuff = createCylinderMesh(0.054, 0.048, 0.065, 18, mat.boxingLeather);
  cuff.position.set(0, -0.03, 0);
  group.add(cuff);

  // White athletic tape wrap stripe across the cuff
  const cuffTape = createCylinderMesh(0.055, 0.050, 0.035, 18, mat.tapeWrap);
  cuffTape.position.set(0, -0.03, 0);
  group.add(cuffTape);

  // 2. Main Knuckle Pad (Pill / Bulbous striking dome)
  // Scaled capsule to emulate 16oz competition glove padding
  const knucklePad = createCapsuleMesh(0.060, 0.055, 4, 18, mat.boxingLeather);
  knucklePad.position.set(0, -0.095, 0.015);
  knucklePad.scale.set(1.15, 1.25, 0.95);
  group.add(knucklePad);

  // Secondary knuckle ridge dome
  const knuckleCrown = createSphereMesh(0.056, 16, 12, mat.boxingLeather);
  knuckleCrown.position.set(0, -0.115, 0.022);
  knuckleCrown.scale.set(1.05, 0.9, 0.85);
  group.add(knuckleCrown);

  // 3. Thumb & Thumb Seam
  // In boxing gloves, thumb curls parallel to fist on the medial side (inward towards center)
  const thumbX = isLeft ? -0.048 : 0.048;
  const thumbRotZ = isLeft ? -0.35 : 0.35;
  const thumbRotY = isLeft ? 0.30 : -0.30;

  const thumb = createCapsuleMesh(0.024, 0.045, 4, 12, mat.boxingLeather);
  thumb.position.set(thumbX, -0.082, 0.012);
  thumb.rotation.set(0.15, thumbRotY, thumbRotZ);
  group.add(thumb);

  // Thumb web seam (leather bridge connecting thumb to knuckle body)
  const seamX = isLeft ? -0.032 : 0.032;
  const thumbSeam = createBoxMesh(0.025, 0.035, 0.025, mat.boxingLeatherTrim);
  thumbSeam.position.set(seamX, -0.075, 0.005);
  group.add(thumbSeam);

  // 4. Palm & Grip Bar (Inner side)
  const palm = createBoxMesh(0.075, 0.075, 0.025, mat.boxingLeatherTrim);
  palm.position.set(0, -0.09, -0.032);
  group.add(palm);

  const gripBar = createCylinderMesh(0.014, 0.014, 0.065, 10, mat.boxingLeatherTrim);
  gripBar.position.set(0, -0.09, -0.035);
  gripBar.rotation.z = Math.PI / 2;
  group.add(gripBar);

  // 5. Street Fighter / Cyber emblem stripe on back of glove
  const emblem = createBoxMesh(0.045, 0.020, 0.008, mat.neonCyan);
  emblem.position.set(0, -0.085, 0.058);
  group.add(emblem);

  return group;
}

/**
 * Builds the complete arm kinematics chain (Shoulder -> UpperArm -> Elbow -> Forearm -> Wrist -> Glove -> HitPoint)
 */
function buildArmChain(isLeft, mat) {
  const sideSign = isLeft ? 1 : -1;

  // 1. Shoulder Joint (Clavicle / Deltoid pivot)
  const shoulder = new THREE.Group();
  shoulder.name = isLeft ? 'leftShoulder' : 'rightShoulder';
  shoulder.position.set(sideSign * 0.24, 0.38, 0.0);

  // Deltoid Armor Pauldron
  const pauldron = createSphereMesh(0.088, 16, 12, mat.carbonArmor);
  pauldron.position.set(sideSign * 0.04, 0, 0);
  pauldron.scale.set(1.15, 0.95, 1.0);
  shoulder.add(pauldron);

  const pauldronStripe = createCylinderMesh(0.075, 0.075, 0.015, 16, mat.neonCyan);
  pauldronStripe.position.set(sideSign * 0.04, 0, 0);
  pauldronStripe.rotation.z = Math.PI / 2;
  shoulder.add(pauldronStripe);

  const shoulderSocket = createSphereMesh(0.052, 12, 12, mat.jointHydraulics);
  shoulderSocket.position.set(0, 0, 0);
  shoulder.add(shoulderSocket);

  // 2. Upper Arm (Bicep / Tricep)
  const upperArm = new THREE.Group();
  upperArm.name = isLeft ? 'leftUpperArm' : 'rightUpperArm';
  upperArm.position.set(sideSign * 0.08, -0.04, 0.0);
  shoulder.add(upperArm);

  const bicepMesh = createCapsuleMesh(0.062, 0.16, 4, 16, mat.carbonArmor);
  bicepMesh.position.set(0, -0.11, 0);
  upperArm.add(bicepMesh);

  // Outer tricep armor plate
  const tricepPlate = createBoxMesh(0.035, 0.18, 0.08, mat.gunmetalPlates);
  tricepPlate.position.set(sideSign * 0.048, -0.11, -0.01);
  upperArm.add(tricepPlate);

  // 3. Elbow Joint
  const elbow = new THREE.Group();
  elbow.name = isLeft ? 'leftElbow' : 'rightElbow';
  elbow.position.set(0.0, -0.26, 0.0);
  upperArm.add(elbow);

  // Elbow hinge cylinder
  const elbowPin = createCylinderMesh(0.042, 0.042, 0.085, 14, mat.jointHydraulics);
  elbowPin.position.set(0, 0, 0);
  elbowPin.rotation.z = Math.PI / 2;
  elbow.add(elbowPin);

  // Armored elbow protector cap
  const elbowCap = createBoxMesh(0.05, 0.05, 0.04, mat.gunmetalPlates);
  elbowCap.position.set(0, 0, -0.045);
  elbow.add(elbowCap);

  // 4. Forearm
  const forearm = new THREE.Group();
  forearm.name = isLeft ? 'leftForearm' : 'rightForearm';
  forearm.position.set(0.0, 0.0, 0.0);
  elbow.add(forearm);

  const forearmMesh = createCylinderMesh(0.056, 0.044, 0.22, 16, mat.carbonArmor);
  forearmMesh.position.set(0, -0.11, 0);
  forearm.add(forearmMesh);

  // Forearm Bracer Guard with neon status channel
  const bracer = createBoxMesh(0.065, 0.16, 0.045, mat.gunmetalPlates);
  bracer.position.set(0, -0.11, 0.035);
  forearm.add(bracer);

  const bracerNeon = createBoxMesh(0.015, 0.14, 0.01, mat.neonCyan);
  bracerNeon.position.set(0, -0.11, 0.058);
  forearm.add(bracerNeon);

  // 5. Wrist Joint & Athletic White Tape Wraps
  const wrist = new THREE.Group();
  wrist.name = isLeft ? 'leftWrist' : 'rightWrist';
  wrist.position.set(0.0, -0.23, 0.0);
  forearm.add(wrist);

  const tapeWrapMesh = createCylinderMesh(0.047, 0.047, 0.06, 16, mat.tapeWrap);
  tapeWrapMesh.position.set(0, -0.03, 0);
  wrist.add(tapeWrapMesh);

  // 6. Glove
  const glove = new THREE.Group();
  glove.name = isLeft ? 'leftGlove' : 'rightGlove';
  glove.position.set(0.0, -0.05, 0.0);
  wrist.add(glove);

  const gloveVisuals = buildBoxingGloveMesh(isLeft, mat);
  glove.add(gloveVisuals);

  // 7. Hit-Tracking Dummy Object
  // Positioned at the apex of the knuckle impact surface
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
 * Builds the leg kinematics chain (Thigh -> Knee -> Calf -> Foot)
 */
function buildLegChain(isLeft, mat) {
  const sideSign = isLeft ? 1 : -1;

  // 1. Thigh (Hip Joint pivot)
  const thigh = new THREE.Group();
  thigh.name = isLeft ? 'leftThigh' : 'rightThigh';
  thigh.position.set(sideSign * 0.14, -0.08, 0.0);

  const hipBall = createSphereMesh(0.052, 12, 12, mat.jointHydraulics);
  hipBall.position.set(0, 0, 0);
  thigh.add(hipBall);

  const quadMesh = createCapsuleMesh(0.068, 0.24, 4, 16, mat.carbonArmor);
  quadMesh.position.set(0, -0.18, 0);
  thigh.add(quadMesh);

  // Lateral thigh armor panel
  const thighArmor = createBoxMesh(0.035, 0.22, 0.09, mat.gunmetalPlates);
  thighArmor.position.set(sideSign * 0.055, -0.18, 0);
  thigh.add(thighArmor);

  // 2. Knee Joint
  const knee = new THREE.Group();
  knee.name = isLeft ? 'leftKnee' : 'rightKnee';
  knee.position.set(0.0, -0.38, 0.0);
  thigh.add(knee);

  const kneePin = createCylinderMesh(0.044, 0.044, 0.08, 14, mat.jointHydraulics);
  kneePin.position.set(0, 0, 0);
  kneePin.rotation.z = Math.PI / 2;
  knee.add(kneePin);

  // Armored kneepad cap
  const kneepad = createBoxMesh(0.065, 0.07, 0.04, mat.gunmetalPlates);
  kneepad.position.set(0, 0, 0.045);
  knee.add(kneepad);

  const kneepadNeon = createBoxMesh(0.045, 0.015, 0.01, mat.neonCyan);
  kneepadNeon.position.set(0, 0, 0.066);
  knee.add(kneepadNeon);

  // 3. Calf
  const calf = new THREE.Group();
  calf.name = isLeft ? 'leftCalf' : 'rightCalf';
  calf.position.set(0.0, 0.0, 0.0);
  knee.add(calf);

  const calfMesh = createCylinderMesh(0.058, 0.038, 0.34, 16, mat.carbonArmor);
  calfMesh.position.set(0, -0.17, 0);
  calf.add(calfMesh);

  // Shin guard armor
  const shinGuard = createBoxMesh(0.055, 0.24, 0.035, mat.gunmetalPlates);
  shinGuard.position.set(0, -0.16, 0.042);
  calf.add(shinGuard);

  // 4. Foot & Boxing Boot
  const foot = new THREE.Group();
  foot.name = isLeft ? 'leftFoot' : 'rightFoot';
  foot.position.set(0.0, -0.36, 0.03);
  calf.add(foot);

  // Ankle high-top collar with white athletic tape
  const bootCollar = createCylinderMesh(0.046, 0.046, 0.065, 16, mat.tapeWrap);
  bootCollar.position.set(0, 0.02, 0);
  foot.add(bootCollar);

  // Boot foot body
  const bootBody = createBoxMesh(0.088, 0.075, 0.21, mat.carbonArmor);
  bootBody.position.set(0, -0.04, 0.045);
  foot.add(bootBody);

  // Rounded toe box
  const toeCap = createSphereMesh(0.045, 12, 10, mat.gunmetalPlates);
  toeCap.position.set(0, -0.04, 0.145);
  toeCap.scale.set(0.95, 0.8, 0.9);
  foot.add(toeCap);

  // Dark rubber tread sole
  const sole = createBoxMesh(0.094, 0.02, 0.23, mat.bootSole);
  sole.position.set(0, -0.08, 0.045);
  foot.add(sole);

  // White athletic lace stripes across tongue
  for (let i = 0; i < 3; i++) {
    const lace = createBoxMesh(0.05, 0.008, 0.02, mat.tapeWrap);
    lace.position.set(0, -0.015, 0.04 + i * 0.035);
    foot.add(lace);
  }

  return {
    thigh,
    knee,
    calf,
    foot
  };
}

/**
 * Creates the complete 3D Boxer character with hierarchical kinematic rigging.
 * 
 * @param {Object} options Configuration parameters
 * @returns {Object} { model, joints, getLeftFistWorldPos, getRightFistWorldPos, setMaterialHurtState, dispose, applyPose, resetPose }
 */
export function createBoxer3D(options = {}) {
  const materials = createBoxerMaterials(options);

  // Top-level container
  const rootGroup = new THREE.Group();
  rootGroup.name = 'boxer3D_root';

  if (options.scale) {
    rootGroup.scale.setScalar(options.scale);
  }

  // --- HIERARCHY ASSEMBLY ---
  // Pelvis / Hips (y ≈ 0.95m above floor)
  const pelvis = new THREE.Group();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, 0.95, 0);
  rootGroup.add(pelvis);

  const pelvisVisuals = buildPelvisMesh(materials);
  pelvis.add(pelvisVisuals);

  // Spine / Torso (lumbar core pivot)
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.12, 0);
  pelvis.add(spine);

  const torsoVisuals = buildTorsoMesh(materials);
  spine.add(torsoVisuals);

  // Neck (base of neck pivot)
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.45, 0);
  spine.add(neck);

  const neckVisuals = buildNeckMesh(materials);
  neck.add(neckVisuals);

  // Head (base of skull / chin pivot)
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.10, 0);
  neck.add(head);

  const headVisuals = buildHeadMesh(materials);
  head.add(headVisuals);

  // Left Arm Chain
  const leftArm = buildArmChain(true, materials);
  spine.add(leftArm.shoulder);

  // Right Arm Chain
  const rightArm = buildArmChain(false, materials);
  spine.add(rightArm.shoulder);

  // Left Leg Chain
  const leftLeg = buildLegChain(true, materials);
  pelvis.add(leftLeg.thigh);

  // Right Leg Chain
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
  function applyPose(poseName) {
    const pose = typeof poseName === 'string' ? BOXER_POSES[poseName] : poseName;
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
  if (initialPose && BOXER_POSES[initialPose]) {
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

  // Stored base colors for clean restoration
  const baseColors = {
    visorColor: materials.visor.color.clone(),
    visorEmissive: materials.visor.emissive.clone(),
    visorIntensity: materials.visor.emissiveIntensity,

    neonCyanColor: materials.neonCyan.color.clone(),
    neonCyanEmissive: materials.neonCyan.emissive.clone(),
    neonCyanIntensity: materials.neonCyan.emissiveIntensity,

    coreReactorColor: materials.coreReactor.color.clone(),
    coreReactorEmissive: materials.coreReactor.emissive.clone(),
    coreReactorIntensity: materials.coreReactor.emissiveIntensity,

    carbonEmissive: materials.carbonArmor.emissive.clone(),
    carbonIntensity: materials.carbonArmor.emissiveIntensity
  };

  function setMaterialHurtState(isHurt) {
    isHurtState = !!isHurt;

    if (isHurtState) {
      // Flashing damage warning state: bright fiery red
      materials.visor.color.setHex(0xff1122);
      materials.visor.emissive.setHex(0xff1122);
      materials.visor.emissiveIntensity = 4.2;

      materials.neonCyan.color.setHex(0xff2244);
      materials.neonCyan.emissive.setHex(0xff2244);
      materials.neonCyan.emissiveIntensity = 3.5;

      materials.coreReactor.color.setHex(0xff3300);
      materials.coreReactor.emissive.setHex(0xff3300);
      materials.coreReactor.emissiveIntensity = 4.5;

      materials.carbonArmor.emissive.setHex(0x550a12);
      materials.carbonArmor.emissiveIntensity = 0.8;
    } else {
      // Restore pristine electric cyan & dark carbon state
      materials.visor.color.copy(baseColors.visorColor);
      materials.visor.emissive.copy(baseColors.visorEmissive);
      materials.visor.emissiveIntensity = baseColors.visorIntensity;

      materials.neonCyan.color.copy(baseColors.neonCyanColor);
      materials.neonCyan.emissive.copy(baseColors.neonCyanEmissive);
      materials.neonCyan.emissiveIntensity = baseColors.neonCyanIntensity;

      materials.coreReactor.color.copy(baseColors.coreReactorColor);
      materials.coreReactor.emissive.copy(baseColors.coreReactorEmissive);
      materials.coreReactor.emissiveIntensity = baseColors.coreReactorIntensity;

      materials.carbonArmor.emissive.copy(baseColors.carbonEmissive);
      materials.carbonArmor.emissiveIntensity = baseColors.carbonIntensity;
    }
  }

  function setVisorColor(colorHex, intensity = 3.0) {
    materials.visor.color.setHex(colorHex);
    materials.visor.emissive.setHex(colorHex);
    materials.visor.emissiveIntensity = intensity;
    baseColors.visorColor.setHex(colorHex);
    baseColors.visorEmissive.setHex(colorHex);
    baseColors.visorIntensity = intensity;
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

export default createBoxer3D;
