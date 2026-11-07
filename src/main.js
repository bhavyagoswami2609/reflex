import { ArcadeAudioEngine } from './audio/soundEffects.js';
import { FormChecker } from './biomechanics/formChecker.js';
import { DefenseDetector } from './biomechanics/defenseDetector.js';
import { SkeletonRenderer } from './render/skeletonRenderer.js';
import { FXRenderer } from './render/fxRenderer.js';
import { Boxer3DScene } from './game/boxer3DAnimator.js';
import { GameState, toRoman } from './game/gameState.js';
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

    // Mode: 'REFLEX' | 'FORM' (Reflex Sparring default)
    this.currentMode = 'REFLEX';

    // State & Tracking
    this.poseLandmarks = null;
    this.firstFrameProcessed = false;
    this.lastFrameTime = performance.now();
    this.isRunning = false;
    this.isPaused = false;
    this.opponentAttackCooldown = performance.now() + 1200;
    this.hitstopTimer = 0; // Freeze frame hitstop effect

    this.initDOM();
  }

  initDOM() {
    // 1. Header Recenter Action
    const recenterBtn = document.getElementById('btn-recenter');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => this.handleRecenter());
    }

    // 2. Header Audio Action
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? 'AUDIO: MUTED' : 'AUDIO';
      });
    }

    // 3. Header Menu Toggle Action
    const menuToggleBtn = document.getElementById('btn-menu-toggle');
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener('click', () => this.toggleMenu());
    }

    // 4. Menu Overlay: Discipline Selector Pills
    const disciplinePills = document.querySelectorAll('#discipline-selector .menu-pill');
    disciplinePills.forEach(pill => {
      pill.addEventListener('click', () => {
        disciplinePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.dataset.discipline;
        this.setMode(mode);
      });
    });

    // 5. Menu Overlay: Opponent Selector Pills
    const opponentPills = document.querySelectorAll('#opponent-selector .menu-pill');
    opponentPills.forEach(pill => {
      pill.addEventListener('click', () => {
        opponentPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const opp = pill.dataset.opponent;
        this.boxer3D.setCharacterType(opp);
      });
    });

    // 6. Menu Overlay: Rigor (Difficulty) Selector Stacked Buttons
    const rigorBtns = document.querySelectorAll('#rigor-selector .menu-stack-btn');
    rigorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rigorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const rigor = btn.dataset.rigor;
        this.combatAI.setDifficulty(rigor);
        const animDiff = (rigor === 'NOVICE') ? 'ROOKIE' : (rigor === 'CHAMPION') ? 'CHAMPION' : 'PRO';
        this.boxer3D.setDifficulty(animDiff);
      });
    });

    // 7. Menu Overlay: Glove Finish Selector Swatches
    const gloveSwatches = document.querySelectorAll('#glove-finish-selector .glove-swatch');
    gloveSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        gloveSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const finish = swatch.dataset.glove;
        if (finish === 'OFF') {
          if (this.boxer3D.playerGloves3D) this.boxer3D.playerGloves3D.enabled = false;
          if (this.playerGloves) this.playerGloves.enabled = false;
        } else {
          if (this.boxer3D.playerGloves3D) {
            this.boxer3D.playerGloves3D.enabled = true;
            this.boxer3D.setGloveTheme(finish);
          }
          if (this.playerGloves) {
            this.playerGloves.enabled = true;
            this.playerGloves.setTheme(finish);
          }
        }
      });
    });

    // 8. Menu Overlay: Round Count Selector
    const roundBtns = document.querySelectorAll('#rounds-selector .segment-btn');
    roundBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        roundBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const rounds = parseInt(btn.dataset.rounds, 10);
        this.gameState.maxRounds = rounds;
        this.updateHeaderDisciplineTitle();
      });
    });

    // 9. Menu Overlay: Round Duration Selector
    const durationBtns = document.querySelectorAll('#duration-selector .segment-btn');
    durationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        durationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const duration = parseInt(btn.dataset.duration, 10);
        this.gameState.roundDuration = duration;
        this.gameState.roundTime = duration;
      });
    });

    // 10. Menu Overlay: Action Buttons (Enter Arena & Resume Session)
    const enterArenaBtn = document.getElementById('btn-enter-arena');
    if (enterArenaBtn) {
      enterArenaBtn.addEventListener('click', () => this.enterArena());
    }

    const resumeSessionBtn = document.getElementById('btn-resume-session');
    if (resumeSessionBtn) {
      resumeSessionBtn.addEventListener('click', () => this.resumeSession());
    }

    // 9. Post-Round Performance Analysis Screen Actions
    const nextRoundBtn = document.getElementById('btn-next-round');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => this.beginNextRound());
    }

    const summaryToMenuBtn = document.getElementById('btn-summary-to-menu');
    if (summaryToMenuBtn) {
      summaryToMenuBtn.addEventListener('click', () => this.openMenuFromSummary());
    }

    // Background accessibility key listener (no UI text instructions attached)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        this.handleRecenter();
      } else if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        const modal = document.getElementById('match-over-modal');
        if (modal && modal.style.display !== 'none' && this.gameState.isMatchOver) {
          e.preventDefault();
          this.beginNextRound();
        }
      }
    });

    // Initialize 3D Boxer WebGL Scene
    const viewportStage = document.querySelector('.viewport-stage');
    if (viewportStage) {
      this.boxer3D.init(viewportStage);
      this.boxer3D.setVisible(true);
      // Default to Gilded Amber gloves
      if (this.boxer3D.playerGloves3D) {
        this.boxer3D.setGloveTheme('GOLD');
      }
      if (this.playerGloves) {
        this.playerGloves.setTheme('GOLD');
      }
    }

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    // Default mode: Reflex Sparring
    this.setMode('REFLEX');
    this.updateHeaderDisciplineTitle();

    // Open Academy Menu Hub on initial load so player configures their session
    this.openMenu();
  }

  handleRecenter() {
    if (this.lastMirroredLandmarks) {
      const ok = this.defenseDetector.recenter(this.lastMirroredLandmarks);
      this.vrCamera.recenter(this.lastMirroredLandmarks);
      if (ok) {
        this.audio.playWebRecenterChime();
        const pipW = Math.max(200, Math.min(270, window.innerWidth * 0.20));
        const pipH = pipW * 0.65;
        const targetX = 28 + 95;
        const targetY = window.innerHeight - pipH - 28 - 44 - 24;
        this.fx.addFloatingBadge('STANCE ALIGNED', targetX, targetY, '#d4a03c', 20);
      }
    }
  }

  openMenu() {
    const menu = document.getElementById('menu-overlay');
    const resumeBtn = document.getElementById('btn-resume-session');
    if (menu) menu.style.display = 'flex';
    if (resumeBtn) {
      resumeBtn.style.display = this.isRunning ? 'inline-block' : 'none';
    }
    this.isPaused = true;
  }

  closeMenu() {
    const menu = document.getElementById('menu-overlay');
    if (menu) menu.style.display = 'none';
    this.isPaused = false;
  }

  toggleMenu() {
    const menu = document.getElementById('menu-overlay');
    if (menu && menu.style.display !== 'none') {
      this.resumeSession();
    } else {
      this.openMenu();
    }
  }

  showTrackingLoader(statusText = 'CONNECTING OPTICAL SENSORS...') {
    const loader = document.getElementById('tracking-loader');
    const statusEl = document.getElementById('tracking-loader-status');
    if (statusEl) statusEl.textContent = statusText;
    if (loader) {
      loader.style.display = 'flex';
      loader.offsetHeight; // Force reflow
      loader.classList.add('active');
    }
  }

  updateTrackingLoader(statusText) {
    const statusEl = document.getElementById('tracking-loader-status');
    if (statusEl) statusEl.textContent = statusText;
  }

  hideTrackingLoader() {
    const loader = document.getElementById('tracking-loader');
    if (loader) {
      loader.classList.remove('active');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 350);
    }
  }

  async enterArena() {
    this.closeMenu();
    if (!this.isRunning) {
      this.showTrackingLoader('ACCESSING OPTICAL CAMERA...');
      await this.startCamera((status) => this.updateTrackingLoader(status));
      this.updateTrackingLoader('CALIBRATION LOCKED');
      await new Promise(r => setTimeout(r, 350));
      this.hideTrackingLoader();
    }
    this.gameState.round = 1;
    this.retryMatch();
    this.updateHeaderDisciplineTitle();
  }

  resumeSession() {
    this.closeMenu();
    this.isPaused = false;
    this.gameState.roundTimer = performance.now();
  }

  beginNextRound() {
    const modal = document.getElementById('match-over-modal');
    if (modal) modal.style.display = 'none';

    // If match was fully concluded by knockout or reaching final round
    const isKO = this.gameState.playerHp <= 0 || this.gameState.rivalHp <= 0;
    const isFinalRound = this.gameState.maxRounds > 0 && this.gameState.round >= this.gameState.maxRounds;

    if (isKO || isFinalRound) {
      this.gameState.round = 1;
      this.retryMatch();
      this.updateHeaderDisciplineTitle();
      return;
    }

    this.gameState.round += 1;
    this.gameState.playerHp = this.gameState.playerMaxHp;
    this.gameState.playerGhostHp = this.gameState.playerMaxHp;
    this.gameState.rivalHp = this.gameState.rivalMaxHp;
    this.gameState.rivalGhostHp = this.gameState.rivalMaxHp;
    this.gameState.roundTime = this.gameState.roundDuration;
    this.gameState.roundTimer = performance.now();
    this.gameState.isMatchOver = false;
    this.gameState.winner = null;
    this.gameState.comboCount = 0;
    this.gameState.comboMultiplier = 1.0;

    this.boxer3D.reset();
    this.combatAI.reset();
    this.formChecker.resetStats();
    this.defenseDetector.reset();
    this.opponentAttackCooldown = performance.now() + 1000;
    this.isPaused = false;

    const romanRound = toRoman(this.gameState.round);
    this.audio.playBell();
    this.showSplashModal(`ROUND ${romanRound}`, 'COMMENCE');
    this.updateHeaderDisciplineTitle();
  }

  openMenuFromSummary() {
    const modal = document.getElementById('match-over-modal');
    if (modal) modal.style.display = 'none';
    this.openMenu();
  }

  updateHeaderDisciplineTitle() {
    const titleEl = document.getElementById('header-discipline-title');
    if (!titleEl) return;
    if (this.currentMode === 'REFLEX') {
      const roundStr = this.gameState.maxRounds > 0
        ? `ROUND ${toRoman(this.gameState.round)} OF ${toRoman(this.gameState.maxRounds)}`
        : `ROUND ${toRoman(this.gameState.round)}`;
      titleEl.textContent = `REFLEX SPARRING — ${roundStr}`;
    } else {
      titleEl.textContent = 'FORM COACH — KINEMATIC MASTERY';
    }
  }

  /**
   * Resets and restarts the round immediately without a page reload
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
    this.isPaused = false;

    const romanRound = toRoman(this.gameState.round);
    this.audio.playBell();
    this.showSplashModal(`ROUND ${romanRound}`, 'COMMENCE');
    this.updateHeaderDisciplineTitle();
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
    this.updateHeaderDisciplineTitle();

    if (mode === 'REFLEX') {
      this.opponentAttackCooldown = performance.now() + 1000;
      this.showSplashModal('REFLEX SPARRING', 'COMMENCE EXCHANGE');
    } else if (mode === 'FORM') {
      this.showSplashModal('FORM COACH', 'KINEMATIC MASTERY');
    }
  }

  updatePanelVisibility() {
    const instructionBanner = document.getElementById('instruction-banner');
    if (this.currentMode === 'FORM') {
      if (instructionBanner) {
        instructionBanner.style.display = 'block';
        instructionBanner.textContent = 'Camera tracking: punch, block, duck, roll physically to do so in game';
      }
    } else if (this.currentMode === 'REFLEX') {
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

  async startCamera(onStatus) {
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

      if (onStatus) onStatus('LOADING NEURAL VISION MODELS...');

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
          this.firstFrameProcessed = true;
        });

        // Initialize MediaPipe Hands (21-Joint Precision Hand Tracking) from CDN global
        if (window.Hands) {
          if (onStatus) onStatus('INITIALIZING 21-JOINT HAND KINEMATICS...');
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
          if (onStatus) onStatus('STARTING KINEMATIC STREAM...');
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

        // Await first frame / calibration
        if (onStatus) onStatus('CALIBRATING POSE & STANCE...');
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 3500); // 3.5s fallback so it never hangs if user is out of view
          const checkInterval = setInterval(() => {
            if (this.poseLandmarks || this.firstFrameProcessed) {
              clearTimeout(timeout);
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
        });
      }

      this.isRunning = true;
      requestAnimationFrame((t) => this.gameLoop(t));
    } catch (err) {
      console.error('Failed to initialize webcam / pose tracking:', err);
      this.hideTrackingLoader();
      alert('Camera access is required for skeletal tracking. Please allow camera permissions.');
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
      this.ctx.fillStyle = '#0a0907';
      this.ctx.fillRect(0, 0, width, height);
    } else {
      // FORM MODE: primary camera mirror with gym tint & depth ropes
      if (this.video && this.video.readyState >= 2) {
        this.ctx.save();
        this.ctx.translate(width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, 0, 0, width, height);
        this.ctx.fillStyle = 'rgba(10, 9, 7, 0.40)';
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = '#0a0907';
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

    // 6. Render Fight World
    if (this.currentMode === 'FORM') {
      this.runFormMode(mirroredLandmarks, evaluation, width, height, timestamp, handData);
    } else if (this.currentMode === 'REFLEX') {
      this.runReflexMode(mirroredLandmarks, evaluation, defense, handData, width, height, timestamp, dt);
    }

    // FX Particles & Badges in 3D Space
    this.fx.update(dt);
    this.fx.render(this.ctx);

    // 7. Screen-Space Diegetic Overlays (HUD, Round Timer, VR Telemetry)
    if (this.currentMode === 'REFLEX') {
      const oppName = this.boxer3D.characterType === 'human' ? 'SHANE FAZEN (SPARRING)' : 'TITAN AUTOMATON';
      this.gameState.renderHUD(this.ctx, width, height, oppName);
    }
    this.vrCamera.renderVRHUD(this.ctx, width, height);

    this.ctx.restore(); // Restore from Shake

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Renders Picture-in-Picture (PIP) Webcam Window in the Bottom Left Corner
   * Clean, minimalist framing with player skeleton & hand tracking overlay
   */
  renderPIPCameraWindow(ctx, video, landmarks, handData, evaluation, defense, screenWidth, screenHeight) {
    if (!video || video.readyState < 2) return;

    const pipW = Math.max(200, Math.min(270, screenWidth * 0.20));
    const pipH = pipW * 0.65;
    const pipX = 28;
    const pipY = screenHeight - pipH - 28;

    ctx.save();

    // 1. Sleek Drop Shadow & Dark Backdrop
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#0a0907';
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Clean Mirrored Webcam Video Clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 12);
    ctx.clip();

    ctx.save();
    ctx.translate(pipX + pipW, pipY);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, pipW, pipH);
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

    ctx.restore(); // Exit video clip

    // 5. Clean, Minimalist Border Frame
    ctx.strokeStyle = 'rgba(212, 160, 60, 0.40)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 12);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the 21-joint hand skeleton overlay inside the PIP camera window with gilded styling
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

      // Finger Bones (Gilded Gold)
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(212, 160, 60, 0.75)';

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

      // Joint Nodes (Ivory tips & Gold knuckles)
      lm.forEach((pt, idx) => {
        const px = pipX + pt.x * pipW;
        const py = pipY + pt.y * pipH;
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isTip ? 2.8 : 1.8;

        ctx.fillStyle = isTip ? '#f0ebe0' : '#d4a03c';
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

      const badgeColor = punch.score >= 90 ? '#eec05a' : punch.score >= 70 ? '#d4a03c' : '#9e3d2b';
      this.fx.addFloatingBadge(`${punch.grade} ${punch.type}`, wx, wy - 30, badgeColor, 26);

      if (punch.speedKmh > 0) {
        this.fx.addFloatingBadge(`${punch.speedKmh} KM/H`, wx, wy + 12, '#f0ebe0', 14);
      }

      // Audio SFX already handled via playImpact
    }
  }

  // ==========================================
  // MODE 2: REFLEX SPARRING
  // ==========================================
  runReflexMode(landmarks, evaluation, defense, handData, width, height, timestamp, dt) {
    if (this.isPaused) {
      this.gameState.roundTimer = timestamp;
      this.opponentAttackCooldown = timestamp + 1000;
    } else {
      this.gameState.update(timestamp, dt);
    }

    const vrOffsets = {
      camX: this.vrCamera.camX,
      camY: this.vrCamera.camY,
      camZ: (this.vrCamera.camZ - 1.0),
      roll: this.vrCamera.roll
    };

    // Update 3D Boxer, 3D Boxing Ring, and 3D Translucent Gloves
    this.boxer3D.update(timestamp, dt, vrOffsets, handData, landmarks, evaluation, width, height);

    // Couple Perspective 3D Camera with VR Head-Tracking
    this.boxer3D.render(vrOffsets);

    // 1. Draw 3D Boxer and Ring Scene
    this.ctx.drawImage(this.boxer3D.canvas, 0, 0, width, height);

    // 2. Render Dynamic Targeting Reticle
    this.boxer3D.renderTargetingHUD(this.ctx, width, height);

    // 3. Render Picture-in-Picture Webcam Monitor in Bottom Left Corner
    this.renderPIPCameraWindow(this.ctx, this.video, landmarks, handData, evaluation, defense, width, height);

    // Feed player biomechanical telemetry into Combat AI brain
    if (defense && !this.isPaused) {
      this.combatAI.recordPlayerTelemetry(defense, evaluation, timestamp);
    }

    // Unified Post-Round Performance Analysis Screen Check
    if (this.gameState.isMatchOver) {
      const modal = document.getElementById('match-over-modal');
      const badge = document.getElementById('match-badge');
      const title = document.getElementById('match-result-title');
      const sub = document.getElementById('match-result-sub');
      const statPunches = document.getElementById('m-stat-punches');
      const statCounters = document.getElementById('m-stat-counters');
      const statScore = document.getElementById('m-stat-score');

      // Breakdown Grid Elements
      const formAcc = document.getElementById('summary-form-accuracy');
      const meterFill = document.getElementById('summary-meter-fill');
      const guardStatus = document.getElementById('summary-guard-status');
      const balanceStatus = document.getElementById('summary-balance-status');

      const totalStrikes = document.getElementById('summary-total-strikes');
      const jabs = document.getElementById('summary-jabs');
      const crosses = document.getElementById('summary-crosses');
      const hooks = document.getElementById('summary-hooks');
      const uppers = document.getElementById('summary-uppers');

      if (modal && modal.style.display !== 'flex') {
        modal.style.display = 'flex';

        const isKO = this.gameState.playerHp <= 0 || this.gameState.rivalHp <= 0;
        const isFinalRound = this.gameState.maxRounds > 0 && this.gameState.round >= this.gameState.maxRounds;
        const isMatchFullyOver = isKO || isFinalRound;

        const nextBtn = document.getElementById('btn-next-round');
        if (nextBtn) {
          nextBtn.textContent = isMatchFullyOver ? 'START NEW MATCH' : 'BEGIN NEXT ROUND';
        }

        const romanRound = toRoman(this.gameState.round);
        const roundStr = this.gameState.maxRounds > 0
          ? `ROUND ${romanRound} OF ${toRoman(this.gameState.maxRounds)}`
          : `ROUND ${romanRound}`;

        if (badge) {
          badge.textContent = isMatchFullyOver
            ? (isKO ? `${roundStr} — KNOCKOUT` : `MATCH CONCLUDED (${roundStr})`)
            : `${roundStr} COMPLETE`;
        }

        if (this.gameState.winner === 'PLAYER') {
          if (title) title.textContent = isMatchFullyOver ? (isKO ? 'Knockout Victory' : 'Match Victory') : 'Round Victory';
          if (sub) {
            sub.textContent = isMatchFullyOver
              ? 'Kinematic mastery established. The session concludes with total tactical supremacy.'
              : 'Superior evasion and counter-striking cadence. Prepare for the next round.';
          }
          this.audio.playVictoryTune();
          if (isKO) this.boxer3D.knockout();
        } else {
          if (title) title.textContent = isMatchFullyOver ? (isKO ? 'Knockout Defeat' : 'Technical Conclusion') : 'Round Concluded';
          if (sub) {
            sub.textContent = isMatchFullyOver
              ? 'The match concluded. Recalibrate defense and stance alignment for the next session.'
              : 'The round concluded. Recalibrate defense and stance alignment for the next round.';
          }
        }

        // Top-line stats
        if (statPunches) statPunches.textContent = this.formChecker.stats.totalPunches;
        if (statCounters) statCounters.textContent = this.combatAI.profiler.playerCounterStrikes;
        if (statScore) statScore.textContent = this.gameState.score;

        // Kinematic Mastery breakdown
        const avgScore = this.formChecker.stats.averageScore || 100;
        if (formAcc) formAcc.textContent = `${avgScore}%`;
        if (meterFill) meterFill.style.width = `${avgScore}%`;

        const droppedGuardCount = this.formChecker.stats.flawsCount?.droppedGuard || 0;
        const isGuardOk = droppedGuardCount <= 1;
        if (guardStatus) {
          guardStatus.textContent = isGuardOk ? 'Protected' : 'Exposed';
          guardStatus.className = isGuardOk ? 'summary-status-badge status-good' : 'summary-status-badge status-warning';
        }

        const offBalanceCount = this.formChecker.stats.flawsCount?.offBalance || 0;
        const isBalanceOk = offBalanceCount <= 1;
        if (balanceStatus) {
          balanceStatus.textContent = isBalanceOk ? 'Optimal' : 'Off-Balance';
          balanceStatus.className = isBalanceOk ? 'summary-status-badge status-good' : 'summary-status-badge status-warning';
        }

        // Strike Registry breakdown
        if (totalStrikes) totalStrikes.textContent = this.formChecker.stats.totalPunches;
        if (jabs) jabs.textContent = this.formChecker.stats.jabs;
        if (crosses) crosses.textContent = this.formChecker.stats.crosses;
        if (hooks) hooks.textContent = this.formChecker.stats.hooks;
        if (uppers) uppers.textContent = this.formChecker.stats.uppercuts;
      }
      return;
    }

    if (this.isPaused) return;

    // CPU Bot Combat Decision
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

    // Check Player Evasion during Strike Frame
    const isStrikeActive = (this.boxer3D.state === 'STRIKING' || this.boxer3D.state === 'COMBO_STRIKING');

    if (isStrikeActive && !this.boxer3D.stepEvaluated) {
      const req = this.boxer3D.requiredDefense;
      const isFeint = this.boxer3D.activeStepDef?.isFeint || false;
      let evaded = false;

      if (isFeint) {
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
          // Combination Branch
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
              const superBonus = this.boxer3D.activeCombo.superBonus || 40;
              this.gameState.addSuper(superBonus);
              this.fx.addFloatingBadge('FULL SEQUENCE DEFENDED — APEX COUNTER', hx, hy - 45, '#eec05a', 30);
              this.combatAI.onPlayerEvaded(true, true);
            } else {
              this.fx.addFloatingBadge(`SEQUENCE EVADED (${toRoman(stepIdx + 1)} / ${toRoman(totalSteps)})`, hx, hy - 30, '#d4a03c', 24);
              this.combatAI.onPlayerEvaded(true, false);
            }
          } else {
            this.boxer3D.recordComboStepEvaded(false);
            this.audio.playImpact(true);
            this.gameState.damagePlayer(stepDmg);
            this.fx.addTrauma(0.45);
            this.fx.emitHitSpark(hx, hy, 'BAD');
            this.fx.addFloatingBadge(`STRIKE CONCEDED (${toRoman(stepIdx + 1)} / ${toRoman(totalSteps)})`, hx, hy, '#9e3d2b', 28);
            this.combatAI.onHitLanded(true, stepDmg);
          }
        } else {
          // Single Strike Branch
          this.boxer3D.stepEvaluated = true;
          if (evaded) {
            this.audio.playWhoosh(1.2);
            this.audio.playBlock();
            this.fx.emitHitSpark(hx, hy, 'PERFECT');
            this.fx.addFloatingBadge('SLIP RECORDED — EXECUTE COUNTER', hx, hy - 30, '#d4a03c', 26);
            this.gameState.addSuper(15);
            this.boxer3D.openOpeningWindow(timestamp);
            this.combatAI.onPlayerEvaded(false, false);
          } else {
            this.audio.playImpact(true);
            this.gameState.damagePlayer(55);
            this.fx.addTrauma(0.5);
            this.fx.emitHitSpark(hx, hy, 'BAD');
            this.fx.addFloatingBadge('STRIKE CONCEDED (-55 HP)', hx, hy, '#9e3d2b', 28);
            this.boxer3D.state = 'RECOVERING';
            this.boxer3D.stateTimer = timestamp;
            this.combatAI.onHitLanded(false, 55);
          }
        }
      }
    }

    // Player Punch Tracking
    if (evaluation.punchEvent) {
      const punch = evaluation.punchEvent;
      const wx = punch.wristPos.x * width;
      const wy = punch.wristPos.y * height;
      const isVulnerable = (this.boxer3D.state === 'OPENING' || this.boxer3D.counterWindow);
      const isMassive = this.boxer3D.massiveCounter;

      if (isVulnerable) {
        let baseDmg = 50;
        let announcerCall = 'COUNTER!';
        let badgeText = 'COUNTER STRIKE';
        let badgeColor = '#d4a03c';

        if (punch.type.includes('UPPERCUT')) {
          baseDmg = 135;
          announcerCall = 'UPPERCUT COUNTER!';
          badgeText = 'RISING UPPERCUT PUNISH';
          badgeColor = '#eec05a';
        } else if (punch.type.includes('HOOK')) {
          baseDmg = 105;
          announcerCall = 'HOOK PUNISH!';
          badgeText = 'HOOK COUNTERPOISE';
          badgeColor = '#d4a03c';
        } else if (punch.type === 'CROSS') {
          baseDmg = 80;
          announcerCall = 'POWER CROSS!';
          badgeText = 'POWER CROSS CADENCE';
          badgeColor = '#eec05a';
        } else {
          baseDmg = 50;
          announcerCall = 'STIFF JAB!';
          badgeText = 'JAB INTERCEPT';
          badgeColor = '#d4a03c';
        }

        const finalDmg = Math.round(baseDmg * (isMassive ? 1.30 : 1.0));
        this.audio.playImpact(true);
        this.hitstopTimer = timestamp + (isMassive ? 140 : 100);
        this.boxer3D.takeHit(finalDmg, punch.type);
        this.gameState.damageRival(finalDmg);
        this.gameState.addSuper(isMassive ? 18 : 12);
        this.fx.addTrauma(isMassive ? 0.70 : 0.50);
        this.fx.emitHitSpark(wx, wy, 'PERFECT');
        this.fx.addFloatingBadge(`${badgeText} (+${finalDmg} DMG)`, wx, wy - 35, badgeColor, 30);
        this.combatAI.profiler.playerCounterStrikes++;
      } else {
        // Neutral Exchange
        const diff = this.combatAI.difficulty || 'PROFESSIONAL';
        const defenseProb = (diff === 'NOVICE') ? 0.65 : (diff === 'CHAMPION') ? 0.98 : 0.88;

        if (this.boxer3D.state === 'DEFENDING') {
          this.playerSpamFlurryCount = (this.playerSpamFlurryCount || 0) + 1;

          if (this.boxer3D.defenseType === 'BLOCK') {
            this.audio.playBlock();
            this.gameState.damageRival(8);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('FLURRY DEFENDED (+8 CHIP)', wx, wy - 25, '#968c7e', 22);
            this.boxer3D.defenseDuration = Math.min(700, this.boxer3D.defenseDuration + 150);

            if (this.playerSpamFlurryCount >= 2 && diff !== 'NOVICE') {
              const counterProb = (diff === 'CHAMPION') ? 0.95 : 0.70;
              if (Math.random() < counterProb && !this.gameState.isMatchOver) {
                this.playerSpamFlurryCount = 0;
                this.audio.playWhoosh(1.4);
                this.boxer3D.startAttack(diff === 'CHAMPION' ? 'RIGHT_CROSS' : 'LEFT_HOOK', 280);
                this.fx.addFloatingBadge('CADENCE PARRIED — BOT COUNTERS', wx, wy - 40, '#9e3d2b', 28);
              }
            }
          } else {
            this.audio.playWhoosh(1.4);
            this.fx.addFloatingBadge('FLURRY EVADED — CLEAN MISS', wx, wy - 30, '#d4a03c', 24);

            if (this.playerSpamFlurryCount >= 2 && diff !== 'NOVICE') {
              this.playerSpamFlurryCount = 0;
              this.boxer3D.startAttack('UPPERCUT', 290);
              this.fx.addFloatingBadge('SLIP & RIP COUNTER', wx, wy - 40, '#9e3d2b', 28);
            }
          }
        } else if (this.boxer3D.state === 'HURT') {
          if (diff === 'CHAMPION' || (diff === 'PROFESSIONAL' && Math.random() < 0.85)) {
            this.boxer3D.defend('BLOCK');
            this.audio.playBlock();
            this.gameState.damageRival(8);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('GUARD RECOVERED', wx, wy - 25, '#d4a03c', 22);
          } else {
            this.audio.playImpact(false);
            this.boxer3D.takeHit(35, punch.type);
            this.gameState.damageRival(35);
            this.fx.emitHitSpark(wx, wy, 'GOOD');
            this.fx.addFloatingBadge('SEQUENCE CLIP (+35 DMG)', wx, wy - 30, '#d4a03c', 26);
          }
        } else {
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
              this.fx.addFloatingBadge('OPPONENT DUCKED UNDER', wx, wy - 35, '#968c7e', 24);
              if (diff !== 'NOVICE' && Math.random() < (diff === 'CHAMPION' ? 0.80 : 0.50)) {
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
              this.fx.addFloatingBadge(`OPPONENT SLIPPED ${dir}`, wx, wy - 35, '#968c7e', 24);
              if (diff !== 'NOVICE' && Math.random() < (diff === 'CHAMPION' ? 0.75 : 0.45)) {
                setTimeout(() => {
                  if (this.boxer3D.state === 'IDLE' && !this.gameState.isMatchOver) {
                    this.boxer3D.startAttack('RIGHT_CROSS', 300);
                    this.audio.playWarningBeep();
                  }
                }, 390);
              }
            } else {
              this.audio.playBlock();
              this.gameState.damageRival(10);
              this.fx.emitHitSpark(wx, wy, 'GOOD');
              this.fx.addFloatingBadge('OPPONENT BLOCKED (+10 CHIP)', wx, wy - 25, '#968c7e', 22);
            }
          } else {
            this.audio.playImpact(false);
            this.boxer3D.takeHit(35, punch.type);
            this.gameState.damageRival(35);
            this.gameState.addSuper(6);
            this.fx.emitHitSpark(wx, wy, 'PERFECT');
            this.fx.addFloatingBadge('CLEAN STRIKE (+35 DMG)', wx, wy - 30, '#eec05a', 28);
          }
        }
      }
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.reflexApp = window.shadowBoxingApp = new ShadowBoxingApp();
});
