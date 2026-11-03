import * as THREE from 'three';

/**
 * 3D Translucent Boxing Gloves Subsystem
 * Inspired by Kinect Sports Boxing (Xbox 360) & Punch-Out!! (Wii):
 * 
 * Features:
 * - Pure 3D Boxing Gloves: No awkward arm cylinders or fake finger meshes.
 *   Only clean, translucent arcade boxing gloves floating in 1st-person perspective.
 * - Two-Anchor Kinematic Alignment:
 *   1. Base of Glove (Cuff/Wrist): Anchored 1:1 to the player's physical wrist landmark.
 *   2. Front of Glove (Knuckle Striking Pad): Locked along the longitudinal vector to knuckles.
 *   3. Transverse Knuckle Spread (Index to Pinky): Determines true 3D roll (pronation/supination).
 * - Orthonormal Basis & Quaternion SLERP:
 *   Constructs an exact 3D orientation frame with zero gimbal lock and smooth interpolation.
 * - Translucent Glass-Leather Material:
 *   High transmission, glossy surface shine, and white athletic wrist tape with tournament patch.
 * - Adaptive Fallbacks:
 *   Uses Pose forearm kinematics when hands are partially occluded, and rests in an orthodox guard.
 */
export class PlayerGloves3D {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.enabled = true;
    this.colorTheme = 'CRIMSON'; // 'CRIMSON' | 'CYAN' | 'GOLD'

    // Root group attached directly to camera to maintain 1st-person perspective
    this.root = new THREE.Group();
    this.root.name = 'PlayerGloves3D_Root';
    this.camera.add(this.root);

    // Color definitions
    this.themes = {
      CRIMSON: {
        gloveColor: 0xee1838,
        specularColor: 0xff6688,
        tapeColor: 0xf4f7fd,
        patchColor: 0xbb1122,
        trimColor: 0xffffff
      },
      CYAN: {
        gloveColor: 0x00f3ff,
        specularColor: 0x88ffff,
        tapeColor: 0xf4f7fd,
        patchColor: 0x0088cc,
        trimColor: 0xffffff
      },
      GOLD: {
        gloveColor: 0xffc700,
        specularColor: 0xffea88,
        tapeColor: 0xf4f7fd,
        patchColor: 0xcc8800,
        trimColor: 0xffffff
      }
    };

    // Pre-allocated math objects for zero GC per-frame allocations
    this._pWrist = new THREE.Vector3();
    this._pKnuckle = new THREE.Vector3();
    this._pIndex = new THREE.Vector3();
    this._pPinky = new THREE.Vector3();
    this._vAim = new THREE.Vector3();
    this._vTransverse = new THREE.Vector3();
    this._vecX = new THREE.Vector3();
    this._vecY = new THREE.Vector3();
    this._vecZ = new THREE.Vector3();
    this._rotMatrix = new THREE.Matrix4();
    this._targetQuat = new THREE.Quaternion();

    // Build Left and Right Translucent Boxing Glove Meshes
    this.leftGloveGroup = this.buildBoxingGlove(true);
    this.rightGloveGroup = this.buildBoxingGlove(false);

    this.root.add(this.leftGloveGroup);
    this.root.add(this.rightGloveGroup);

    // Kinematic smoothing state
    this.clock = 0;
    this.lerpSpeed = 0.42; // Snappy, responsive, jitter-free

    this.leftState = {
      targetPos: new THREE.Vector3(-0.16, -0.14, -0.42),
      targetQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, 0.16, -0.16)),
      currentPos: new THREE.Vector3(-0.16, -0.14, -0.42),
      currentQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, 0.16, -0.16)),
      velocity: 0,
      prevWrist: null,
      visible: true
    };

    this.rightState = {
      targetPos: new THREE.Vector3(0.16, -0.14, -0.38),
      targetQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, -0.16, 0.16)),
      currentPos: new THREE.Vector3(0.16, -0.14, -0.38),
      currentQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.24, -0.16, 0.16)),
      velocity: 0,
      prevWrist: null,
      visible: true
    };
  }

  /**
   * Constructs an authentic 3D boxing glove mesh with its base/cuff centered at origin (0, 0, 0)
   * - (0, 0, 0) is the WRIST ENTRY / BASE of the glove
   * - +Y axis points towards the FRONT KNUCKLES / striking cushion
   * - -Z axis is the dorsal / back of hand facing the opponent
   * - +Z axis is the inner palm facing the player
   * - +X is medial for left hand (thumb side), -X is medial for right hand
   * @param {boolean} isLeft 
   */
  buildBoxingGlove(isLeft) {
    const glove = new THREE.Group();
    glove.name = isLeft ? 'BoxingGlove_Left' : 'BoxingGlove_Right';

    const currentTheme = this.themes[this.colorTheme];

    // --- 1. TRANSLUCENT ARCADE LEATHER SHADER ---
    // See-through translucent crimson/cyan/gold leather (inspired by Kinect Sports Boxing):
    // Allows opponent and ring to be seen through the glove body!
    const leatherMat = new THREE.MeshStandardMaterial({
      color: currentTheme.gloveColor,
      transparent: true,
      opacity: 0.32,
      roughness: 0.16,
      metalness: 0.10,
      emissive: currentTheme.gloveColor,
      emissiveIntensity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    glove.userData.leatherMat = leatherMat;

    // White athletic wrist tape material
    const tapeMat = new THREE.MeshStandardMaterial({
      color: currentTheme.tapeColor,
      roughness: 0.45,
      metalness: 0.06,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    });
    glove.userData.tapeMat = tapeMat;

    // Brand patch label material
    const patchMat = new THREE.MeshStandardMaterial({
      color: currentTheme.patchColor,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    glove.userData.patchMat = patchMat;

    // White piping / trim material for edges
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      transparent: true,
      opacity: 0.60,
      depthWrite: false
    });
    glove.userData.trimMat = trimMat;

    // ==========================================
    // 2. BASE WRIST CUFF (Centered at Y = 0 to 0.06)
    // ==========================================
    // The wrist enters right at Y = 0.00!
    const cuffHeight = 0.055;
    const cuffGeo = new THREE.CylinderGeometry(0.040, 0.043, cuffHeight, 20);
    const cuff = new THREE.Mesh(cuffGeo, tapeMat);
    cuff.position.set(0, cuffHeight * 0.5, 0.005);
    glove.add(cuff);

    // Embossed tape wrapping rings around cuff
    for (let h = 0.012; h <= cuffHeight - 0.01; h += 0.016) {
      const ribGeo = new THREE.TorusGeometry(0.0415, 0.002, 6, 20);
      const rib = new THREE.Mesh(ribGeo, trimMat);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(0, h, 0.005);
      glove.add(rib);
    }

    // Brand Label Patch on dorsal side of cuff
    const patchGeo = new THREE.BoxGeometry(0.038, 0.024, 0.006);
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0, cuffHeight * 0.5, -0.041);
    glove.add(patch);

    // ==========================================
    // 3. MID-GLOVE BODY (Hand transition: Y = 0.055 to 0.11)
    // ==========================================
    const midGeo = new THREE.BoxGeometry(0.076, 0.055, 0.058);
    const midMesh = new THREE.Mesh(midGeo, leatherMat);
    midMesh.position.set(0, 0.082, -0.002);
    glove.add(midMesh);

    // Inner palm grip bar (leather cylindrical dowel on player-facing palm side)
    const gripGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.055, 8);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x22050a,
      roughness: 0.6,
      transparent: true,
      opacity: 0.40,
      depthWrite: false
    });
    const gripBar = new THREE.Mesh(gripGeo, gripMat);
    gripBar.rotation.z = Math.PI / 2;
    gripBar.position.set(0, 0.082, 0.026);
    glove.add(gripBar);

    // ==========================================
    // 4. MAIN KNUCKLE CUSHION (Striking Face: Y = 0.11 to 0.17)
    // ==========================================
    // Curved bulbous boxing fist padding with sculpted striking face
    const knuckleGeo = new THREE.SphereGeometry(0.052, 22, 18);
    // Sculpt into authentic boxing glove knuckle dome
    const pos = knuckleGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Flatten palm side (+Z facing player)
      if (z > 0) {
        z *= 0.60;
      }
      // Bulbous striking face (-Z facing opponent)
      if (z < 0) {
        z *= 1.25;
      }
      // Elongate striking apex (+Y)
      if (y > 0) {
        y *= 1.15;
      }

      pos.setXYZ(i, x, y, z);
    }
    knuckleGeo.computeVertexNormals();

    const knuckleMesh = new THREE.Mesh(knuckleGeo, leatherMat);
    knuckleMesh.scale.set(1.15, 1.18, 1.22);
    knuckleMesh.position.set(0, 0.138, -0.012);
    glove.add(knuckleMesh);

    // White Seam Piping Accent along knuckle contour (Kinect Sports style)
    const seamPipingGeo = new THREE.TorusGeometry(0.054, 0.0025, 6, 24, Math.PI * 1.3);
    const seamPiping = new THREE.Mesh(seamPipingGeo, trimMat);
    seamPiping.rotation.x = Math.PI * 0.45;
    seamPiping.rotation.z = -Math.PI * 0.15;
    seamPiping.position.set(0, 0.138, -0.015);
    glove.add(seamPiping);

    // ==========================================
    // 5. THUMB COMPARTMENT (Medial side of glove)
    // ==========================================
    const thumbSide = isLeft ? 1 : -1;
    const thumbGeo = new THREE.SphereGeometry(0.025, 14, 12);
    thumbGeo.scale(1.0, 1.45, 0.90);

    const thumbMesh = new THREE.Mesh(thumbGeo, leatherMat);
    thumbMesh.position.set(thumbSide * 0.046, 0.088, 0.012);
    thumbMesh.rotation.set(0.25, 0, thumbSide * -0.45);
    glove.add(thumbMesh);

    // Safety leather bridge connecting thumb to knuckle body
    const bridgeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.038, 6);
    const bridge = new THREE.Mesh(bridgeGeo, trimMat);
    bridge.position.set(thumbSide * 0.036, 0.10, 0.006);
    bridge.rotation.z = thumbSide * -0.55;
    glove.add(bridge);

    // Proportional, sleek scale so gloves remain compact and unobstructed
    glove.scale.set(0.92, 0.92, 0.92);

    return glove;
  }

  /**
   * Sets glove color theme ('CRIMSON', 'CYAN', 'GOLD')
   */
  setTheme(theme) {
    if (!this.themes[theme]) return;
    this.colorTheme = theme;
    const t = this.themes[theme];

    [this.leftGloveGroup, this.rightGloveGroup].forEach(glove => {
      if (glove) {
        if (glove.userData.leatherMat) {
          glove.userData.leatherMat.color.setHex(t.gloveColor);
          glove.userData.leatherMat.emissive.setHex(t.gloveColor);
        }
        if (glove.userData.tapeMat) glove.userData.tapeMat.color.setHex(t.tapeColor);
        if (glove.userData.patchMat) glove.userData.patchMat.color.setHex(t.patchColor);
      }
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    this.root.visible = this.enabled;
    return this.enabled;
  }

  /**
   * Updates 3D Gloves position and 3D orientation based on 21-joint Hand Tracking and Pose
   * @param {Object} handData Output from HandTracker { left, right }
   * @param {Array} mirroredPoseLM 33 Mirrored Pose landmarks
   * @param {Object} evaluation Combat evaluation { punchEvent, guard }
   * @param {number} width Screen width
   * @param {number} height Screen height
   * @param {number} dt Frame delta time
   */
  update(handData, mirroredPoseLM, evaluation, width, height, dt = 0.016) {
    if (!this.enabled) return;
    this.clock += dt;

    const aspect = width / (height || 1);

    // Update Left Glove 3D Kinematics
    this.updateSingleGlove(
      true,
      handData?.left,
      mirroredPoseLM ? mirroredPoseLM[15] : null, // Left wrist in Pose
      mirroredPoseLM ? mirroredPoseLM[13] : null, // Left elbow in Pose
      evaluation,
      aspect,
      dt
    );

    // Update Right Glove 3D Kinematics
    this.updateSingleGlove(
      false,
      handData?.right,
      mirroredPoseLM ? mirroredPoseLM[16] : null, // Right wrist in Pose
      mirroredPoseLM ? mirroredPoseLM[14] : null, // Right elbow in Pose
      evaluation,
      aspect,
      dt
    );
  }

  /**
   * Computes 6-DOF 3D Position and 3D Rotation for a single glove
   * Implements two-anchor kinematic locking:
   * 1. Base of Glove: Position locked to Wrist landmark
   * 2. Front of Glove: Vector locked to Knuckles landmark
   * 3. Transverse Vector: Derived from Index-to-Pinky MCP for pronation/supination
   */
  updateSingleGlove(isLeft, handKinematics, poseWrist, poseElbow, evaluation, aspect, dt) {
    const gloveGroup = isLeft ? this.leftGloveGroup : this.rightGloveGroup;
    const state = isLeft ? this.leftState : this.rightState;

    const breath = Math.sin(this.clock * 2.2 + (isLeft ? 0 : 1.2)) * 0.010;

    // Mathematical Perspective Frustum Scaling for 1:1 Camera Synchronization
    const vFovRad = (this.camera.fov * Math.PI) / 180;
    const tanHalfFov = Math.tan(vFovRad * 0.5);

    if (handKinematics && handKinematics.wrist && handKinematics.landmarks) {
      // =========================================================================
      // 1. FULL 21-JOINT 3D HAND TRACKING ACTIVE (TWO-ANCHOR GEOMETRIC LOCK)
      // =========================================================================
      state.visible = true;
      const lm = handKinematics.landmarks;

      const lmWrist = lm[0];       // WRIST
      const lmIndex = lm[5];       // INDEX MCP
      const lmKnuckle = lm[9];     // MIDDLE MCP (KNUCKLES)
      const lmPinky = lm[17];      // PINKY MCP

      // Base guard depth in camera space (right in front of player's chest/chin)
      let z3D = isLeft ? -0.44 : -0.38;

      // Check punch velocity
      let velocity = 0;
      if (state.prevWrist) {
        const dX = lmWrist.x - state.prevWrist.x;
        const dY = lmWrist.y - state.prevWrist.y;
        velocity = Math.sqrt(dX * dX + dY * dY) / Math.max(0.001, dt);
      }
      state.prevWrist = { x: lmWrist.x, y: lmWrist.y };
      state.velocity = velocity;

      // Forward Punch Extension in 3D Depth (Z)
      // When punching, hand extends into the ring towards opponent
      const isPunchingArm = evaluation?.punchEvent && evaluation.punchEvent.arm === (isLeft ? 'LEFT' : 'RIGHT');
      if (isPunchingArm || velocity > 2.6) {
        z3D -= 0.38 + Math.min(0.25, velocity * 0.06);
      } else if (lmWrist.z !== undefined && lmWrist.z < -0.02) {
        z3D += Math.max(-0.22, lmWrist.z * 1.2);
      }

      // Convert Screen Landmarks to Camera-Space Coordinates at current depth
      const depthMag = Math.abs(z3D);
      const visibleHalfH = tanHalfFov * depthMag;
      const visibleHalfW = visibleHalfH * aspect;

      // Helper to project any 2D/3D hand landmark to 3D Camera Space
      const unprojectPoint = (targetVec, pt, zOffset = 0) => {
        const xCam = (pt.x - 0.5) * 2.0 * visibleHalfW;
        const yCam = (0.5 - pt.y) * 2.0 * visibleHalfH + 0.01;
        const zCam = z3D + (pt.z ?? 0) * 0.65 + zOffset;
        targetVec.set(xCam, yCam, zCam);
      };

      // 1. Unproject Wrist (Base of Glove)
      unprojectPoint(this._pWrist, lmWrist);

      // 2. Unproject Knuckles (Front Striking Face)
      unprojectPoint(this._pKnuckle, lmKnuckle);

      // 3. Unproject Index and Pinky MCPs (Transverse Roll Reference)
      unprojectPoint(this._pIndex, lmIndex);
      unprojectPoint(this._pPinky, lmPinky);

      // --- ANCHOR 1: BASE OF GLOVE AT PHYSICAL WRIST ---
      // The glove local origin (0, 0, 0) is the base/cuff, so setting position to _pWrist
      // keeps the base 100% attached to the wrist at all times!
      state.targetPos.copy(this._pWrist);

      // --- ANCHOR 2: FRONT OF GLOVE AIMED AT PHYSICAL KNUCKLES ---
      // Longitudinal vector from Wrist -> Knuckles defines local +Y axis
      this._vAim.subVectors(this._pKnuckle, this._pWrist);
      const aimLen = this._vAim.length();
      if (aimLen > 0.001) {
        this._vecY.copy(this._vAim).divideScalar(aimLen);
      } else {
        this._vecY.set(0, 1, 0);
      }

      // --- TRANSVERSE ROLL & PALM NORMAL ---
      // Vector across the knuckles (Index to Pinky)
      this._vTransverse.subVectors(this._pPinky, this._pIndex);
      const transLen = this._vTransverse.length();
      if (transLen > 0.001) {
        this._vTransverse.divideScalar(transLen);
      } else {
        this._vTransverse.set(isLeft ? -1 : 1, 0, 0);
      }

      // Construct orthonormal triad:
      // Palm Normal (+Z axis facing player):
      // For Left hand: Y x Transverse points +Z (towards player)
      // For Right hand: Transverse x Y points +Z (towards player)
      if (isLeft) {
        this._vecZ.crossVectors(this._vecY, this._vTransverse).normalize();
      } else {
        this._vecZ.crossVectors(this._vTransverse, this._vecY).normalize();
      }

      // Re-orthogonalize X axis: vecX = vecY x vecZ
      this._vecX.crossVectors(this._vecY, this._vecZ).normalize();

      // Ensure vecZ is strictly orthogonal: vecZ = vecX x vecY
      this._vecZ.crossVectors(this._vecX, this._vecY).normalize();

      // Form exact rotation matrix and convert to quaternion
      this._rotMatrix.makeBasis(this._vecX, this._vecY, this._vecZ);
      this._targetQuat.setFromRotationMatrix(this._rotMatrix);
      state.targetQuat.copy(this._targetQuat);

    } else if (poseWrist && (poseWrist.visibility ?? 1) > 0.40) {
      // =========================================================================
      // 2. FALLBACK TO POSE WRIST & FOREARM TRACKING
      // =========================================================================
      state.visible = true;
      const z3D = isLeft ? -0.44 : -0.38;
      const depthMag = Math.abs(z3D);
      const visibleHalfH = tanHalfFov * depthMag;
      const visibleHalfW = visibleHalfH * aspect;

      const xCam = (poseWrist.x - 0.5) * 2.0 * visibleHalfW;
      const yCam = (0.5 - poseWrist.y) * 2.0 * visibleHalfH + 0.01;
      state.targetPos.set(xCam, yCam, z3D);

      // Aim along forearm from elbow to wrist
      if (poseElbow) {
        const xElbow = (poseElbow.x - 0.5) * 2.0 * visibleHalfW;
        const yElbow = (0.5 - poseElbow.y) * 2.0 * visibleHalfH + 0.01;
        this._vecY.set(xCam - xElbow, yCam - yElbow, 0.12).normalize();

        const defaultTransverse = isLeft ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);
        if (isLeft) {
          this._vecZ.crossVectors(this._vecY, defaultTransverse).normalize();
        } else {
          this._vecZ.crossVectors(defaultTransverse, this._vecY).normalize();
        }
        this._vecX.crossVectors(this._vecY, this._vecZ).normalize();
        this._rotMatrix.makeBasis(this._vecX, this._vecY, this._vecZ);
        this._targetQuat.setFromRotationMatrix(this._rotMatrix);
        state.targetQuat.copy(this._targetQuat);
      } else {
        const defaultEuler = new THREE.Euler(0.28, isLeft ? 0.16 : -0.16, isLeft ? -0.18 : 0.18);
        state.targetQuat.setFromEuler(defaultEuler);
      }

    } else {
      // =========================================================================
      // 3. RESTING ORTHODOX GUARD STANCE FALLBACK
      // =========================================================================
      const restX = isLeft ? -0.16 : 0.16;
      const restY = -0.13 + breath;
      const restZ = isLeft ? -0.44 : -0.38;

      state.targetPos.set(restX, restY, restZ);
      const defaultEuler = new THREE.Euler(0.32, isLeft ? 0.18 : -0.18, isLeft ? -0.22 : 0.22);
      state.targetQuat.setFromEuler(defaultEuler);
    }

    // Exponential Moving Average Smoothing (LERP) for position
    state.currentPos.lerp(state.targetPos, this.lerpSpeed);

    // Spherical Linear Interpolation (SLERP) for smooth, gimbal-lock-free rotation
    state.currentQuat.slerp(state.targetQuat, this.lerpSpeed);

    // Apply directly to Three.js Glove Mesh Group
    gloveGroup.position.copy(state.currentPos);
    gloveGroup.quaternion.copy(state.currentQuat);
  }

  dispose() {
    [this.leftGloveGroup, this.rightGloveGroup].forEach(glove => {
      if (!glove) return;
      glove.traverse(obj => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      if (glove.parent) glove.parent.remove(glove);
    });

    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

export default PlayerGloves3D;
