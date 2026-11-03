import { ArcadeAudioEngine } from './audio/soundEffects.js';
import { FormChecker } from './biomechanics/formChecker.js';
import { DefenseDetector } from './biomechanics/defenseDetector.js';
import { SkeletonRenderer } from './render/skeletonRenderer.js';
import { FXRenderer } from './render/fxRenderer.js';
import { Boxer3DScene } from './game/boxer3DAnimator.js';
import { GameState } from './game/gameState.js';
import { VRCameraController } from './render/vrCameraController.js';
import { CombatAI } from './game/combatAI.js';
import { PlayerGlovesRenderer } from './render/playerGlovesRenderer.js';
import { HandTracker, HAND_LM } from './biomechanics/handTracker.js';

class ShadowBoxingApp {
  constructor() {
    this.video = document.getElementById('webcam-video');
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Subsystems
    this.audio = new ArcadeAudioEngine();
    this.formChecker = new FormChecker();
    this.defenseDetector = new DefenseDetector();
    this.skeletonRenderer = new SkeletonRenderer();
    this.fx = new FXRenderer();
    this.boxer3D = new Boxer3DScene();
    this.gameState = new GameState();
    this.vrCamera = new VRCameraController();
    this.combatAI = new CombatAI(this.boxer3D, this.gameState);
    this.playerGloves = new PlayerGlovesRenderer();
    this.handTracker = new HandTracker();

    // 21-Joint Hands Tracking state
    this.handResults = null;
    this.handsInstance = null;

    // Mode: 'FORM' | 'REFLEX' (Reflex Battle as Default Start Mode)
    this.currentMode = 'REFLEX';

    // State & Tracking
    this.poseLandmarks = null;
    this.lastFrameTime = performance.now();
    this.isRunning = false;
    this.opponentAttackCooldown = performance.now() + 1200;
    this.hitstopTimer = 0; // Freeze frame hitstop effect

    this.initDOM();
  }

  initDOM() {
    // Mode tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Audio Toggle
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 MUTED' : '🔊 SFX';
      });
    }

    // VR Head Tracking Toggle
    const vrBtn = document.getElementById('btn-vr');
    if (vrBtn) {
      vrBtn.addEventListener('click', () => {
        const isEnabled = this.vrCamera.toggle();
        vrBtn.textContent = isEnabled ? '🥽 VR CAM: ON' : '🥽 VR CAM: OFF';
        if (isEnabled) {
          vrBtn.classList.add('active-pill');
        } else {
          vrBtn.classList.remove('active-pill');
        }
      });
    }

    // Scanline Toggle
    const scanlineBtn = document.getElementById('btn-scanlines');
    const scanlineDiv = document.querySelector('.scanlines');
    if (scanlineBtn && scanlineDiv) {
      scanlineBtn.addEventListener('click', () => {
        const isCurrentlyHidden = scanlineDiv.style.display === 'none' || scanlineDiv.style.display === '';
        scanlineDiv.style.display = isCurrentlyHidden ? 'block' : 'none';
        scanlineBtn.textContent = isCurrentlyHidden ? '📺 CRT: ON' : '📺 CRT: OFF';
      });
    }

    // Bot Difficulty Toggle Button (ROOKIE -> PRO -> CHAMPION)
    const diffBtn = document.getElementById('btn-difficulty-toggle');
    if (diffBtn) {
      diffBtn.addEventListener('click', () => {
        const newDiff = this.combatAI.cycleDifficulty();
        this.boxer3D.setDifficulty(newDiff.name);
        diffBtn.textContent = `⚡ DIFFICULTY: ${newDiff.name}`;
        diffBtn.style.borderColor = newDiff.color;
        diffBtn.style.color = newDiff.color;
        this.audio.speakAnnouncer(`DIFFICULTY ${newDiff.name}`);
        this.fx.addFloatingBadge(`BOT DIFFICULTY: ${newDiff.name}`, window.innerWidth * 0.5, window.innerHeight * 0.35, newDiff.color, 28);
      });
    }

    // Opponent Toggle Button (Shane Fazen vs Titan Cyberbot)
    const fighterToggleBtn = document.getElementById('btn-fighter-toggle');
    if (fighterToggleBtn) {
      fighterToggleBtn.addEventListener('click', () => {
        const next = this.boxer3D.toggleCharacterType();
        if (next === 'human') {
          fighterToggleBtn.textContent = '🥊 SHANE (SPARRING)';
          this.audio.speakAnnouncer('SPARRING PARTNER: SHANE');
          this.fx.addFloatingBadge('SPARRING PARTNER: SHANE FAZEN', window.innerWidth * 0.5, window.innerHeight * 0.35, '#00f3ff', 28);
        } else {
          fighterToggleBtn.textContent = '🤖 TITAN (CYBERBOT)';
          this.audio.speakAnnouncer('OPPONENT: TITAN');
          this.fx.addFloatingBadge('OPPONENT: TITAN CYBERBOT', window.innerWidth * 0.5, window.innerHeight * 0.35, '#ff0055', 28);
        }
      });
    }

    // Player 3D Translucent Gloves Theme Toggle (Punch-Out Red -> Cyan -> Gold -> Off)
    const glovesToggleBtn = document.getElementById('btn-gloves-toggle');
    if (glovesToggleBtn) {
      glovesToggleBtn.addEventListener('click', () => {
        const gloves3D = this.boxer3D.playerGloves3D;
        if (!gloves3D || !gloves3D.enabled) {
          if (gloves3D) gloves3D.enabled = true;
          this.boxer3D.setGloveTheme('CRIMSON');
          glovesToggleBtn.textContent = '🧤 3D GLOVES: RED';
          this.fx.addFloatingBadge('3D GLOVES: PUNCH-OUT RED', window.innerWidth * 0.5, window.innerHeight * 0.35, '#ff3366', 26);
        } else if (gloves3D.colorTheme === 'CRIMSON') {
          this.boxer3D.setGloveTheme('CYAN');
          glovesToggleBtn.textContent = '🧤 3D GLOVES: CYAN';
          this.fx.addFloatingBadge('3D GLOVES: NEON CYAN', window.innerWidth * 0.5, window.innerHeight * 0.35, '#00f3ff', 26);
        } else if (gloves3D.colorTheme === 'CYAN') {
          this.boxer3D.setGloveTheme('GOLD');
          glovesToggleBtn.textContent = '🧤 3D GLOVES: GOLD';
          this.fx.addFloatingBadge('3D GLOVES: CHAMPION GOLD', window.innerWidth * 0.5, window.innerHeight * 0.35, '#ffd700', 26);
        } else {
          this.boxer3D.toggleGloves();
          glovesToggleBtn.textContent = '🧤 3D GLOVES: OFF';
          this.fx.addFloatingBadge('3D GLOVES: HIDDEN', window.innerWidth * 0.5, window.innerHeight * 0.35, '#94a3b8', 24);
        }
      });
    }

    // Re-Center Button
    const recenterBtn = document.getElementById('btn-recenter');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        if (this.lastMirroredLandmarks) {
          const ok = this.defenseDetector.recenter(this.lastMirroredLandmarks);
          this.vrCamera.recenter(this.lastMirroredLandmarks);
          if (ok) {
            this.audio.playWebRecenterChime();
            this.audio.speakAnnouncer('BODY CENTERED!');
            this.fx.addFloatingBadge('🎯 BODY RE-CENTERED!', window.innerWidth * 0.5, window.innerHeight * 0.30, '#00f3ff', 30);
          }
        }
      });
    }

    // Keyboard 'C' shortcut to re-center
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        if (this.lastMirroredLandmarks) {
          const ok = this.defenseDetector.recenter(this.lastMirroredLandmarks);
          this.vrCamera.recenter(this.lastMirroredLandmarks);
          if (ok) {
            this.audio.playWebRecenterChime();
            this.audio.speakAnnouncer('BODY CENTERED!');
            this.fx.addFloatingBadge('🎯 BODY RE-CENTERED!', window.innerWidth * 0.5, window.innerHeight * 0.30, '#00f3ff', 30);
          }
        }
      }
    });

    // Camera Gate Start Button
    const startBtn = document.getElementById('start-camera-btn');
    const cameraGate = document.getElementById('camera-gate');
    if (startBtn && cameraGate) {
      startBtn.addEventListener('click', async () => {
        startBtn.textContent = 'CONNECTING CAMERA...';
        await this.startCamera();
        cameraGate.style.display = 'none';
        this.audio.playBell();
        this.audio.speakAnnouncer('ROUND ONE... FIGHT!');
        this.showSplashModal('ROUND 1', 'FIGHT!');
      });
    }

    // Retry Match Button on Match Over Modal
    const retryBtn = document.getElementById('btn-retry-match');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.retryMatch());
    }

    // Keyboard Space / Enter to quickly retry match
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        const modal = document.getElementById('match-over-modal');
        if (modal && modal.style.display !== 'none' && this.gameState.isMatchOver) {
          e.preventDefault();
          this.retryMatch();
        }
      }
    });

    // Initialize 3D Boxer WebGL Scene
    const viewportStage = document.querySelector('.viewport-stage');
    if (viewportStage) {
      this.boxer3D.init(viewportStage);
      this.boxer3D.setVisible(true);
    }

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    // Default to Reflex Arcade Battle mode on initial load
    this.setMode('REFLEX');
  }

  /**
   * Resets and restarts the match immediately without a page reload
   */
  retryMatch() {
    const modal = document.getElementById('match-over-modal');
    if (modal) modal.style.display = 'none';

    this.gameState.resetMatch();
    this.boxer3D.reset();
    this.combatAI.reset();
    this.formChecker.resetStats();
    this.defenseDetector.reset();
    this.opponentAttackCooldown = performance.now() + 1000;

    this.audio.playBell();
    this.audio.speakAnnouncer('ROUND ONE... FIGHT!');
    this.showSplashModal('ROUND 1', 'FIGHT!');
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.boxer3D) {
      this.boxer3D.resize(window.innerWidth, window.innerHeight);
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.formChecker.resetStats();
    this.defenseDetector.reset();
    this.boxer3D.reset();
    this.boxer3D.setVisible(mode === 'REFLEX');
    this.gameState.resetMatch();
    this.combatAI.reset();
    this.updatePanelVisibility();

    if (mode === 'REFLEX') {
      this.opponentAttackCooldown = performance.now() + 1000;
      this.audio.speakAnnouncer('REFLEX BRAWL! EVADE AND COUNTER!');
      this.showSplashModal('REFLEX BRAWL', 'DODGE & COUNTER');
    } else if (mode === 'FORM') {
      this.audio.speakAnnouncer('FORM COACH! PERFECT YOUR STRIKES!');
      this.showSplashModal('FORM COACH', 'GUARD & EXTENSION');
    }
  }

  updatePanelVisibility() {
    const formPanel = document.getElementById('form-checker-panel');
    const statsPanel = document.getElementById('punch-stats-panel');
    const instructionBanner = document.getElementById('instruction-banner');

    if (this.currentMode === 'FORM') {
      if (formPanel) formPanel.style.display = 'block';
      if (statsPanel) statsPanel.style.display = 'block';
      if (instructionBanner) {
        instructionBanner.style.display = 'block';
        instructionBanner.textContent = '🥊 FORM COACH: Keep your hands up guarding your chin. Snap clean punches with hip rotation.';
      }
    } else if (this.currentMode === 'REFLEX') {
      if (formPanel) formPanel.style.display = 'none';
      if (statsPanel) statsPanel.style.display = 'none';
      if (instructionBanner) instructionBanner.style.display = 'none';
    }
  }

  showSplashModal(mainText, subText, durationMs = 1600) {
    const modal = document.getElementById('splash-modal');
    const main = document.getElementById('splash-main-text');
    const sub = document.getElementById('splash-sub-text');
    if (!modal || !main || !sub) return;

    main.textContent = mainText;
    sub.textContent = subText;
    modal.classList.add('active');

    setTimeout(() => {
      modal.classList.remove('active');
    }, durationMs);
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      this.video.srcObject = stream;
      await new Promise(resolve => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });

      // Initialize MediaPipe Pose from CDN global
      if (window.Pose) {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults((results) => {
          this.poseLandmarks = results.poseLandmarks;
        });

        // Initialize MediaPipe Hands (21-Joint Precision Hand Tracking) from CDN global
        if (window.Hands) {
          const hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          hands.onResults((results) => {
            this.handResults = results;
          });

          this.handsInstance = hands;
        }

        if (window.Camera) {
          const camera = new window.Camera(this.video, {
            onFrame: async () => {
              if (this.video.readyState >= 2) {
                await pose.send({ image: this.video });
                if (this.handsInstance) {
                  await this.handsInstance.send({ image: this.video });
                }
              }
            },
            width: 1280,
            height: 720
          });
          camera.start();
        }
      }

      this.isRunning = true;
      requestAnimationFrame((t) => this.gameLoop(t));
    } catch (err) {
      console.error('Failed to initialize webcam / pose tracking:', err);
      alert('Camera access is required for skeletal tracking! Please allow camera permissions.');
    }
  }

  gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    if (timestamp < this.hitstopTimer) {
      requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }

    const { width, height } = this.canvas;

    // 1. Process Mirrored Pose Landmarks
    let mirroredLandmarks = null;
    if (this.poseLandmarks) {
      mirroredLandmarks = this.poseLandmarks.map(p => ({
        ...p,
        x: 1.0 - p.x
      }));
    }

    // 2. Update VR Head Tracking Camera
    this.vrCamera.update(mirroredLandmarks, width, height, dt);

    // 3. Screen Shake Root
    this.ctx.save();
    if (this.fx.shakeOffset.x !== 0 || this.fx.shakeOffset.y !== 0) {
      this.ctx.translate(this.fx.shakeOffset.x, this.fx.shakeOffset.y);
    }

    this.ctx.clearRect(0, 0, width, height);

    // 4. Render Background & 3D Virtual Arena with Parallax
    if (this.currentMode === 'REFLEX') {
      // In Reflex Brawl: Full 3D Championship Boxing Ring, Spotlights, and Arena are rendered by Three.js!
      this.ctx.fillStyle = '#060911';
      this.ctx.fillRect(0, 0, width, height);
    } else {
      // FORM MODE: primary camera mirror with gym tint & depth ropes
      if (this.video && this.video.readyState >= 2) {
        this.ctx.save();
        this.ctx.translate(width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, 0, 0, width, height);
        this.ctx.fillStyle = 'rgba(8, 11, 18, 0.35)';
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = '#090c14';
        this.ctx.fillRect(0, 0, width, height);
      }
      this.vrCamera.drawRingRopes(this.ctx, width, height, width * 0.5, height * 0.5);
    }

    // 5. 21-Joint Full Hand Biomechanics & Kinematics
    let handData = null;
    if (this.handTracker && this.handResults) {
      handData = this.handTracker.processHands(this.handResults, mirroredLandmarks);
    }

    // Biomechanical Frame Evaluation
    let evaluation = {
      guard: { intact: true, score: 100, warnings: [] },
      punchEvent: null,
      balance: { isBalanced: true, com: { x: 0.5, y: 0.5 } }
    };
    let defense = { action: 'NONE', slipLeft: false, slipRight: false, ducking: false, blocking: false };

    if (mirroredLandmarks) {
      this.lastMirroredLandmarks = mirroredLandmarks;
      evaluation = this.formChecker.processFrame(mirroredLandmarks, timestamp);
      defense = this.defenseDetector.detect(mirroredLandmarks);
    }

    // 6. Render Fight World (3D POV Camera in Three.js directly tracks head movement)
    if (this.currentMode === 'FORM') {
      this.runFormMode(mirroredLandmarks, evaluation, width, height, timestamp, handData);
    } else if (this.currentMode === 'REFLEX') {
      this.runReflexMode(mirroredLandmarks, evaluation, defense, handData, width, height, timestamp, dt);
    }

    // FX Particles & Badges in 3D Space
    this.fx.update(dt);
    this.fx.render(this.ctx);

    // 7. Screen-Space Diegetic Overlays (HUD, Round Timer, VR Telemetry, Combat AI)
    if (this.currentMode === 'REFLEX') {
      const oppName = this.boxer3D.characterType === 'human' ? 'SHANE FAZEN (SPARRING)' : 'TITAN CYBERBOT';
      this.gameState.renderHUD(this.ctx, width, height, oppName);
      this.combatAI.renderHUD(this.ctx, width, height);
    }
    this.vrCamera.renderVRHUD(this.ctx, width, height);

    this.ctx.restore(); // Restore from Shake

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Renders Picture-in-Picture (PIP) Webcam Window in the Bottom Left Corner
   * Displays the player's mirrored video stream, skeletal overlay, 21-joint hand tracking,
   * chin guard telemetry, and Spider-Man recentering guides within an arcade broadcast frame.
   */
  renderPIPCameraWindow(ctx, video, landmarks, handData, evaluation, defense, screenWidth, screenHeight) {
    if (!video || video.readyState < 2) return;

    // Dimensions: positioned in bottom-left corner
    const pipW = Math.max(220, Math.min(290, screenWidth * 0.22));
    const pipH = pipW * 0.65; // ~143px - 188px (16:10 aspect ratio)
    const pipX = 24;
    const pipY = screenHeight - pipH - 24;

    ctx.save();

    // 1. Sleek Frosted Background Chassis & Deep Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#080d1a';
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Mirrored Webcam Video Clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pipX + 2, pipY + 2, pipW - 4, pipH - 4, 9);
    ctx.clip();

    // Draw mirrored video stream inside PIP box
    ctx.save();
    ctx.translate(pipX + pipW, pipY);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, pipW, pipH);

    // Subtle dark athletic tint for high contrast skeleton visibility
    ctx.fillStyle = 'rgba(6, 12, 22, 0.25)';
    ctx.fillRect(0, 0, pipW, pipH);
    ctx.restore();

    // 3. Render Player Skeleton Inside PIP Window
    if (landmarks) {
      ctx.save();
      ctx.translate(pipX, pipY);
      this.skeletonRenderer.render(ctx, landmarks, evaluation, pipW, pipH);
      ctx.restore();
    }

    // 4. Render 21-Joint Precision Hand Tracking Inside PIP Window
    if (handData) {
      this.renderHandJointsInPip(ctx, handData, pipX, pipY, pipW, pipH);
    }

    // 5. Center Guideline inside PIP
    const centerNormX = this.defenseDetector.baselineHead ? this.defenseDetector.baselineHead.x : 0.5;
    const guideX = pipX + centerNormX * pipW;
    ctx.strokeStyle = this.defenseDetector.isLocked ? 'rgba(0, 243, 255, 0.40)' : 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(guideX, pipY + 22);
    ctx.lineTo(guideX, pipY + pipH - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore(); // Exit clip

    // 6. Bezel Frame & Corner Brackets
    ctx.strokeStyle = this.defenseDetector.isLocked ? '#00f3ff' : 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 10);
    ctx.stroke();

    // Corner Ticks (Golden Accents)
    const bLen = 12;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(pipX - 1, pipY + bLen); ctx.lineTo(pipX - 1, pipY - 1); ctx.lineTo(pipX + bLen, pipY - 1); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(pipX + pipW - bLen, pipY - 1); ctx.lineTo(pipX + pipW + 1, pipY - 1); ctx.lineTo(pipX + pipW + 1, pipY + bLen); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(pipX - 1, pipY + pipH - bLen); ctx.lineTo(pipX - 1, pipY + pipH + 1); ctx.lineTo(pipX + bLen, pipY + pipH + 1); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(pipX + pipW - bLen, pipY + pipH + 1); ctx.lineTo(pipX + pipW + 1, pipY + pipH + 1); ctx.lineTo(pipX + pipW + 1, pipY + bLen); ctx.stroke();

    // 7. Header Bar: LIVE CAM & Chin Guard Pill
    ctx.fillStyle = 'rgba(8, 14, 24, 0.88)';
    ctx.fillRect(pipX + 2, pipY + 2, pipW - 4, 20);

    const blink = Math.sin(performance.now() * 0.006) > 0;
    ctx.fillStyle = blink ? '#ff2244' : '#881122';
    ctx.beginPath();
    ctx.arc(pipX + 12, pipY + 12, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '800 9px "Russo One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE CAM • 21-JOINT HANDS', pipX + 20, pipY + 15);

    const isGuardOk = evaluation?.guard?.intact ?? true;
    ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = isGuardOk ? '#00ff88' : '#ff3366';
    ctx.fillText(isGuardOk ? '🛡️ CHIN: OK' : '⚠️ CHIN: EXPOSED', pipX + pipW - 8, pipY + 15);

    // 8. Footer Bar: Defense Action & Spider-Man Cue
    ctx.fillStyle = 'rgba(8, 14, 24, 0.88)';
    ctx.fillRect(pipX + 2, pipY + pipH - 18, pipW - 4, 16);

    ctx.font = '800 8px "Russo One", sans-serif';
    ctx.textAlign = 'left';
    const defText = defense?.action !== 'NONE' ? `EVASION: ${defense.action}` : 'STANCE: NEUTRAL';
    ctx.fillStyle = defense?.action !== 'NONE' ? '#00f3ff' : '#94a3b8';
    ctx.fillText(defText, pipX + 8, pipY + pipH - 7);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.fillText('PIP SKELETON', pipX + pipW - 8, pipY + pipH - 7);

    ctx.restore();
  }

  /**
   * Renders the 21-joint hand skeleton overlay inside the PIP camera window
   */
  renderHandJointsInPip(ctx, handData, pipX, pipY, pipW, pipH) {
    const fingerChains = [
      [0, 1, 2, 3, 4],       // Thumb
      [0, 5, 6, 7, 8],       // Index
      [0, 9, 10, 11, 12],    // Middle
      [0, 13, 14, 15, 16],   // Ring
      [0, 17, 18, 19, 20]    // Pinky
    ];

    [handData.left, handData.right].forEach(hand => {
      if (!hand || !hand.landmarks) return;

      const lm = hand.landmarks;
      ctx.save();

      // Finger Bones
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.75)';

      fingerChains.forEach(chain => {
        ctx.beginPath();
        for (let i = 0; i < chain.length; i++) {
          const pt = lm[chain[i]];
          const px = pipX + pt.x * pipW;
          const py = pipY + pt.y * pipH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });

      // Palm transverse connection (knuckles)
      ctx.beginPath();
      [5, 9, 13, 17, 0].forEach((idx, i) => {
        const pt = lm[idx];
        const px = pipX + pt.x * pipW;
        const py = pipY + pt.y * pipH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Joint Nodes (All 21 joints!)
      lm.forEach((pt, idx) => {
        const px = pipX + pt.x * pipW;
        const py = pipY + pt.y * pipH;
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isTip ? 2.8 : 1.8;

        ctx.fillStyle = isTip ? '#ffffff' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });
  }

  // ==========================================
  // MODE 1: FORM COACH
  // ==========================================
  runFormMode(landmarks, evaluation, width, height, timestamp) {
    if (landmarks) {
      this.skeletonRenderer.render(this.ctx, landmarks, evaluation, width, height);
    }

    // Render Player Translucent Boxing Gloves
    this.playerGloves.render(this.ctx, width, height);

    if (evaluation.punchEvent) {
      const punch = evaluation.punchEvent;
      const wx = punch.wristPos.x * width;
      const wy = punch.wristPos.y * height;

      this.audio.playImpact(punch.score >= 80);
      this.fx.emitHitSpark(wx, wy, punch.grade);

      const badgeColor = punch.score >= 90 ? '#00f3ff' : punch.score >= 70 ? '#00ff88' : '#ffc700';
      this.fx.addFloatingBadge(`${punch.grade} ${punch.type}!`, wx, wy - 30, badgeColor, 26);

      if (punch.speedKmh > 0) {
        this.fx.addFloatingBadge(`${punch.speedKmh} KM/H`, wx, wy + 12, '#ffffff', 14);
      }

      if (punch.score >= 90) {
        this.audio.speakAnnouncer('PERFECT!');
      } else if (punch.flaws.length > 0) {
        const topFlaw = punch.flaws[0];
        if (topFlaw.includes('DROPPED')) {
          this.audio.speakAnnouncer('KEEP GUARD UP!');
        } else if (topFlaw.includes('CHICKEN WING')) {
          this.audio.speakAnnouncer('TUCK ELBOWS!');
        } else if (topFlaw.includes('HIP')) {
          this.audio.speakAnnouncer('ROTATE HIPS!');
        }
      }
    }

    this.updateFormDOM(evaluation);
    this.updateStatsDOM();
  }

  // ==========================================
  // MODE 2: REFLEX ARCADE BATTLE (HIGH SPEED)
  // ==========================================
  runReflexMode(landmarks, evaluation, defense, handData, width, height, timestamp, dt) {
    this.gameState.update(timestamp, dt);
    const vrOffsets = {
      camX: this.vrCamera.camX,
      camY: this.vrCamera.camY,
      camZ: (this.vrCamera.camZ - 1.0),
      roll: this.vrCamera.roll
    };

    // Update 3D Boxer, 3D Boxing Ring, and 3D Translucent Boxing Gloves with 6-DOF Hand Orientation!
    this.boxer3D.update(timestamp, dt, vrOffsets, handData, landmarks, evaluation, width, height);

    // Couple Perspective 3D Camera with 6-DOF VR Head-Tracking!
    this.boxer3D.render(vrOffsets);

    // 1. Draw 3D Boxer, 3D Boxing Ring, Overhead Spotlights, and 3D Boxing Gloves onto the canvas
    this.ctx.drawImage(this.boxer3D.canvas, 0, 0, width, height);

    // 2. Render Dynamic Holographic Targeting Reticle on screen tracking where the bot hits
    this.boxer3D.renderTargetingHUD(this.ctx, width, height);

    // 3. Render Picture-in-Picture Webcam Monitor in the Bottom Left Corner (with 21-joint hand skeleton)
    this.renderPIPCameraWindow(this.ctx, this.video, landmarks, handData, evaluation, defense, width, height);

    // Feed real-time player biomechanical telemetry into Combat AI brain
    if (defense) {
      this.combatAI.recordPlayerTelemetry(defense, evaluation, timestamp);
    }

    // Match Over Check
    if (this.gameState.isMatchOver) {
      const modal = document.getElementById('match-over-modal');
      const badge = document.getElementById('match-badge');
      const title = document.getElementById('match-result-title');
      const sub = document.getElementById('match-result-sub');
      const statPunches = document.getElementById('m-stat-punches');
      const statCounters = document.getElementById('m-stat-counters');
      const statScore = document.getElementById('m-stat-score');

      if (modal && modal.style.display !== 'flex') {
        modal.style.display = 'flex';

        if (this.gameState.winner === 'PLAYER') {
          if (badge) { badge.textContent = 'KNOCKOUT VICTORY'; badge.style.color = '#ffd700'; }
          if (title) title.textContent = '🏆 CHAMPION!';
          if (sub) sub.textContent = 'YOU KNOCKED OUT THE OPPONENT!';
          this.audio.playVictoryTune();
          this.audio.speakAnnouncer('KNOCKOUT! YOU WIN!');
          this.fx.triggerVictoryConfetti();
          this.boxer3D.knockout();
        } else {
          if (badge) { badge.textContent = 'TKO DEFEAT'; badge.style.color = '#ff3366'; }
          if (title) title.textContent = '💥 KNOCKED OUT!';
          if (sub) sub.textContent = 'DUST YOURSELF OFF AND RETRY!';
          this.audio.speakAnnouncer('KNOCKOUT! TRY AGAIN!');
        }

        if (statPunches) statPunches.textContent = this.formChecker.stats.totalPunches;
        if (statCounters) statCounters.textContent = this.combatAI.profiler.playerCounterStrikes;
        if (statScore) statScore.textContent = this.gameState.score;
      }
      return;
    }

    // Smart CPU Bot Combat Decision (Combos, Feints, and Adaptive Punishes)
    if (this.boxer3D.state === 'IDLE' && timestamp > this.opponentAttackCooldown) {
      const decision = this.combatAI.decideNextAction(timestamp);

      if (decision.type === 'COMBO' && decision.combo) {
        this.boxer3D.startCombo(decision.combo, decision.speedMultiplier);
        this.audio.playWarningBeep();
        this.opponentAttackCooldown = timestamp + decision.windupMs + 520;
      } else {
        this.boxer3D.startAttack(decision.attackId, decision.windupMs);
        this.audio.playWarningBeep();
        this.opponentAttackCooldown = timestamp + decision.windupMs + 450;
      }
    }

    // Check Player Evasion during Strike Frame (Single Strikes & Multi-Strike Combos)
    const isStrikeActive = (this.boxer3D.state === 'STRIKING' || this.boxer3D.state === 'COMBO_STRIKING');

    if (isStrikeActive && !this.boxer3D.stepEvaluated) {
      const req = this.boxer3D.requiredDefense;
      const isFeint = this.boxer3D.activeStepDef?.isFeint || false;
      let evaded = false;

      if (isFeint) {
        // Feint tests player discipline without dealing damage
        evaded = true;
        this.boxer3D.recordComboStepEvaded(true);
        this.audio.playWhoosh(1.4);
      } else {
        if (req === 'SLIP_RIGHT' && (defense.slipRight || defense.action === 'SLIP_RIGHT')) {
          evaded = true;
        } else if (req === 'SLIP_LEFT' && (defense.slipLeft || defense.action === 'SLIP_LEFT')) {
          evaded = true;
        } else if (req === 'DUCK' && (defense.ducking || defense.action === 'DUCK')) {
          evaded = true;
        } else if (req === 'HIGH_GUARD_BLOCK' && (defense.blocking || defense.action === 'HIGH_GUARD_BLOCK')) {
          evaded = true;
        } else if (defense.blocking) {
          evaded = true;
        }

        const hit = this.boxer3D.hitTelemetry;
        const hx = hit.screenPos.x;
        const hy = hit.screenPos.y;

        if (this.boxer3D.activeCombo) {
          // --- MULTI-STRIKE COMBINATION BRANCH ---
          const stepIdx = this.boxer3D.comboStepIndex;
          const totalSteps = this.boxer3D.comboTotalSteps;
          const stepDmg = this.boxer3D.activeStepDef?.damage || 140;

          if (evaded) {
            this.boxer3D.recordComboStepEvaded(true);
            this.audio.playWhoosh(1.2);
            this.audio.playBlock();
            this.fx.emitHitSpark(hx, hy, 'PERFECT');
            this.gameState.addSuper(12);

            const isLastStep = stepIdx >= totalSteps - 1;
            if (isLastStep && this.boxer3D.comboFullyEvaded) {
              // Mastered the combination: full evasion!
              const superBonus = this.boxer3D.activeCombo.superBonus || 40;
              this.gameState.addSuper(superBonus);
              this.audio.speakAnnouncer('COMBO DENIED!');
              this.fx.addFloatingBadge('🔥 FULL COMBO EVADED! MASSIVE PUNISH! 🔥', hx, hy - 45, '#ffc700', 32);
              this.combatAI.onPlayerEvaded(true, true);
            } else {
              this.fx.addFloatingBadge(`⚡ EVADED [${stepIdx + 1}/${totalSteps}]! ⚡`, hx, hy - 30, '#00ff88', 24);
              this.combatAI.onPlayerEvaded(true, false);
            }
          } else {
            // Player got clipped during combo
            this.boxer3D.recordComboStepEvaded(false);
            this.audio.playImpact(true);
            this.gameState.damagePlayer(stepDmg);
            this.fx.addTrauma(0.45);
            this.fx.emitHitSpark(hx, hy, 'BAD');
            this.fx.addFloatingBadge(`💥 CLIPPED! [${stepIdx + 1}/${totalSteps}] 💥`, hx, hy, '#ff3366', 28);
            this.combatAI.onHitLanded(true, stepDmg);
          }
        } else {
          // --- SINGLE STRIKE BRANCH ---
          this.boxer3D.stepEvaluated = true;
          if (evaded) {
            this.audio.playWhoosh(1.2);
            this.audio.playBlock();
            this.fx.emitHitSpark(hx, hy, 'PERFECT');
            this.fx.addFloatingBadge('⚡ SLIPPED! COUNTER NOW! ⚡', hx, hy - 30, '#00ff88', 26);
            this.gameState.addSuper(15);
            this.boxer3D.openOpeningWindow(timestamp);
            this.combatAI.onPlayerEvaded(false, false);
          } else {
            this.audio.playImpact(true);
            this.gameState.damagePlayer(55);
            this.fx.addTrauma(0.5);
            this.fx.emitHitSpark(hx, hy, 'BAD');
            this.fx.addFloatingBadge('💥 HIT! (-55 HP) 💥', hx, hy, '#ff3366', 30);
            this.boxer3D.state = 'RECOVERING';
            this.boxer3D.stateTimer = timestamp;
            this.combatAI.onHitLanded(false, 55);
          }
        }
      }
    }

    // Player Punch Tracking (Punish Counters during Openings vs Intelligent Dynamic Bot Defense in Neutral)
    if (evaluation.punchEvent) {
      const punch = evaluation.punchEvent;
      const wx = punch.wristPos.x * width;
      const wy = punch.wristPos.y * height;
      const isVulnerable = (this.boxer3D.state === 'OPENING' || this.boxer3D.counterWindow);
      const isMassive = this.boxer3D.massiveCounter;

      if (isVulnerable) {
        // Realistic Boxing Punish Counter Damage (Balanced against 2500 Max HP)
        let baseDmg = 50;
        let announcerCall = 'COUNTER!';
        let badgeText = '⚡ COUNTER!';
        let badgeColor = '#ffc700';

        if (punch.type.includes('UPPERCUT')) {
          baseDmg = 135;
          announcerCall = 'UPPERCUT COUNTER!';
          badgeText = '⚡⚡ RISING UPPERCUT PUNISH! ⚡⚡';
          badgeColor = '#00ff88';
        } else if (punch.type.includes('HOOK')) {
          baseDmg = 105;
          announcerCall = 'HOOK PUNISH!';
          badgeText = '🔥 HOOK PUNISH! 🔥';
          badgeColor = '#ff0055';
        } else if (punch.type === 'CROSS') {
          baseDmg = 80;
          announcerCall = 'POWER CROSS!';
          badgeText = '💥 POWER CROSS! 💥';
          badgeColor = '#ffc700';
        } else {
          baseDmg = 50;
          announcerCall = 'STIFF JAB!';
          badgeText = '🥊 STIFF JAB COUNTER!';
          badgeColor = '#00f3ff';
        }

        const finalDmg = Math.round(baseDmg * (isMassive ? 1.30 : 1.0));
        this.audio.playImpact(true);
        this.audio.speakAnnouncer(announcerCall);
        this.hitstopTimer = timestamp + (isMassive ? 140 : 100);
        this.boxer3D.takeHit(finalDmg, punch.type);
        this.gameState.damageRival(finalDmg);
        this.gameState.addSuper(isMassive ? 18 : 12);
        this.fx.addTrauma(isMassive ? 0.70 : 0.50);
        this.fx.emitHitSpark(wx, wy, 'PERFECT');
        this.fx.addFloatingBadge(`${badgeText} (+${finalDmg} DMG)`, wx, wy - 35, badgeColor, 32);
        this.combatAI.profiler.playerCounterStrikes++;
      } else {
        // --- NEUTRAL EXCHANGE: INTELLIGENT BOT DEFENSE & ANTI-FLURRY MECHANICS ---
        const diff = this.combatAI.difficulty || 'PRO';
        // Defense probabilities aligned to user request:
        // ROOKIE = 65% (Medium level, like old champion)
        // PRO = 88% (Tougher, blocks and slips active flurries)
        // CHAMPION = 98% (One step ahead: masterclass anticipation & counters)
        const defenseProb = (diff === 'ROOKIE') ? 0.65 : (diff === 'CHAMPION') ? 0.98 : 0.88;

        // 1. If bot is ALREADY in DEFENDING state (High Guard or Slipping/Ducking):
        if (this.boxer3D.state === 'DEFENDING') {
          this.playerSpamFlurryCount = (this.playerSpamFlurryCount || 0) + 1;

          if (this.boxer3D.defenseType === 'BLOCK') {
            // High Guard stays locked and absorbs subsequent spam punches
            this.audio.playBlock();
            this.gameState.damageRival(8);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('🛡️ FLURRY BLOCKED! (+8 CHIP)', wx, wy - 25, '#94a3b8', 22);

            // Extend high guard duration so it stays up throughout the player's flurry
            this.boxer3D.defenseDuration = Math.min(700, this.boxer3D.defenseDuration + 150);

            // Anti-Spam Flurry Counter: If player throws 2 or more rapid punches into guard
            if (this.playerSpamFlurryCount >= 2 && diff !== 'ROOKIE') {
              const counterProb = (diff === 'CHAMPION') ? 0.95 : 0.70;
              if (Math.random() < counterProb && !this.gameState.isMatchOver) {
                this.playerSpamFlurryCount = 0;
                this.audio.playWhoosh(1.4);
                this.boxer3D.startAttack(diff === 'CHAMPION' ? 'RIGHT_CROSS' : 'LEFT_HOOK', 280);
                this.fx.addFloatingBadge('⚡ FLURRY PARRIED! BOT COUNTERS!', wx, wy - 40, '#ff0055', 30);
              }
            }
          } else {
            // Bot is ducking or slipping off centerline: flurry punch misses cleanly
            this.audio.playWhoosh(1.4);
            this.fx.addFloatingBadge('💨 FLURRY EVADED! (MISSED)', wx, wy - 30, '#00ff88', 26);

            if (this.playerSpamFlurryCount >= 2 && diff !== 'ROOKIE') {
              this.playerSpamFlurryCount = 0;
              this.boxer3D.startAttack('UPPERCUT', 290);
              this.fx.addFloatingBadge('⚡ SLIP & RIP COUNTER!', wx, wy - 40, '#ff0055', 30);
            }
          }
        }
        // 2. If bot is in HURT recoil and player tries to spam/stun-lock:
        else if (this.boxer3D.state === 'HURT') {
          if (diff === 'CHAMPION' || (diff === 'PRO' && Math.random() < 0.85)) {
            // Pro & Champion recover tight guard immediately to prevent spam stun-locks
            this.boxer3D.defend('BLOCK');
            this.audio.playBlock();
            this.gameState.damageRival(8);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('🛡️ GUARD RECOVERED!', wx, wy - 25, '#38bdf8', 22);
          } else {
            // Rookie can take a follow-up hit
            this.audio.playImpact(false);
            this.boxer3D.takeHit(35, punch.type);
            this.gameState.damageRival(35);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('💥 COMBO CLIP! (+35 DMG)', wx, wy - 30, '#ffaa00', 26);
          }
        }
        // 3. Bot is in IDLE / Neutral:
        else {
          this.playerSpamFlurryCount = 0;
          const roll = Math.random();

          if (roll < defenseProb) {
            let defenseType = 'BLOCK';
            const pType = punch.type || 'JAB';

            if (pType.includes('HOOK')) {
              defenseType = Math.random() < (diff === 'CHAMPION' ? 0.75 : 0.60) ? 'DUCK' : 'BLOCK';
            } else if (pType === 'CROSS' || pType === 'RIGHT_CROSS') {
              defenseType = Math.random() < (diff === 'CHAMPION' ? 0.70 : 0.55) ? 'SLIP_RIGHT' : 'BLOCK';
            } else if (pType === 'JAB' || pType === 'LEFT_JAB') {
              defenseType = Math.random() < (diff === 'CHAMPION' ? 0.70 : 0.55) ? 'SLIP_LEFT' : 'BLOCK';
            } else if (pType.includes('UPPERCUT')) {
              defenseType = Math.random() < 0.50 ? 'SLIP_RIGHT' : Math.random() < 0.5 ? 'SLIP_LEFT' : 'BLOCK';
            }

            this.boxer3D.defend(defenseType);

            if (defenseType === 'DUCK') {
              this.audio.playWhoosh(1.5);
              this.fx.addFloatingBadge('💨 BOT DUCKED UNDER! (MISSED)', wx, wy - 35, '#00ff88', 26);
              if (diff !== 'ROOKIE' && Math.random() < (diff === 'CHAMPION' ? 0.80 : 0.50)) {
                setTimeout(() => {
                  if (this.boxer3D.state === 'IDLE' && !this.gameState.isMatchOver) {
                    this.boxer3D.startAttack('UPPERCUT', 320);
                    this.audio.playWarningBeep();
                  }
                }, 420);
              }
            } else if (defenseType === 'SLIP_LEFT' || defenseType === 'SLIP_RIGHT') {
              this.audio.playWhoosh(1.4);
              const dir = (defenseType === 'SLIP_LEFT') ? 'LEFT' : 'RIGHT';
              this.fx.addFloatingBadge(`⚡ BOT SLIPPED ${dir}! (MISSED)`, wx, wy - 35, '#00f3ff', 26);
              if (diff !== 'ROOKIE' && Math.random() < (diff === 'CHAMPION' ? 0.75 : 0.45)) {
                setTimeout(() => {
                  if (this.boxer3D.state === 'IDLE' && !this.gameState.isMatchOver) {
                    this.boxer3D.startAttack('RIGHT_CROSS', 300);
                    this.audio.playWarningBeep();
                  }
                }, 390);
              }
            } else {
              // High Guard Block
              this.audio.playBlock();
              this.gameState.damageRival(10);
              this.fx.emitHitSpark(wx, wy, 'GOOD');
              this.fx.addFloatingBadge('🛡️ BOT BLOCKED! (+10 CHIP)', wx, wy - 25, '#94a3b8', 22);
            }
          } else {
            // Bot caught flat-footed in neutral (primarily on Rookie):
            this.audio.playImpact(false);
            this.boxer3D.takeHit(35, punch.type);
            this.gameState.damageRival(35);
            this.gameState.addSuper(6);
            this.fx.emitHitSpark(wx, wy, 'PERFECT');
            this.fx.addFloatingBadge(`💥 CLEAN HIT! (+35 DMG)`, wx, wy - 30, '#ffc700', 28);
          }
        }
      }
    }

    this.updateStatsDOM();
  }

  updateFormDOM(evaluation) {
    const scoreVal = document.getElementById('form-score-val');
    const meterFill = document.getElementById('meter-fill');
    const guardStatus = document.getElementById('guard-status-val');
    const guardCard = document.getElementById('guard-status-card');
    const balanceStatus = document.getElementById('balance-status-val');
    const balanceCard = document.getElementById('balance-status-card');

    if (scoreVal) scoreVal.textContent = `${this.formChecker.stats.averageScore}%`;
    if (meterFill) meterFill.style.width = `${this.formChecker.stats.averageScore}%`;

    if (guardStatus && guardCard) {
      const isGuardOk = evaluation.guard && evaluation.guard.intact;
      guardStatus.textContent = isGuardOk ? 'PROTECTED' : 'EXPOSED';
      guardStatus.style.color = isGuardOk ? '#00ff88' : '#ff3366';
      guardCard.className = isGuardOk ? 'status-card' : 'status-card warning';
    }

    if (balanceStatus && balanceCard) {
      const isBalanced = evaluation.balance && evaluation.balance.isBalanced;
      balanceStatus.textContent = isBalanced ? 'CENTERED' : 'OFF BALANCE';
      balanceStatus.style.color = isBalanced ? '#00ff88' : '#ffc700';
      balanceCard.className = isBalanced ? 'status-card' : 'status-card warning';
    }
  }

  updateStatsDOM() {
    const totalEl = document.getElementById('stat-total-punches');
    const jabsEl = document.getElementById('stat-jabs');
    const crossesEl = document.getElementById('stat-crosses');
    const hooksEl = document.getElementById('stat-hooks');
    const uppersEl = document.getElementById('stat-uppers');

    if (totalEl) totalEl.textContent = this.formChecker.stats.totalPunches;
    if (jabsEl) jabsEl.textContent = this.formChecker.stats.jabs;
    if (crossesEl) crossesEl.textContent = this.formChecker.stats.crosses;
    if (hooksEl) hooksEl.textContent = this.formChecker.stats.hooks;
    if (uppersEl) uppersEl.textContent = this.formChecker.stats.uppercuts;
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.reflexApp = window.shadowBoxingApp = new ShadowBoxingApp();
});
