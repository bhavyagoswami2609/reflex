import * as THREE from 'three';

/**
 * 3D Championship Boxing Ring & Stadium Arena Environment
 * Inspired by Punch-Out!! (Wii) and authentic professional championship rings:
 * - 6m x 6m elevated canvas ring mat with authentic canvas texture, boundary lines, and center logo
 * - Red ring apron with corner steps
 * - 4 steel corner posts (Red Corner back-left, Blue Corner back-right, White neutral corners)
 * - Padded corner turnbuckles & 4 tiers of competition boxing ropes with vertical spacer straps
 * - Overhead steel lighting rig truss with high-intensity spotlights illuminating the ring canvas
 * - Atmospheric 3D stadium arena backdrop with tiered crowd bleachers, stadium floodlight arrays,
 *   and purple neon stair accents
 * - Random stadium camera flashes for alive atmosphere
 */
export class BoxingRing3D {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'BoxingRingEnvironment';
    this.scene.add(this.root);

    this.flashes = [];
    this.flashClock = 0;

    this.initTextures();
    this.buildRingPlatform();
    this.buildCornerPostsAndTurnbuckles();
    this.buildRingRopes();
    this.buildOverheadLightingRig();
    this.buildStadiumArena();
  }

  /**
   * Generates procedural high-resolution canvas texture for the ring floor
   */
  initTextures() {
    // 1. Ring Canvas Mat Texture (1024x1024 procedural canvas)
    const canvasMat = document.createElement('canvas');
    canvasMat.width = 1024;
    canvasMat.height = 1024;
    const ctx = canvasMat.getContext('2d');

    // Deep championship navy blue canvas mat
    ctx.fillStyle = '#121e33';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle canvas weave texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let y = 0; y < 1024; y += 4) {
      ctx.fillRect(0, y, 1024, 2);
    }
    for (let x = 0; x < 1024; x += 4) {
      ctx.fillRect(x, 0, 2, 1024);
    }

    // Outer ring rope line boundary (white square boundary line)
    ctx.strokeStyle = 'rgba(240, 245, 255, 0.85)';
    ctx.lineWidth = 14;
    ctx.strokeRect(96, 96, 832, 832);

    // Inner subtle secondary line
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(120, 120, 784, 784);

    // Center circular logo crest
    ctx.save();
    ctx.translate(512, 512);

    // Outer circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Red & Blue emblem wings
    const crestGrad = ctx.createLinearGradient(-180, 0, 180, 0);
    crestGrad.addColorStop(0, 'rgba(235, 25, 60, 0.65)');
    crestGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    crestGrad.addColorStop(1, 'rgba(0, 170, 255, 0.65)');

    ctx.fillStyle = crestGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 190, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center Dark Core
    ctx.fillStyle = '#0d1626';
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.fill();

    // Boxing Gloves Graphic in center
    ctx.fillStyle = '#ff2244';
    ctx.beginPath();
    ctx.arc(-26, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.arc(26, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Championship Text
    ctx.font = '900 38px "Russo One", "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('REFLEX', 0, -130);

    ctx.font = '800 24px "Russo One", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('WORLD CHAMPIONSHIP RING', 0, 155);

    ctx.restore();

    this.canvasTexture = new THREE.CanvasTexture(canvasMat);
    this.canvasTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
  }

  /**
   * 1. 3D Ring Platform: Elevated canvas mat and red ring apron
   */
  buildRingPlatform() {
    const platformGroup = new THREE.Group();
    platformGroup.name = 'RingPlatform';

    // Main Canvas Ring Mat (5.6m x 5.6m inside ropes)
    const matGeo = new THREE.BoxGeometry(5.6, 0.35, 5.6);
    const matMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }), // +X (red apron)
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }), // -X (red apron)
      new THREE.MeshStandardMaterial({                                     // +Y (top canvas with logo)
        map: this.canvasTexture,
        roughness: 0.65,
        metalness: 0.08
      }),
      new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.9 }), // -Y (bottom)
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }), // +Z (red apron)
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })  // -Z (red apron)
    ];

    const matMesh = new THREE.Mesh(matGeo, matMaterials);
    matMesh.position.y = -0.175; // Top surface at y = 0
    matMesh.receiveShadow = true;
    platformGroup.add(matMesh);

    // Outer Extended Apron (6.8m x 6.8m red ring canvas skirt)
    const apronGeo = new THREE.BoxGeometry(6.8, 0.40, 6.8);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x801018,
      roughness: 0.8,
      metalness: 0.1
    });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.y = -0.40;
    platformGroup.add(apronMesh);

    // Ring Base Platform Structure (Dark heavy steel pedestal 7.4m x 7.4m)
    const baseGeo = new THREE.BoxGeometry(7.4, 0.6, 7.4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.6,
      metalness: 0.5
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.90;
    platformGroup.add(baseMesh);

    this.root.add(platformGroup);
  }

  /**
   * 2. Corner Posts & Padded Turnbuckles
   */
  buildCornerPostsAndTurnbuckles() {
    const cornersGroup = new THREE.Group();
    cornersGroup.name = 'RingCorners';

    // Corner Positions (at radius 2.75m from center)
    const d = 2.65;
    const cornerDefs = [
      { x: -d, z: -d, color: 0xee2244, name: 'RedCorner' },     // Back Left: RED
      { x:  d, z: -d, color: 0x0099ff, name: 'BlueCorner' },    // Back Right: BLUE
      { x: -d, z:  d, color: 0xffffff, name: 'WhiteCornerL' },  // Front Left: WHITE
      { x:  d, z:  d, color: 0xffffff, name: 'WhiteCornerR' }   // Front Right: WHITE
    ];

    const postGeo = new THREE.CylinderGeometry(0.065, 0.075, 2.3, 16);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x222a3a,
      metalness: 0.85,
      roughness: 0.25
    });

    cornerDefs.forEach(def => {
      const corner = new THREE.Group();
      corner.position.set(def.x, 0, def.z);

      // Steel Corner Post
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 1.05;
      corner.add(post);

      // Post Top Cap
      const capGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const capMat = new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.6, roughness: 0.3 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 2.22;
      corner.add(cap);

      // Padded Corner Turnbuckle Cushion (Vertical triangular pad covering the turnbuckles)
      const padGeo = new THREE.BoxGeometry(0.32, 1.35, 0.32);
      const padMat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.45,
        metalness: 0.15
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      // Angle the pad towards ring center
      pad.position.set(def.x > 0 ? -0.12 : 0.12, 1.08, def.z > 0 ? -0.12 : 0.12);
      pad.rotation.y = Math.atan2(-def.x, -def.z);
      corner.add(pad);

      // Turnbuckle Hooks & Chains
      const ropeHeights = [0.48, 0.85, 1.22, 1.58];
      const hookGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8);
      const hookMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, metalness: 0.9, roughness: 0.2 });

      ropeHeights.forEach(h => {
        const hook = new THREE.Mesh(hookGeo, hookMat);
        hook.rotation.z = Math.PI / 2;
        hook.position.set(0, h, 0);
        corner.add(hook);
      });

      cornersGroup.add(corner);
    });

    this.root.add(cornersGroup);
  }

  /**
   * 3. 4 Tiers of 3D Ring Ropes with Spacer Straps
   */
  buildRingRopes() {
    const ropesGroup = new THREE.Group();
    ropesGroup.name = 'RingRopes';

    const d = 2.58;
    const ropeHeights = [
      { h: 0.48, color: 0x0088ff }, // Bottom rope: Blue
      { h: 0.85, color: 0xffffff }, // Lower-mid rope: White
      { h: 1.22, color: 0xffffff }, // Upper-mid rope: White
      { h: 1.58, color: 0xee2244 }  // Top rope: Red
    ];

    ropeHeights.forEach(({ h, color }) => {
      const ropeMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.2
      });

      // 4 sides of ropes
      // 1. Back rope (-Z)
      const ropeBackGeo = new THREE.CylinderGeometry(0.024, 0.024, d * 2, 12);
      const ropeBack = new THREE.Mesh(ropeBackGeo, ropeMat);
      ropeBack.rotation.z = Math.PI / 2;
      ropeBack.position.set(0, h, -d);
      ropesGroup.add(ropeBack);

      // 2. Left rope (-X)
      const ropeLeftGeo = new THREE.CylinderGeometry(0.024, 0.024, d * 2, 12);
      const ropeLeft = new THREE.Mesh(ropeLeftGeo, ropeMat);
      ropeLeft.rotation.x = Math.PI / 2;
      ropeLeft.position.set(-d, h, 0);
      ropesGroup.add(ropeLeft);

      // 3. Right rope (+X)
      const ropeRightGeo = new THREE.CylinderGeometry(0.024, 0.024, d * 2, 12);
      const ropeRight = new THREE.Mesh(ropeRightGeo, ropeMat);
      ropeRight.rotation.x = Math.PI / 2;
      ropeRight.position.set(d, h, 0);
      ropesGroup.add(ropeRight);

      // 4. Front rope (+Z)
      const ropeFrontGeo = new THREE.CylinderGeometry(0.024, 0.024, d * 2, 12);
      const ropeFront = new THREE.Mesh(ropeFrontGeo, ropeMat);
      ropeFront.rotation.z = Math.PI / 2;
      ropeFront.position.set(0, h, d);
      ropesGroup.add(ropeFront);
    });

    // Vertical Canvas Rope Spacer Straps (2 per side)
    const spacerMat = new THREE.MeshStandardMaterial({ color: 0x222a3a, roughness: 0.8 });
    const spacerGeo = new THREE.BoxGeometry(0.045, 1.25, 0.015);

    const offsets = [-0.85, 0.85];
    offsets.forEach(offset => {
      // Back spacers
      const spBack = new THREE.Mesh(spacerGeo, spacerMat);
      spBack.position.set(offset, 1.03, -d);
      ropesGroup.add(spBack);

      // Front spacers
      const spFront = new THREE.Mesh(spacerGeo, spacerMat);
      spFront.position.set(offset, 1.03, d);
      ropesGroup.add(spFront);

      // Left spacers
      const spLeft = new THREE.Mesh(spacerGeo, spacerMat);
      spLeft.rotation.y = Math.PI / 2;
      spLeft.position.set(-d, 1.03, offset);
      ropesGroup.add(spLeft);

      // Right spacers
      const spRight = new THREE.Mesh(spacerGeo, spacerMat);
      spRight.rotation.y = Math.PI / 2;
      spRight.position.set(d, 1.03, offset);
      ropesGroup.add(spRight);
    });

    this.root.add(ropesGroup);
  }

  /**
   * 4. Overhead Championship Steel Truss Rig with High-Intensity Spotlights
   */
  buildOverheadLightingRig() {
    const rigGroup = new THREE.Group();
    rigGroup.name = 'LightingRig';

    const trussY = 5.2;
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x252e40,
      metalness: 0.9,
      roughness: 0.3
    });

    // Square steel truss frame (4 beams)
    const beamGeo = new THREE.BoxGeometry(6.4, 0.22, 0.22);

    const b1 = new THREE.Mesh(beamGeo, trussMat);
    b1.position.set(0, trussY, -3.2);
    rigGroup.add(b1);

    const b2 = new THREE.Mesh(beamGeo, trussMat);
    b2.position.set(0, trussY, 3.2);
    rigGroup.add(b2);

    const b3 = new THREE.Mesh(beamGeo, trussMat);
    b3.rotation.y = Math.PI / 2;
    b3.position.set(-3.2, trussY, 0);
    rigGroup.add(b3);

    const b4 = new THREE.Mesh(beamGeo, trussMat);
    b4.rotation.y = Math.PI / 2;
    b4.position.set(3.2, trussY, 0);
    rigGroup.add(b4);

    // Overhead High-Intensity Spotlights
    // Center Championship Ring Spotlight (casts bright circle onto ring floor)
    const centerSpot = new THREE.SpotLight(0xfff5ea, 5.5);
    centerSpot.position.set(0, trussY, 0);
    centerSpot.target.position.set(0, 0, 0);
    centerSpot.angle = Math.PI / 3.4;
    centerSpot.penumbra = 0.45;
    centerSpot.decay = 1.2;
    centerSpot.distance = 18;
    centerSpot.castShadow = true;
    rigGroup.add(centerSpot);
    rigGroup.add(centerSpot.target);

    // Left Cyan Accent Spotlight
    const spotLeft = new THREE.SpotLight(0x00f3ff, 3.2);
    spotLeft.position.set(-2.8, trussY - 0.2, -1.8);
    spotLeft.target.position.set(0, 1.2, 0);
    spotLeft.angle = Math.PI / 4;
    spotLeft.penumbra = 0.5;
    spotLeft.decay = 1.2;
    rigGroup.add(spotLeft);
    rigGroup.add(spotLeft.target);

    // Right Magenta / Warm Accent Spotlight
    const spotRight = new THREE.SpotLight(0xff3366, 3.0);
    spotRight.position.set(2.8, trussY - 0.2, -1.8);
    spotRight.target.position.set(0, 1.2, 0);
    spotRight.angle = Math.PI / 4;
    spotRight.penumbra = 0.5;
    spotRight.decay = 1.2;
    rigGroup.add(spotRight);
    rigGroup.add(spotRight.target);

    // Front Warm Fill Spotlight
    const spotFront = new THREE.SpotLight(0xfff0dd, 3.8);
    spotFront.position.set(0, trussY - 0.2, 3.2);
    spotFront.target.position.set(0, 1.3, -0.2);
    spotFront.angle = Math.PI / 3.2;
    spotFront.penumbra = 0.4;
    rigGroup.add(spotFront);
    rigGroup.add(spotFront.target);

    // Visual Spotlight Lamps (Lamp Canister Meshes attached to truss)
    const lampGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 12);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.8, roughness: 0.2 });
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffea });

    const lampPositions = [
      [-2.4, trussY - 0.18, -3.2],
      [0,    trussY - 0.18, -3.2],
      [2.4,  trussY - 0.18, -3.2],
      [-2.4, trussY - 0.18,  3.2],
      [0,    trussY - 0.18,  3.2],
      [2.4,  trussY - 0.18,  3.2]
    ];

    lampPositions.forEach(([lx, ly, lz]) => {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(lx, ly, lz);
      lamp.rotation.x = Math.PI / 4 * (lz > 0 ? -1 : 1);
      rigGroup.add(lamp);

      // Glowing lens disc
      const lensGeo = new THREE.CircleGeometry(0.15, 12);
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(lx, ly - 0.16, lz + (lz > 0 ? -0.1 : 0.1));
      lens.rotation.x = lamp.rotation.x + Math.PI / 2;
      rigGroup.add(lens);
    });

    this.root.add(rigGroup);
  }

  /**
   * 5. 3D Stadium Arena Surroundings
   * Tiered dark stadium bleachers, purple neon stair runners, arena floodlights, crowd silhouette
   */
  buildStadiumArena() {
    const arenaGroup = new THREE.Group();
    arenaGroup.name = 'StadiumArena';

    // Arena Floor Basin
    const floorGeo = new THREE.PlaneGeometry(38, 38);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x060910,
      roughness: 0.95,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    arenaGroup.add(floor);

    // Tiered Crowd Bleachers (Back Wall & Sides)
    const bleacherMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.9,
      metalness: 0.1
    });

    // 6 ascending tiers of stadium seating behind the ring
    for (let t = 0; t < 6; t++) {
      const tierGeo = new THREE.BoxGeometry(26, 0.65, 1.4);
      const tier = new THREE.Mesh(tierGeo, bleacherMat);
      tier.position.set(0, t * 0.65 - 0.6, -5.2 - t * 1.3);
      arenaGroup.add(tier);

      // Low-poly crowd silhouettes on each tier
      const crowdGeo = new THREE.BoxGeometry(24, 0.45, 0.35);
      const crowdMat = new THREE.MeshStandardMaterial({
        color: (t % 2 === 0) ? 0x141b2c : 0x0f1522,
        roughness: 0.95
      });
      const crowd = new THREE.Mesh(crowdGeo, crowdMat);
      crowd.position.set(0, t * 0.65 - 0.1, -5.2 - t * 1.3);
      arenaGroup.add(crowd);
    }

    // Iconic Purple Neon Entrance Stairways (Matching Punch-Out!! Wii reference image)
    const stairGeo = new THREE.BoxGeometry(2.4, 4.2, 0.15);
    const neonPurpleMat = new THREE.MeshBasicMaterial({
      color: 0xbf00ff,
      wireframe: false
    });

    // Left Purple Stair Runner
    const stairLeft = new THREE.Mesh(stairGeo, neonPurpleMat);
    stairLeft.rotation.x = -Math.PI / 3.8;
    stairLeft.position.set(-7.5, 1.2, -8.5);
    arenaGroup.add(stairLeft);

    // Right Purple Stair Runner
    const stairRight = new THREE.Mesh(stairGeo, neonPurpleMat);
    stairRight.rotation.x = -Math.PI / 3.8;
    stairRight.position.set(7.5, 1.2, -8.5);
    arenaGroup.add(stairRight);

    // Distant Stadium Arena Floodlight Towers (Upper Corners)
    const bankGeo = new THREE.BoxGeometry(1.8, 1.0, 0.4);
    const bankMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const bankL = new THREE.Mesh(bankGeo, bankMat);
    bankL.position.set(-11, 4.8, -12);
    bankL.lookAt(0, 1.2, 0);
    arenaGroup.add(bankL);

    const bankR = new THREE.Mesh(bankGeo, bankMat);
    bankR.position.set(11, 4.8, -12);
    bankR.lookAt(0, 1.2, 0);
    arenaGroup.add(bankR);

    // Stadium Camera Flashes (Simulated paparazzi pops)
    for (let f = 0; f < 8; f++) {
      const flashLight = new THREE.PointLight(0xffffff, 0, 8);
      flashLight.position.set(
        (Math.random() - 0.5) * 22,
        0.5 + Math.random() * 3.5,
        -5 - Math.random() * 7
      );
      arenaGroup.add(flashLight);
      this.flashes.push({
        light: flashLight,
        timer: Math.random() * 2.5
      });
    }

    this.root.add(arenaGroup);
  }

  /**
   * Updates camera flashes and subtle stadium ambiance
   * @param {number} dt Frame delta time
   */
  update(dt = 0.016) {
    this.flashClock += dt;

    // Paparazzi Flash Pulse Loop
    for (const f of this.flashes) {
      f.timer -= dt;
      if (f.timer <= 0) {
        // Trigger brief 80ms flash pop
        f.light.intensity = 3.5 + Math.random() * 4.0;
        f.timer = 1.2 + Math.random() * 3.5;
      } else if (f.light.intensity > 0) {
        f.light.intensity = Math.max(0, f.light.intensity - dt * 35);
      }
    }
  }

  dispose() {
    this.root.traverse(obj => {
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
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

export default BoxingRing3D;
