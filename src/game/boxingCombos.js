/**
 * Boxing Combo Engine for SHADOW BRAWLER
 * 
 * Provides authentic multi-strike boxing combinations with kinetic transitions,
 * chamber poses, rhythmic cadence, and adaptive tactical counters.
 */

export const COMBO_DEFINITIONS = {
  // 1. Classic 1-2 (Lead Jab -> Rear Power Cross)
  ONE_TWO: {
    id: 'ONE_TWO',
    name: '1-2 COMBINATION',
    shortName: '1-2 FLURRY',
    description: 'The foundation of boxing: blinding Lead Jab snaps the head back, chambering the explosive Rear Power Cross.',
    flavor: 'BREAD & BUTTER',
    archetype: 'PROBING',
    tacticalCounters: ['HABIT_NEUTRAL', 'HABIT_SLIP_LEFT'],
    punishWindowBonusMs: 900,
    superBonus: 30,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_JAB',
        name: 'LEAD JAB',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.06 },
        windupPose: 'GUARD',
        strikePose: 'JAB',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 640,
        strikeMs: 140,
        transitionMs: 120,
        damage: 22,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'RIGHT_CROSS',
        name: 'POWER CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: null,
        windupMs: 620,
        strikeMs: 160,
        transitionMs: 0,
        damage: 35,
        isFeint: false
      }
    ]
  },

  // 2. 1-2-3 Combo (Lead Jab -> Rear Cross -> Lead Hook)
  ONE_TWO_THREE: {
    id: 'ONE_TWO_THREE',
    name: '1-2-3 COMBINATION',
    shortName: '1-2-3 CASCADE',
    description: 'Snaps the guard back with a 1-2, then whips a vicious Lead Hook to catch slipping opponents.',
    flavor: 'TRIPLE THREAT',
    archetype: 'TACTICAL_ADAPTIVE',
    tacticalCounters: ['HABIT_SLIP_RIGHT', 'HABIT_TURTLE'],
    punishWindowBonusMs: 1200,
    superBonus: 40,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_JAB',
        name: 'LEAD JAB',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.06 },
        windupPose: 'GUARD',
        strikePose: 'JAB',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 640,
        strikeMs: 130,
        transitionMs: 120,
        damage: 20,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'RIGHT_CROSS',
        name: 'POWER CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: 'CROSS_TO_HOOK_CHAMBER',
        windupMs: 600,
        strikeMs: 150,
        transitionMs: 130,
        damage: 32,
        isFeint: false
      },
      {
        stepIndex: 2,
        attackId: 'LEFT_HOOK',
        name: 'LEAD HOOK',
        arm: 'LEFT',
        targetRegion: 'RIGHT_TEMPLE',
        requiredDefense: 'DUCK',
        alternativeDefense: 'SLIP_RIGHT',
        screenTargetOffset: { x: 0.13, y: -0.08 },
        windupPose: 'CROSS_TO_HOOK_CHAMBER',
        strikePose: 'HOOK',
        chamberPose: null,
        windupMs: 660,
        strikeMs: 160,
        transitionMs: 0,
        damage: 42,
        isFeint: false
      }
    ]
  },

  // 3. Body-Head Trap (Lead Jab to chin -> Digging Shovel Hook to ribs)
  BODY_HEAD_TRAP: {
    id: 'BODY_HEAD_TRAP',
    name: 'BODY-HEAD TRAP',
    shortName: 'LIVER DIGGER',
    description: 'High lead jab forces the hands up to protect the face, immediately followed by a level change digging into floating ribs.',
    flavor: 'GUARD BREAKER',
    archetype: 'TACTICAL_ADAPTIVE',
    tacticalCounters: ['HABIT_HIGH_GUARD', 'HABIT_TURTLE'],
    punishWindowBonusMs: 1100,
    superBonus: 35,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_JAB',
        name: 'EYE-LEVEL JAB',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.07 },
        windupPose: 'GUARD',
        strikePose: 'JAB',
        chamberPose: 'JAB_TO_BODY_CHAMBER',
        windupMs: 620,
        strikeMs: 130,
        transitionMs: 130,
        damage: 20,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'BODY_SHOT',
        name: 'SHOVEL BODY HOOK',
        arm: 'LEFT',
        targetRegion: 'RIBS',
        requiredDefense: 'HIGH_GUARD_BLOCK',
        alternativeDefense: 'DUCK',
        screenTargetOffset: { x: 0.09, y: 0.19 },
        windupPose: 'JAB_TO_BODY_CHAMBER',
        strikePose: 'BODY_SHOT_IMPACT',
        chamberPose: null,
        windupMs: 680,
        strikeMs: 170,
        transitionMs: 0,
        damage: 45,
        isFeint: false
      }
    ]
  },

  // 4. Counter Crush (Lead Hook -> Rising Uppercut)
  COUNTER_CRUSH: {
    id: 'COUNTER_CRUSH',
    name: 'COUNTER CRUSH',
    shortName: 'HOOK TO UPPER',
    description: 'Intercepts aggression with a horizontal lead hook that rolls directly into a rising vertical chin uppercut.',
    flavor: 'AGGRESSION PUNISH',
    archetype: 'COUNTER_PUNCHER',
    tacticalCounters: ['HABIT_DUCK', 'HABIT_AGGRESSIVE_COUNTER'],
    punishWindowBonusMs: 1300,
    superBonus: 45,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_HOOK',
        name: 'LEAD HOOK',
        arm: 'LEFT',
        targetRegion: 'RIGHT_TEMPLE',
        requiredDefense: 'DUCK',
        alternativeDefense: 'SLIP_RIGHT',
        screenTargetOffset: { x: 0.12, y: -0.08 },
        windupPose: 'GUARD',
        strikePose: 'HOOK',
        chamberPose: 'HOOK_TO_UPPERCUT_CHAMBER',
        windupMs: 660,
        strikeMs: 150,
        transitionMs: 130,
        damage: 38,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'UPPERCUT',
        name: 'RISING UPPERCUT',
        arm: 'RIGHT',
        targetRegion: 'UNDER_CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: 0.03 },
        windupPose: 'HOOK_TO_UPPERCUT_CHAMBER',
        strikePose: 'UPPERCUT_IMPACT',
        chamberPose: null,
        windupMs: 680,
        strikeMs: 160,
        transitionMs: 0,
        damage: 52,
        isFeint: false
      }
    ]
  },

  // 5. Feint & Overhand (Lead Shoulder Stutter -> Looping Overhand smash)
  FEINT_OVERHAND: {
    id: 'FEINT_OVERHAND',
    name: 'FEINT & OVERHAND',
    shortName: 'FEINT SMASH',
    description: 'Fake twitch draws an early slip or reaction, then detonates a heavy over-the-top overhand missile.',
    flavor: 'MIND GAME',
    archetype: 'TACTICAL_ADAPTIVE',
    tacticalCounters: ['HABIT_PREMATURE_EVASION', 'HABIT_SLIP_RIGHT'],
    punishWindowBonusMs: 1400,
    superBonus: 50,
    steps: [
      {
        stepIndex: 0,
        attackId: 'FEINT_JAB',
        name: 'SHOULDER FEINT',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'NONE',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'GUARD',
        strikePose: 'FEINT_JAB_IMPACT',
        chamberPose: 'FEINT_STUTTER_CHAMBER',
        windupMs: 480,
        strikeMs: 110,
        transitionMs: 120,
        damage: 0,
        isFeint: true
      },
      {
        stepIndex: 1,
        attackId: 'OVERHAND',
        name: 'LOOPING OVERHAND',
        arm: 'RIGHT',
        targetRegion: 'FOREHEAD',
        requiredDefense: 'DUCK',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: -0.04, y: -0.14 },
        windupPose: 'FEINT_STUTTER_CHAMBER',
        strikePose: 'OVERHAND_IMPACT',
        chamberPose: null,
        windupMs: 760,
        strikeMs: 170,
        transitionMs: 0,
        damage: 55,
        isFeint: false
      }
    ]
  },

  // 6. Heavy Pressure (4-piece flurry: Jab -> Cross -> Hook -> Cross)
  HEAVY_PRESSURE: {
    id: 'HEAVY_PRESSURE',
    name: 'HEAVY PRESSURE FLURRY',
    shortName: '4-PIECE FLURRY',
    description: 'A relentless 4-punch championship barrage. Seamless kinetic chaining leaves no room to breathe.',
    flavor: 'RELENTLESS ASSAULT',
    archetype: 'PRESSURE_COMBOS',
    tacticalCounters: ['HABIT_TURTLE', 'HABIT_NEUTRAL'],
    punishWindowBonusMs: 1600,
    superBonus: 60,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_JAB',
        name: 'LEAD JAB',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.06 },
        windupPose: 'GUARD',
        strikePose: 'JAB',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 620,
        strikeMs: 120,
        transitionMs: 110,
        damage: 18,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'RIGHT_CROSS',
        name: 'POWER CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: 'CROSS_TO_HOOK_CHAMBER',
        windupMs: 600,
        strikeMs: 130,
        transitionMs: 110,
        damage: 28,
        isFeint: false
      },
      {
        stepIndex: 2,
        attackId: 'LEFT_HOOK',
        name: 'LEAD HOOK',
        arm: 'LEFT',
        targetRegion: 'RIGHT_TEMPLE',
        requiredDefense: 'DUCK',
        alternativeDefense: 'SLIP_RIGHT',
        screenTargetOffset: { x: 0.12, y: -0.08 },
        windupPose: 'CROSS_TO_HOOK_CHAMBER',
        strikePose: 'HOOK',
        chamberPose: 'HOOK_TO_CROSS_CHAMBER',
        windupMs: 640,
        strikeMs: 140,
        transitionMs: 110,
        damage: 34,
        isFeint: false
      },
      {
        stepIndex: 3,
        attackId: 'RIGHT_CROSS',
        name: 'FINISHING CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'HOOK_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: null,
        windupMs: 680,
        strikeMs: 160,
        transitionMs: 0,
        damage: 46,
        isFeint: false
      }
    ]
  },

  // 7. The Slip-Trap (Aggressive Counter)
  SLIP_TRAP: {
    id: 'SLIP_TRAP',
    name: 'THE SLIP-TRAP',
    shortName: 'SLIP-TRAP',
    description: 'Blinding 1-2 forces guard reaction, followed by an elusive slip dodging high punches, chambering a devastating Heavy Rear Hook with guard-breaking force.',
    flavor: 'AGGRESSIVE COUNTER',
    archetype: 'COUNTER_PUNCHER',
    tacticalCounters: ['HABIT_HIGH_GUARD', 'HABIT_TURTLE', 'HABIT_AGGRESSIVE_COUNTER'],
    punishWindowBonusMs: 1400,
    superBonus: 50,
    steps: [
      {
        stepIndex: 0,
        attackId: 'LEFT_JAB',
        name: 'LEAD JAB',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.06 },
        windupPose: 'GUARD',
        strikePose: 'JAB',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 620,
        strikeMs: 120,
        transitionMs: 110,
        damage: 18,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'RIGHT_CROSS',
        name: 'STRAIGHT CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: 'SLIP_LEFT',
        windupMs: 600,
        strikeMs: 130,
        transitionMs: 120,
        damage: 28,
        isFeint: false
      },
      {
        stepIndex: 2,
        attackId: 'FEINT_JAB',
        name: 'QUICK SLIP',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'NONE',
        alternativeDefense: 'NONE',
        screenTargetOffset: { x: 0.0, y: 0.0 },
        windupPose: 'SLIP_LEFT',
        strikePose: 'SLIP_LEFT',
        chamberPose: 'RIGHT_HOOK_WINDUP',
        windupMs: 480,
        strikeMs: 100,
        transitionMs: 130,
        damage: 0,
        isFeint: true,
        isSlipDodge: true
      },
      {
        stepIndex: 3,
        attackId: 'RIGHT_HOOK',
        name: 'HEAVY REAR HOOK',
        arm: 'RIGHT',
        targetRegion: 'LEFT_TEMPLE',
        requiredDefense: 'DUCK',
        alternativeDefense: 'SLIP_LEFT',
        screenTargetOffset: { x: -0.12, y: -0.08 },
        windupPose: 'RIGHT_HOOK_WINDUP',
        strikePose: 'RIGHT_HOOK_IMPACT',
        chamberPose: null,
        windupMs: 820,
        strikeMs: 180,
        transitionMs: 0,
        damage: 58,
        isFeint: false,
        isBlockBreak: true,
        hasInterruptibleOpening: true
      }
    ]
  },

  // 8. The Turtle & Burst (Defensive Mix-up)
  TURTLE_BURST: {
    id: 'TURTLE_BURST',
    name: 'THE TURTLE & BURST',
    shortName: 'TURTLE & BURST',
    description: 'Deceptive shell absorbs high attacks while leaving the body vulnerable, exploding outward with a snap uppercut, cross, and heavy digging body hook.',
    flavor: 'DEFENSIVE MIX-UP',
    archetype: 'COUNTER_PUNCHER',
    tacticalCounters: ['HABIT_DUCK', 'HABIT_NEUTRAL'],
    punishWindowBonusMs: 1500,
    superBonus: 50,
    steps: [
      {
        stepIndex: 0,
        attackId: 'HIGH_GUARD_BLOCK',
        name: 'STATIONARY HIGH GUARD',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'NONE',
        alternativeDefense: 'NONE',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'HIGH_GUARD_BLOCK',
        strikePose: 'HIGH_GUARD_BLOCK',
        chamberPose: 'HOOK_TO_UPPERCUT_CHAMBER',
        windupMs: 580,
        strikeMs: 100,
        transitionMs: 110,
        damage: 0,
        isFeint: true,
        isTurtleHold: true,
        bodyVulnerable: true
      },
      {
        stepIndex: 1,
        attackId: 'UPPERCUT',
        name: 'LEAD UPPERCUT',
        arm: 'LEFT',
        targetRegion: 'UNDER_CHIN',
        requiredDefense: 'SLIP_RIGHT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: 0.03 },
        windupPose: 'HOOK_TO_UPPERCUT_CHAMBER',
        strikePose: 'UPPERCUT_IMPACT',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 620,
        strikeMs: 130,
        transitionMs: 110,
        damage: 32,
        isFeint: false
      },
      {
        stepIndex: 2,
        attackId: 'RIGHT_CROSS',
        name: 'REAR CROSS',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: 'JAB_TO_BODY_CHAMBER',
        windupMs: 600,
        strikeMs: 140,
        transitionMs: 120,
        damage: 34,
        isFeint: false
      },
      {
        stepIndex: 3,
        attackId: 'BODY_SHOT',
        name: 'LEAD BODY HOOK',
        arm: 'LEFT',
        targetRegion: 'RIBS',
        requiredDefense: 'HIGH_GUARD_BLOCK',
        alternativeDefense: 'DUCK',
        screenTargetOffset: { x: 0.09, y: 0.19 },
        windupPose: 'JAB_TO_BODY_CHAMBER',
        strikePose: 'BODY_SHOT_IMPACT',
        chamberPose: null,
        windupMs: 720,
        strikeMs: 170,
        transitionMs: 0,
        damage: 48,
        isFeint: false,
        extendedRecoveryOnMiss: true
      }
    ]
  },

  // 9. The Shell-Cracker (Spacing Pressure)
  SHELL_CRACKER: {
    id: 'SHELL_CRACKER',
    name: 'THE SHELL-CRACKER',
    shortName: 'SHELL-CRACKER',
    description: 'High-low change followed by tactical retreat, exploding forward into a lunging straight that shatters guards if blocked.',
    flavor: 'SPACING PRESSURE',
    archetype: 'PRESSURE_COMBOS',
    tacticalCounters: ['HABIT_HIGH_GUARD', 'HABIT_TURTLE'],
    punishWindowBonusMs: 1600,
    superBonus: 55,
    steps: [
      {
        stepIndex: 0,
        attackId: 'BODY_SHOT',
        name: 'LEAD BODY JAB',
        arm: 'LEFT',
        targetRegion: 'RIBS',
        requiredDefense: 'HIGH_GUARD_BLOCK',
        alternativeDefense: 'DUCK',
        screenTargetOffset: { x: 0.08, y: 0.18 },
        windupPose: 'JAB_TO_BODY_CHAMBER',
        strikePose: 'BODY_SHOT_IMPACT',
        chamberPose: 'FEINT_STUTTER_CHAMBER',
        windupMs: 640,
        strikeMs: 130,
        transitionMs: 120,
        damage: 22,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'OVERHAND',
        name: 'REAR OVERHAND',
        arm: 'RIGHT',
        targetRegion: 'FOREHEAD',
        requiredDefense: 'DUCK',
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: -0.04, y: -0.14 },
        windupPose: 'FEINT_STUTTER_CHAMBER',
        strikePose: 'OVERHAND_IMPACT',
        chamberPose: 'GUARD',
        windupMs: 700,
        strikeMs: 160,
        transitionMs: 130,
        damage: 40,
        isFeint: false
      },
      {
        stepIndex: 2,
        attackId: 'FEINT_JAB',
        name: 'SPACING RETREAT',
        arm: 'LEFT',
        targetRegion: 'CHIN',
        requiredDefense: 'NONE',
        alternativeDefense: 'NONE',
        screenTargetOffset: { x: 0.0, y: 0.0 },
        windupPose: 'GUARD',
        strikePose: 'GUARD',
        chamberPose: 'JAB_TO_CROSS_CHAMBER',
        windupMs: 520,
        strikeMs: 100,
        transitionMs: 130,
        damage: 0,
        isFeint: true,
        isRetreatDodge: true
      },
      {
        stepIndex: 3,
        attackId: 'RIGHT_CROSS',
        name: 'LUNGING STRAIGHT',
        arm: 'RIGHT',
        targetRegion: 'CHIN',
        requiredDefense: 'SLIP_LEFT',
        alternativeDefense: 'SLIP_RIGHT',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'JAB_TO_CROSS_CHAMBER',
        strikePose: 'CROSS',
        chamberPose: null,
        windupMs: 800,
        strikeMs: 180,
        transitionMs: 0,
        damage: 55,
        isFeint: false,
        isBlockBreak: true,
        overextendsOnEvade: true
      }
    ]
  }
};

/**
 * Retrieves combo definition by ID
 */
export function getCombo(id) {
  return COMBO_DEFINITIONS[id] || null;
}

/**
 * Returns all combos as array
 */
export function getAllCombos() {
  return Object.values(COMBO_DEFINITIONS);
}

/**
 * Returns combos available for a given difficulty tier
 */
export function getCombosForDifficulty(difficulty = 'PROFESSIONAL') {
  const diff = difficulty.toUpperCase();
  if (diff === 'CHAMPION') {
    // Champion has access to all 3 new combos + all standard combos
    return [
      COMBO_DEFINITIONS.SLIP_TRAP,
      COMBO_DEFINITIONS.TURTLE_BURST,
      COMBO_DEFINITIONS.SHELL_CRACKER,
      COMBO_DEFINITIONS.ONE_TWO,
      COMBO_DEFINITIONS.ONE_TWO_THREE,
      COMBO_DEFINITIONS.BODY_HEAD_TRAP,
      COMBO_DEFINITIONS.COUNTER_CRUSH,
      COMBO_DEFINITIONS.FEINT_OVERHAND,
      COMBO_DEFINITIONS.HEAVY_PRESSURE
    ];
  } else if (diff === 'PROFESSIONAL' || diff === 'PRO') {
    // Professional has access to 2 of the new combos (Slip-Trap & Turtle & Burst) + core combos
    return [
      COMBO_DEFINITIONS.SLIP_TRAP,
      COMBO_DEFINITIONS.TURTLE_BURST,
      COMBO_DEFINITIONS.ONE_TWO,
      COMBO_DEFINITIONS.ONE_TWO_THREE,
      COMBO_DEFINITIONS.BODY_HEAD_TRAP,
      COMBO_DEFINITIONS.COUNTER_CRUSH,
      COMBO_DEFINITIONS.FEINT_OVERHAND
    ];
  } else {
    // Novice / Rookie: simpler combos with clear telegraphs
    return [
      COMBO_DEFINITIONS.ONE_TWO,
      COMBO_DEFINITIONS.BODY_HEAD_TRAP,
      COMBO_DEFINITIONS.TURTLE_BURST
    ];
  }
}

/**
 * Returns combos tailored for a specific fight archetype
 */
export function getCombosByArchetype(archetype) {
  return Object.values(COMBO_DEFINITIONS).filter(c => c.archetype === archetype);
}

/**
 * Returns the best counter-combo designed to punish a player's detected defensive habit
 */
export function getCounterComboForHabit(habit, difficulty = 'PROFESSIONAL') {
  const availableCombos = getCombosForDifficulty(difficulty);
  const matches = availableCombos.filter(c => c.tacticalCounters.includes(habit));
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }
  return COMBO_DEFINITIONS.ONE_TWO;
}
