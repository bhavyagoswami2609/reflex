/**
 * Palestra Combat AI Engine
 * Classical Pugilism & Adaptive Telemetry:
 * - Real-Time Player Profiler & Kinematic Habit Learning
 * - Classical Pugilism Archetypes: PALESTRA PROBING, TACTICAL COUNTERPOISE, IMPERIAL BARRAGE, CLASSICAL CADENCE, FERVENCY APEX
 * - Classical Pugilism Terminology and Dark Luxury HUD
 */

import { COMBO_DEFINITIONS, getCounterComboForHabit, getCombosForDifficulty } from './boxingCombos.js';

/**
 * Opponent Rigor / Difficulty Configurations
 */
export const DIFFICULTY_CONFIGS = {
  NOVICE: {
    id: 'NOVICE',
    name: 'NOVICE',
    label: 'NOVICE',
    speedMultiplier: 0.92,
    cooldownMultiplier: 1.25,
    comboProbabilityMultiplier: 0.8,
    openingDurationMultiplier: 1.25,
    idleOpeningIntervalMs: 6500,
    defenseProbability: 0.65,
    color: '#d4a03c'
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'PROFESSIONAL',
    label: 'PROFESSIONAL',
    speedMultiplier: 1.15,
    cooldownMultiplier: 0.90,
    comboProbabilityMultiplier: 1.2,
    openingDurationMultiplier: 0.95,
    idleOpeningIntervalMs: 8500,
    defenseProbability: 0.88,
    color: '#eec05a'
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
    defenseProbability: 0.98,
    color: '#9e3d2b'
  }
};

// Aliases for compatibility
DIFFICULTY_CONFIGS.ROOKIE = DIFFICULTY_CONFIGS.NOVICE;
DIFFICULTY_CONFIGS.PRO = DIFFICULTY_CONFIGS.PROFESSIONAL;

export class CombatAI {
  constructor(boxer3D, gameState) {
    this.boxer3D = boxer3D;
    this.gameState = gameState;

    // Rigor: 'NOVICE' | 'PROFESSIONAL' | 'CHAMPION'
    this.difficulty = 'PROFESSIONAL';

    // Current AI State & Archetype
    this.currentArchetype = 'PROBING';
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
      playerConsecutiveBlocks: 0,
      lastRecordedDefense: 'NONE',
      detectedHabit: 'NONE',
      confidence: 0
    };

    // Tactical Thought Telemetry
    this.currentThought = 'PROBING: DISTANCE APPRAISAL WITH LEAD JAB';
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = '#d4a03c';
    this.thoughtDuration = 3200;

    // Cooldowns & Pacing
    this.nextDecisionTime = performance.now() + 1000;
    this.lastActionType = 'STRIKE';
    this.consecutiveHitsOnPlayer = 0;
    this.consecutivePlayerEvades = 0;

    // Archetype Configurations
    this.archetypeParams = {
      PROBING: {
        comboProbability: 0.25,
        feintProbability: 0.10,
        speedMultiplier: 1.0,
        cooldownMs: 850,
        color: '#d4a03c',
        label: 'DISTANCE APPRAISAL'
      },
      TACTICAL_ADAPTIVE: {
        comboProbability: 0.70,
        feintProbability: 0.25,
        speedMultiplier: 1.12,
        cooldownMs: 700,
        color: '#eec05a',
        label: 'TACTICAL COUNTERPOISE'
      },
      PRESSURE_COMBOS: {
        comboProbability: 0.85,
        feintProbability: 0.15,
        speedMultiplier: 1.18,
        cooldownMs: 580,
        color: '#9e3d2b',
        label: 'IMPERIAL BARRAGE'
      },
      COUNTER_PUNCHER: {
        comboProbability: 0.65,
        feintProbability: 0.20,
        speedMultiplier: 1.15,
        cooldownMs: 650,
        color: '#d4a03c',
        label: 'CLASSICAL CADENCE'
      },
      DESPERATION_OVERDRIVE: {
        comboProbability: 0.92,
        feintProbability: 0.30,
        speedMultiplier: 1.28,
        cooldownMs: 450,
        color: '#9e3d2b',
        label: 'FERVENCY APEX'
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
      playerConsecutiveBlocks: 0,
      lastRecordedDefense: 'NONE',
      detectedHabit: 'NONE',
      confidence: 0
    };
    this.currentThought = 'TACTICAL REGISTRY: SCANNING OPPONENT STANCE PROTOCOLS';
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = '#d4a03c';
    this.nextDecisionTime = performance.now() + 1000;
    this.consecutiveHitsOnPlayer = 0;
    this.consecutivePlayerEvades = 0;
  }

  /**
   * Record real-time player telemetry from biomechanical detector
   */
  recordPlayerTelemetry(defense, evaluation, timestamp) {
    if (!defense) return;

    // Detect premature evasions while bot is in WINDUP
    if (this.boxer3D.state === 'WINDUP' || this.boxer3D.state === 'COMBO_WINDUP') {
      const elapsed = timestamp - this.boxer3D.stateTimer;
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

    this.updateArchetype();
  }

  /**
   * Dynamically switches AI archetype based on player habits, bot health, and match progression
   */
  updateArchetype() {
    const rivalHp = this.gameState.rivalHp;
    const playerHp = this.gameState.playerHp;
    const roundTime = this.gameState.roundTime;

    // 1. FERVENCY APEX: Bot health <= 30%
    if (rivalHp <= 300) {
      if (this.currentArchetype !== 'DESPERATION_OVERDRIVE') {
        this.setArchetype('DESPERATION_OVERDRIVE', 'FERVENCY APEX: CONVICTION PROTOCOL ENGAGED', '#9e3d2b');
      }
      return;
    }

    // 2. IMPERIAL BARRAGE: Player health low or turtling in guard
    if (playerHp <= 400 || this.profiler.detectedHabit === 'HABIT_HIGH_GUARD') {
      if (this.currentArchetype !== 'PRESSURE_COMBOS') {
        this.setArchetype('PRESSURE_COMBOS', 'IMPERIAL BARRAGE: UNLEASHING FLURRY CADENCE', '#9e3d2b');
      }
      return;
    }

    // 3. CLASSICAL CADENCE: Player is aggressive with counters
    if (this.profiler.detectedHabit === 'HABIT_AGGRESSIVE_COUNTER') {
      if (this.currentArchetype !== 'COUNTER_PUNCHER') {
        this.setArchetype('COUNTER_PUNCHER', 'CLASSICAL CADENCE: COUNTERING OPPONENT RHYTHM', '#d4a03c');
      }
      return;
    }

    // 4. TACTICAL COUNTERPOISE: High confidence habit detected
    if (this.profiler.confidence >= 0.45 && this.profiler.detectedHabit !== 'NONE') {
      if (this.currentArchetype !== 'TACTICAL_ADAPTIVE') {
        this.setArchetype('TACTICAL_ADAPTIVE', this.getHabitCallout(this.profiler.detectedHabit), '#eec05a');
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
        return 'TACTICAL READ: LATERAL SLIP OBSERVED — INTERCEPTING WITH HOOK';
      case 'HABIT_SLIP_LEFT':
        return 'TACTICAL READ: SLIP LEFT OBSERVED — PUNISHING WITH POWER CROSS';
      case 'HABIT_HIGH_GUARD':
        return 'TACTICAL READ: HIGH GUARD ADOPTED — TARGETING THE RIBS';
      case 'HABIT_DUCK':
        return 'TACTICAL READ: EARLY DUCKING OBSERVED — RISING UPPERCUT';
      case 'HABIT_PREMATURE_EVASION':
        return 'TACTICAL FEINT: DRAWING PREMATURE EVASION';
      case 'HABIT_AGGRESSIVE_COUNTER':
        return 'TACTICAL CADENCE: BAITING COUNTER STRIKE';
      default:
        return 'TACTICAL DRILL: FORMULATING COUNTER CADENCE';
    }
  }

  getDifficultyConfig() {
    return DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.PROFESSIONAL;
  }

  setDifficulty(diffName) {
    let key = diffName;
    if (diffName === 'ROOKIE') key = 'NOVICE';
    if (diffName === 'PRO') key = 'PROFESSIONAL';

    if (DIFFICULTY_CONFIGS[key]) {
      this.difficulty = key;
      const cfg = DIFFICULTY_CONFIGS[key];
      this.emitThought(`RIGOR CONFIGURED: ${cfg.label}`, cfg.color);
      if (this.boxer3D && this.boxer3D.setDifficulty) {
        // Map to string expected by 3D animator
        const animDiff = key === 'NOVICE' ? 'ROOKIE' : key === 'CHAMPION' ? 'CHAMPION' : 'PRO';
        this.boxer3D.setDifficulty(animDiff);
      }
      if (this.gameState && this.gameState.setOpponentConfig) {
        const charType = (this.boxer3D && this.boxer3D.characterType) || 'human';
        this.gameState.setOpponentConfig(charType, key);
      }
      return cfg;
    }
    return this.getDifficultyConfig();
  }

  cycleDifficulty() {
    const sequence = ['NOVICE', 'PROFESSIONAL', 'CHAMPION'];
    const currentIdx = sequence.indexOf(this.difficulty);
    const nextIdx = (currentIdx + 1) % sequence.length;
    return this.setDifficulty(sequence[nextIdx]);
  }

  emitThought(text, color = '#d4a03c') {
    this.currentThought = text;
    this.thoughtTimestamp = performance.now();
    this.thoughtColor = color;
  }

  /**
   * Main Decision Engine
   */
  decideNextAction(timestamp) {
    const config = this.archetypeParams[this.currentArchetype] || this.archetypeParams.PROBING;
    const diffConfig = this.getDifficultyConfig();
    const habit = this.profiler.detectedHabit;
    const speedMult = config.speedMultiplier * diffConfig.speedMultiplier;
    const comboProb = Math.min(0.96, config.comboProbability * diffConfig.comboProbabilityMultiplier);

    const roll = Math.random();

    // Priority 0: Anti-Turtling / Block-Break Trigger
    // If the player blocks repeatedly in a row (>= 2 blocks) or high guard is heavily favored,
    // trigger a block-break combo or body-trap to prevent exploiting the block!
    const isTurtling = (this.profiler.playerConsecutiveBlocks >= 2) || (habit === 'HABIT_HIGH_GUARD');
    if (isTurtling && (this.difficulty === 'CHAMPION' || this.difficulty === 'PROFESSIONAL')) {
      let breakerCombo = null;
      if (this.difficulty === 'CHAMPION') {
        // Champion has both Slip-Trap and Shell-Cracker with Block Break finishers
        breakerCombo = Math.random() < 0.5 ? COMBO_DEFINITIONS.SHELL_CRACKER : COMBO_DEFINITIONS.SLIP_TRAP;
        this.emitThought('ANTI-TURTLE: GUARD CRACK PROTOCOL ENGAGED', '#ef4444');
      } else {
        // Professional has Slip-Trap (Heavy Rear Hook block break) or Body-Head Trap
        breakerCombo = Math.random() < 0.65 ? COMBO_DEFINITIONS.SLIP_TRAP : COMBO_DEFINITIONS.BODY_HEAD_TRAP;
        this.emitThought('ANTI-TURTLE: TARGETING GUARD WITH SLIP-TRAP', '#eec05a');
      }
      return {
        type: 'COMBO',
        combo: breakerCombo,
        speedMultiplier: speedMult,
        windupMs: Math.round(breakerCombo.steps[0].windupMs / speedMult)
      };
    }

    // Priority 1: If player slips prematurely on windups, throw FEINT_OVERHAND
    if (habit === 'HABIT_PREMATURE_EVASION' || roll < (config.feintProbability * (this.difficulty === 'NOVICE' ? 0.3 : 1.0))) {
      this.emitThought('TACTICAL FEINT: DRAWING PREMATURE EVASION', '#eec05a');
      return {
        type: 'COMBO',
        combo: COMBO_DEFINITIONS.FEINT_OVERHAND,
        speedMultiplier: speedMult,
        windupMs: Math.round(380 / diffConfig.speedMultiplier)
      };
    }

    // Priority 2: Execute Adaptive or Randomized Realistic Combo
    if (roll < comboProb) {
      const availableCombos = getCombosForDifficulty(this.difficulty);
      let chosenCombo = null;

      // 40% chance to target specific habit if habit detected, 60% chance for randomized combo from tier
      if (habit !== 'NONE' && Math.random() < 0.40) {
        chosenCombo = getCounterComboForHabit(habit, this.difficulty);
      } else {
        // Pick randomly from the difficulty's realistic combo pool
        chosenCombo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
      }

      this.emitThought(`TACTICAL COMBO: ${chosenCombo.name}`, '#d4a03c');

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
      this.emitThought('TACTICAL READ: SLIP RIGHT PREDICTED — LEAD HOOK', '#d4a03c');
    } else if (habit === 'HABIT_SLIP_LEFT') {
      singleAttack = 'RIGHT_CROSS';
      this.emitThought('TACTICAL READ: SLIP LEFT PREDICTED — POWER CROSS', '#eec05a');
    } else if (habit === 'HABIT_DUCK') {
      singleAttack = 'UPPERCUT';
      this.emitThought('TACTICAL READ: DUCK PREDICTED — RISING UPPERCUT', '#eec05a');
    } else if (habit === 'HABIT_HIGH_GUARD') {
      singleAttack = 'BODY_SHOT';
      this.emitThought('TACTICAL READ: HIGH GUARD PREDICTED — BODY SHOVEL', '#9e3d2b');
    } else {
      const pool = ['LEFT_JAB', 'RIGHT_CROSS', 'LEFT_HOOK', 'RIGHT_HOOK', 'OVERHAND'];
      singleAttack = pool[Math.floor(Math.random() * pool.length)];
      this.emitThought(`TACTICAL PROBE: ${singleAttack}`, '#d4a03c');
    }

    const baseWindup = Math.max(300, Math.round((560 - (99 - this.gameState.roundTime) * 2.8) / speedMult));

    return {
      type: 'STRIKE',
      attackId: singleAttack,
      speedMultiplier: speedMult,
      windupMs: baseWindup
    };
  }

  onPlayerBlocked() {
    this.profiler.playerConsecutiveBlocks = (this.profiler.playerConsecutiveBlocks || 0) + 1;
  }

  onPlayerEvaded(isCombo, isFullCombo) {
    this.consecutivePlayerEvades++;
    this.consecutiveHitsOnPlayer = 0;
    this.profiler.playerConsecutiveBlocks = 0;

    if (isFullCombo) {
      this.emitThought('CADENCE INTERRUPTED: SEQUENCE DEFENDED — RECOVERY WINDOW OPEN', '#9e3d2b');
    }
  }

  onHitLanded(isCombo, damage) {
    this.consecutiveHitsOnPlayer++;
    this.consecutivePlayerEvades = 0;
    this.profiler.playerConsecutiveBlocks = 0;

    if (this.consecutiveHitsOnPlayer >= 2) {
      this.emitThought('ADVANTAGE: OPPONENT GUARD COMPROMISED — PRESSING ATTACK', '#d4a03c');
    }
  }

  /**
   * Tactical Thought HUD on Canvas - Disabled per user request
   */
  renderHUD(ctx, width, height) {
    // Disabled per user request
    return;
  }
}
