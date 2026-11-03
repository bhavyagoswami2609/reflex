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
        windupMs: 440,
        strikeMs: 140,
        transitionMs: 130, // Fast kinetic snap into cross chamber
        damage: 35,
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
        windupPose: 'JAB_TO_CROSS_CHAMBER', // Fires directly from loaded rear hip!
        strikePose: 'CROSS',
        chamberPose: null, // Final hit returns to guard
        windupMs: 340,
        strikeMs: 160,
        transitionMs: 0,
        damage: 65,
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
        windupMs: 420,
        strikeMs: 130,
        transitionMs: 120,
        damage: 30,
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
        chamberPose: 'CROSS_TO_HOOK_CHAMBER', // Cross follow-through coils lead shoulder
        windupMs: 320,
        strikeMs: 150,
        transitionMs: 140,
        damage: 55,
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
        windupPose: 'CROSS_TO_HOOK_CHAMBER', // Sweeps directly from coiled lead hip!
        strikePose: 'HOOK',
        chamberPose: null,
        windupMs: 320,
        strikeMs: 160,
        transitionMs: 0,
        damage: 75,
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
        chamberPose: 'JAB_TO_BODY_CHAMBER', // Level drop & elbow tuck
        windupMs: 440,
        strikeMs: 130,
        transitionMs: 140,
        damage: 30,
        isFeint: false
      },
      {
        stepIndex: 1,
        attackId: 'BODY_SHOT',
        name: 'SHOVEL BODY HOOK',
        arm: 'LEFT',
        targetRegion: 'RIBS',
        requiredDefense: 'HIGH_GUARD_BLOCK', // Must drop elbows or duck
        alternativeDefense: 'DUCK',
        screenTargetOffset: { x: 0.09, y: 0.19 },
        windupPose: 'JAB_TO_BODY_CHAMBER',
        strikePose: 'BODY_SHOT_IMPACT',
        chamberPose: null,
        windupMs: 340,
        strikeMs: 170,
        transitionMs: 0,
        damage: 70,
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
        chamberPose: 'HOOK_TO_UPPERCUT_CHAMBER', // Weight sinks onto rear hip
        windupMs: 400,
        strikeMs: 150,
        transitionMs: 130,
        damage: 65,
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
        windupMs: 330,
        strikeMs: 160,
        transitionMs: 0,
        damage: 90,
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
        requiredDefense: 'NONE', // Feint itself deals no damage, but warns player
        alternativeDefense: 'HIGH_GUARD_BLOCK',
        screenTargetOffset: { x: 0.0, y: -0.05 },
        windupPose: 'GUARD',
        strikePose: 'FEINT_JAB_IMPACT',
        chamberPose: 'FEINT_STUTTER_CHAMBER', // Stutters and coils rear shoulder
        windupMs: 260,
        strikeMs: 110,
        transitionMs: 110,
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
        windupMs: 360,
        strikeMs: 170,
        transitionMs: 0,
        damage: 95,
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
        windupMs: 380,
        strikeMs: 120,
        transitionMs: 110,
        damage: 30,
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
        windupMs: 300,
        strikeMs: 130,
        transitionMs: 110,
        damage: 45,
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
        chamberPose: 'HOOK_TO_CROSS_CHAMBER', // Hook follow-through coils right cross again
        windupMs: 300,
        strikeMs: 140,
        transitionMs: 110,
        damage: 55,
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
        windupMs: 320,
        strikeMs: 170,
        transitionMs: 0,
        damage: 80,
        isFeint: false
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
 * Returns combos tailored for a specific fight archetype
 */
export function getCombosByArchetype(archetype) {
  return Object.values(COMBO_DEFINITIONS).filter(c => c.archetype === archetype);
}

/**
 * Returns the best counter-combo designed to punish a player's detected defensive habit
 */
export function getCounterComboForHabit(habit) {
  const matches = Object.values(COMBO_DEFINITIONS).filter(c => c.tacticalCounters.includes(habit));
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }
  return COMBO_DEFINITIONS.ONE_TWO;
}
