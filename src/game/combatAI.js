/**
 * Smart "CPU Bot" AI Combat Engine for SHADOW BRAWLER
 * 
 * Features:
 * - Real-Time Player Profiler & Adaptive Habit Learning
 * - Fight Archetypes: PROBING, TACTICAL_ADAPTIVE, PRESSURE_COMBOS, COUNTER_PUNCHER, DESPERATION_OVERDRIVE
 * - Intelligent Counter-Combo & Feint Selection
 * - Live Cybernetic AI Psychological Callouts & HUD Telemetry
 */

import { COMBO_DEFINITIONS, getCounterComboForHabit } from './boxingCombos.js';

/**
 * Bot Difficulty Configurations
 */
export const DIFFICULTY_CONFIGS = {
  ROOKIE: {
    id: 'ROOKIE',
    name: 'ROOKIE',
    label: 'ROOKIE',
    speedMultiplier: 0.92,
    cooldownMultiplier: 1.25,
    comboProbabilityMultiplier: 0.8,
    openingDurationMultiplier: 1.25,
    idleOpeningIntervalMs: 6500,
    defenseProbability: 0.65, // Solid medium baseline (equivalent to old champion)
    color: '#00ff88'
  },
  PRO: {
    id: 'PRO',
    name: 'PRO',
    label: 'PRO',
    speedMultiplier: 1.15,
    cooldownMultiplier: 0.90,
    comboProbabilityMultiplier: 1.2,
    openingDurationMultiplier: 0.95,
    idleOpeningIntervalMs: 8500,
    defenseProbability: 0.88, // Harder: actively blocks flurries, slips, and counters
    color: '#00f3ff'
  },
  CHAMPION: {
    id: 'CHAMPION',
    name: 'CHAMPION',
    label: 'CHAMPION',
    speedMultiplier: 1.35,
    cooldownMultiplier: 0.70,
    comboProbabilityMultiplier: 1.5,
    openingDurationMultiplier: 0.70,
    idleOpeningIntervalMs: 13500,
    defenseProbability: 0.98, // Elite: one step ahead, weaves flurries, instantaneous counters
    color: '#ff0055'
  }
};

export class CombatAI {
  constructor(boxer3D, gameState) {
    this.boxer3D = boxer3D;
    this.gameState = gameState;

    // Difficulty Settings: 'ROOKIE' | 'PRO' | 'CHAMPION'
    this.difficulty = 'PRO';

    // Current AI State & Archetype
    this.currentArchetype = 'PROBING'; // PROBING, TACTICAL_ADAPTIVE, PRESSURE_COMBOS, COUNTER_PUNCHER, DESPERATION_OVERDRIVE
    this.previousArchetype = 'PROBING';
    
    // Player Profiler Telemetry
    this.profiler = {
      totalObservations: 0,
      slipRightCount: 0,
      slipLeftCount: 0,
      duckCount: 0,
      highGuardCount: 0,
      neutralCount: 0,
      prematureEvasionCount: 0,
      playerCounterStrikes: 0,
      lastRecordedDefense: 'NONE',
      detectedHabit: 'NONE',
      confidence: 0 // 0 to 1
    };

    // Tactical Thought Telemetry
    this.currentThought = '🧠 AI TACTIC: PROBING GUARD WITH LEAD JAB...';
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = '#00f3ff'; // Cyan default
    this.thoughtDuration = 3200; // ms

    // Cooldowns & Pacing
    this.nextDecisionTime = performance.now() + 1000;
    this.lastActionType = 'STRIKE'; // 'STRIKE' | 'COMBO' | 'FEINT'
    this.consecutiveHitsOnPlayer = 0;
    this.consecutivePlayerEvades = 0;

    // Archetype Configurations
    this.archetypeParams = {
      PROBING: {
        comboProbability: 0.25,
        feintProbability: 0.10,
        speedMultiplier: 1.0,
        cooldownMs: 850,
        color: '#00f3ff',
        label: 'TACTICAL PROBING'
      },
      TACTICAL_ADAPTIVE: {
        comboProbability: 0.70,
        feintProbability: 0.25,
        speedMultiplier: 1.12,
        cooldownMs: 700,
        color: '#ffc700',
        label: 'ADAPTIVE INTERCEPT'
      },
      PRESSURE_COMBOS: {
        comboProbability: 0.85,
        feintProbability: 0.15,
        speedMultiplier: 1.18,
        cooldownMs: 580,
        color: '#ff0055',
        label: 'PRESSURE BARRAGE'
      },
      COUNTER_PUNCHER: {
        comboProbability: 0.65,
        feintProbability: 0.20,
        speedMultiplier: 1.15,
        cooldownMs: 650,
        color: '#00ff88',
        label: 'COUNTER MATRIX'
      },
      DESPERATION_OVERDRIVE: {
        comboProbability: 0.92,
        feintProbability: 0.30,
        speedMultiplier: 1.28,
        cooldownMs: 450,
        color: '#ff2255',
        label: 'OVERDRIVE MAXIMUM'
      }
    };
  }

  /**
   * Resets AI brain state for a new round
   */
  reset() {
    this.currentArchetype = 'PROBING';
    this.profiler = {
      totalObservations: 0,
      slipRightCount: 0,
      slipLeftCount: 0,
      duckCount: 0,
      highGuardCount: 0,
      neutralCount: 0,
      prematureEvasionCount: 0,
      playerCounterStrikes: 0,
      lastRecordedDefense: 'NONE',
      detectedHabit: 'NONE',
      confidence: 0
    };
    this.currentThought = '🧠 AI INITIALIZED: SCANNING PLAYER DEFENSE PROTOCOLS...';
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = '#00f3ff';
    this.nextDecisionTime = performance.now() + 1000;
    this.consecutiveHitsOnPlayer = 0;
    this.consecutivePlayerEvades = 0;
  }

  /**
   * Record real-time player telemetry from biomechanical detector
   * @param {Object} defense Active defense state from DefenseDetector
   * @param {Object} evaluation Biomechanical evaluation from FormChecker
   * @param {number} timestamp Current performance timestamp
   */
  recordPlayerTelemetry(defense, evaluation, timestamp) {
    if (!defense) return;

    // Detect premature evasions while bot is in WINDUP
    if (this.boxer3D.state === 'WINDUP' || this.boxer3D.state === 'COMBO_WINDUP') {
      const elapsed = timestamp - this.boxer3D.stateTimer;
      // If player slips or ducks during the first 60% of windup, flag as premature evasion
      if (elapsed > 100 && elapsed < (this.boxer3D.windupDuration * 0.65)) {
        if (defense.slipLeft || defense.slipRight || defense.ducking) {
          this.profiler.prematureEvasionCount++;
        }
      }
    }

    // Record player counter attacks
    if (this.boxer3D.counterWindow && evaluation?.punchEvent) {
      this.profiler.playerCounterStrikes++;
    }

    // Accumulate defense habit observations during active moments
    if (defense.action && defense.action !== 'NONE') {
      this.profiler.totalObservations++;
      if (defense.slipRight || defense.action === 'SLIP_RIGHT') {
        this.profiler.slipRightCount++;
      } else if (defense.slipLeft || defense.action === 'SLIP_LEFT') {
        this.profiler.slipLeftCount++;
      } else if (defense.ducking || defense.action === 'DUCK') {
        this.profiler.duckCount++;
      } else if (defense.blocking || defense.action === 'HIGH_GUARD_BLOCK') {
        this.profiler.highGuardCount++;
      } else if (defense.action === 'NEUTRAL') {
        this.profiler.neutralCount++;
      }
    }

    // Periodically update habit analysis
    this.evaluatePlayerHabits();
  }

  /**
   * Evaluates cumulative telemetry to extract dominant defense habits
   */
  evaluatePlayerHabits() {
    const total = Math.max(1, this.profiler.totalObservations);
    const slipRightRatio = this.profiler.slipRightCount / total;
    const slipLeftRatio = this.profiler.slipLeftCount / total;
    const duckRatio = this.profiler.duckCount / total;
    const blockRatio = this.profiler.highGuardCount / total;
    const prematureRatio = this.profiler.prematureEvasionCount / Math.max(1, total * 0.3);

    // Identify primary habit
    let habit = 'NONE';
    let confidence = 0;

    if (prematureRatio >= 0.40) {
      habit = 'HABIT_PREMATURE_EVASION';
      confidence = Math.min(1.0, prematureRatio);
    } else if (slipRightRatio >= 0.38) {
      habit = 'HABIT_SLIP_RIGHT';
      confidence = Math.min(1.0, slipRightRatio * 1.5);
    } else if (blockRatio >= 0.42) {
      habit = 'HABIT_HIGH_GUARD';
      confidence = Math.min(1.0, blockRatio * 1.5);
    } else if (duckRatio >= 0.38) {
      habit = 'HABIT_DUCK';
      confidence = Math.min(1.0, duckRatio * 1.5);
    } else if (slipLeftRatio >= 0.38) {
      habit = 'HABIT_SLIP_LEFT';
      confidence = Math.min(1.0, slipLeftRatio * 1.5);
    } else if (this.profiler.playerCounterStrikes >= 3) {
      habit = 'HABIT_AGGRESSIVE_COUNTER';
      confidence = 0.85;
    }

    this.profiler.detectedHabit = habit;
    this.profiler.confidence = confidence;

    // Dynamic Archetype Evolution
    this.updateArchetype();
  }

  /**
   * Dynamically switches AI archetype based on player habits, bot health, and match progression
   */
  updateArchetype() {
    const rivalHp = this.gameState.rivalHp;
    const playerHp = this.gameState.playerHp;
    const roundTime = this.gameState.roundTime;

    // 1. DESPERATION OVERDRIVE: Bot health <= 30%
    if (rivalHp <= 300) {
      if (this.currentArchetype !== 'DESPERATION_OVERDRIVE') {
        this.setArchetype('DESPERATION_OVERDRIVE', '🧠 OVERDRIVE: DESPERATION PROTOCOL ENGAGED! FULL SPEED!', '#ff2255');
      }
      return;
    }

    // 2. PRESSURE COMBOS: Player health low or turtling in guard
    if (playerHp <= 400 || this.profiler.detectedHabit === 'HABIT_HIGH_GUARD') {
      if (this.currentArchetype !== 'PRESSURE_COMBOS') {
        this.setArchetype('PRESSURE_COMBOS', '🧠 AI TACTIC: OPPONENT WEAKENED → UNLEASHING PRESSURE FLURRY!', '#ff0055');
      }
      return;
    }

    // 3. COUNTER PUNCHER: Player is aggressive with counters
    if (this.profiler.detectedHabit === 'HABIT_AGGRESSIVE_COUNTER') {
      if (this.currentArchetype !== 'COUNTER_PUNCHER') {
        this.setArchetype('COUNTER_PUNCHER', '🧠 AI ADAPTING: COUNTERING YOUR AGGRESSIVE RHYTHM!', '#00ff88');
      }
      return;
    }

    // 4. TACTICAL ADAPTIVE: High confidence habit detected
    if (this.profiler.confidence >= 0.45 && this.profiler.detectedHabit !== 'NONE') {
      if (this.currentArchetype !== 'TACTICAL_ADAPTIVE') {
        this.setArchetype('TACTICAL_ADAPTIVE', this.getHabitCallout(this.profiler.detectedHabit), '#ffc700');
      }
      return;
    }

    // 5. Default PROBING in early match
    if (roundTime > 85 && this.profiler.totalObservations < 6) {
      this.currentArchetype = 'PROBING';
    }
  }

  setArchetype(newArchetype, thoughtText, color) {
    this.previousArchetype = this.currentArchetype;
    this.currentArchetype = newArchetype;
    this.emitThought(thoughtText, color);
  }

  getHabitCallout(habit) {
    switch (habit) {
      case 'HABIT_SLIP_RIGHT':
        return '🧠 AI READ: SLIP RIGHT HABIT DETECTED → INTERCEPTING WITH HOOK!';
      case 'HABIT_SLIP_LEFT':
        return '🧠 AI READ: SLIP LEFT DETECTED → PUNISHING WITH POWER CROSS!';
      case 'HABIT_HIGH_GUARD':
        return '🧠 AI READ: HIGH GUARD SPOTTED → DIGGING TO RIBS!';
      case 'HABIT_DUCK':
        return '🧠 AI READ: EARLY DUCKING OBSERVED → RISING UPPERCUT!';
      case 'HABIT_PREMATURE_EVASION':
        return '🧠 AI TACTIC: EARLY SLIPPER DETECTED → THROWING FEINT!';
      case 'HABIT_AGGRESSIVE_COUNTER':
        return '🧠 AI TACTIC: BAITING COUNTER PUNCH...';
      default:
        return '🧠 AI ADAPTING: FORMULATING COUNTER STRATEGY...';
    }
  }

  getDifficultyConfig() {
    return DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.PRO;
  }

  setDifficulty(diffName) {
    if (DIFFICULTY_CONFIGS[diffName]) {
      this.difficulty = diffName;
      const cfg = DIFFICULTY_CONFIGS[diffName];
      this.emitThought(`⚡ BOT DIFFICULTY SET: ${cfg.name} ⚡`, cfg.color);
      if (this.boxer3D && this.boxer3D.setDifficulty) {
        this.boxer3D.setDifficulty(diffName);
      }
      return cfg;
    }
    return this.getDifficultyConfig();
  }

  cycleDifficulty() {
    const sequence = ['ROOKIE', 'PRO', 'CHAMPION'];
    const currentIdx = sequence.indexOf(this.difficulty);
    const nextIdx = (currentIdx + 1) % sequence.length;
    return this.setDifficulty(sequence[nextIdx]);
  }

  emitThought(text, color = '#00f3ff') {
    this.currentThought = text;
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = color;
  }

  /**
   * Main Decision Engine:
   * Called when boxer is IDLE and cooldown has expired.
   * Decides whether to throw a single strike, execute a feint, or unleash an adaptive combo.
   * @param {number} timestamp 
   * @returns {Object} { type: 'COMBO' | 'STRIKE' | 'FEINT', comboId, attackId, windupMs, speedMultiplier }
   */
  decideNextAction(timestamp) {
    const config = this.archetypeParams[this.currentArchetype] || this.archetypeParams.PROBING;
    const diffConfig = this.getDifficultyConfig();
    const habit = this.profiler.detectedHabit;
    const speedMult = config.speedMultiplier * diffConfig.speedMultiplier;
    const comboProb = Math.min(0.96, config.comboProbability * diffConfig.comboProbabilityMultiplier);

    // Roll for Combo vs Single Strike vs Feint
    const roll = Math.random();

    // Priority 1: If player slips prematurely on windups, throw FEINT_OVERHAND!
    if (habit === 'HABIT_PREMATURE_EVASION' || roll < (config.feintProbability * (this.difficulty === 'ROOKIE' ? 0.3 : 1.0))) {
      this.emitThought('🧠 AI TACTIC: THROWING FEINT TO DRAW PREMATURE SLIP...', '#ffc700');
      return {
        type: 'COMBO',
        combo: COMBO_DEFINITIONS.FEINT_OVERHAND,
        speedMultiplier: speedMult,
        windupMs: Math.round(380 / diffConfig.speedMultiplier)
      };
    }

    // Priority 2: Execute Adaptive Combo if habit is identified or roll matches combo probability
    if (roll < comboProb) {
      let chosenCombo = null;

      if (habit === 'HABIT_HIGH_GUARD') {
        chosenCombo = COMBO_DEFINITIONS.BODY_HEAD_TRAP;
        this.emitThought('🧠 AI READ: HIGH GUARD SPOTTED → DIGGING TO RIBS!', '#ff0055');
      } else if (habit === 'HABIT_SLIP_RIGHT') {
        chosenCombo = COMBO_DEFINITIONS.ONE_TWO_THREE;
        this.emitThought('🧠 AI READ: SLIP RIGHT HABIT DETECTED → HOOK INTERCEPT!', '#00f3ff');
      } else if (habit === 'HABIT_DUCK' || habit === 'HABIT_AGGRESSIVE_COUNTER') {
        chosenCombo = COMBO_DEFINITIONS.COUNTER_CRUSH;
        this.emitThought('🧠 AI ADAPTING: COUNTERING YOUR RHYTHM WITH UPPERCUT!', '#00ff88');
      } else if (this.currentArchetype === 'PRESSURE_COMBOS' || this.currentArchetype === 'DESPERATION_OVERDRIVE') {
        chosenCombo = Math.random() > 0.5 ? COMBO_DEFINITIONS.HEAVY_PRESSURE : COMBO_DEFINITIONS.ONE_TWO_THREE;
        this.emitThought('🧠 AI TACTIC: RELENTLESS PRESSURE FLURRY ENGAGED!', '#ff2255');
      } else {
        // Classic 1-2
        chosenCombo = COMBO_DEFINITIONS.ONE_TWO;
        this.emitThought('🧠 AI TACTIC: SNAP 1-2 BREAD & BUTTER COMBINATION!', '#00f3ff');
      }

      return {
        type: 'COMBO',
        combo: chosenCombo,
        speedMultiplier: speedMult,
        windupMs: Math.round(chosenCombo.steps[0].windupMs / speedMult)
      };
    }

    // Priority 3: Tactical Single Strike
    let singleAttack = 'LEFT_JAB';
    if (habit === 'HABIT_SLIP_RIGHT') {
      singleAttack = 'LEFT_HOOK';
      this.emitThought('🧠 AI READ: SLIP RIGHT PREDICTED → LEAD HOOK!', '#00f3ff');
    } else if (habit === 'HABIT_SLIP_LEFT') {
      singleAttack = 'RIGHT_CROSS';
      this.emitThought('🧠 AI READ: SLIP LEFT PREDICTED → POWER CROSS!', '#ffc700');
    } else if (habit === 'HABIT_DUCK') {
      singleAttack = 'UPPERCUT';
      this.emitThought('🧠 AI READ: DUCK PREDICTED → RISING UPPERCUT!', '#00ff88');
    } else if (habit === 'HABIT_HIGH_GUARD') {
      singleAttack = 'BODY_SHOT';
      this.emitThought('🧠 AI READ: HIGH GUARD PREDICTED → BODY SHOVEL!', '#ff0055');
    } else {
      const pool = ['LEFT_JAB', 'RIGHT_CROSS', 'LEFT_HOOK', 'RIGHT_HOOK', 'OVERHAND'];
      singleAttack = pool[Math.floor(Math.random() * pool.length)];
      this.emitThought('🧠 AI TACTIC: PROBING DISTANCE WITH ' + singleAttack, '#00f3ff');
    }

    // Calculate base windup with round progression & speed scaling
    const baseWindup = Math.max(300, Math.round((560 - (99 - this.gameState.roundTime) * 2.8) / speedMult));

    return {
      type: 'STRIKE',
      attackId: singleAttack,
      speedMultiplier: speedMult,
      windupMs: baseWindup
    };
  }

  /**
   * Called when player successfully evades a strike or combo
   */
  onPlayerEvaded(isCombo, isFullCombo) {
    this.consecutivePlayerEvades++;
    this.consecutiveHitsOnPlayer = 0;

    if (isFullCombo) {
      this.emitThought('⚡ AI ALERT: COMBO EVADED! CRITICAL RECOVERY WINDOW OPEN!', '#ff3366');
    }
  }

  /**
   * Called when opponent lands a hit on player
   */
  onHitLanded(isCombo, damage) {
    this.consecutiveHitsOnPlayer++;
    this.consecutivePlayerEvades = 0;

    if (this.consecutiveHitsOnPlayer >= 2) {
      this.emitThought('💥 AI ADVANTAGE: PLAYER GUARD COMPROMISED → PRESSING ATTACK!', '#00ff88');
    }
  }

  /**
   * Renders the Cyberpunk / Street Fighter AI Tactical Thought HUD on Canvas
   */
  renderHUD(ctx, width, height) {
    ctx.save();

    const thoughtText = this.currentThought;
    const color = this.thoughtColor;
    const archetypeInfo = this.archetypeParams[this.currentArchetype] || this.archetypeParams.PROBING;

    // Top Center HUD positioning (below health bars and round timer)
    const centerX = width * 0.5;
    const topY = 74;

    ctx.font = '800 12px "Russo One", sans-serif';
    const textWidth = ctx.measureText(thoughtText).width;
    const bannerW = Math.max(340, textWidth + 48);
    const bannerH = 26;
    const bannerX = centerX - bannerW * 0.5;

    // Subtle background capsule with neon border
    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(bannerX, topY, bannerW, bannerH, 13);
    ctx.fill();
    ctx.stroke();

    // Archetype Badge Pill on Left Edge with Difficulty indicator
    const badgeText = `${this.difficulty} • ${archetypeInfo.label}`;
    ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bannerX + 4, topY + 4, badgeW, bannerH - 8, 8);
    ctx.fill();

    ctx.fillStyle = '#080c14';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bannerX + 4 + badgeW * 0.5, topY + bannerH * 0.5);

    // Thought Text
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textX = bannerX + badgeW + 14;
    ctx.fillText(thoughtText, textX, topY + bannerH * 0.5);

    // Pulse indicator icon on right edge
    const pulseAlpha = 0.5 + Math.sin(performance.now() * 0.01) * 0.5;
    ctx.fillStyle = color;
    ctx.globalAlpha = pulseAlpha;
    ctx.beginPath();
    ctx.arc(bannerX + bannerW - 12, topY + bannerH * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
