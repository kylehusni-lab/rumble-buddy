// Validation rules for conflicting Rumble prop picks

export interface ConflictRule {
  propId: string;
  conflictsWith: string[];
  reason: string;
}

// Define conflicts: if you pick someone for first_elimination, they can't be picked for these
export const CONFLICT_RULES: ConflictRule[] = [
  {
    propId: 'first_elimination',
    conflictsWith: ['most_eliminations', 'longest_time', 'final_four_1', 'final_four_2', 'final_four_3', 'final_four_4'],
    reason: 'Cannot have most eliminations, longest time, or be in Final Four if eliminated first',
  },
  {
    propId: 'entrant_1',
    conflictsWith: ['entrant_30'],
    reason: 'Same person cannot enter at both #1 and #30',
  },
  {
    propId: 'entrant_30',
    conflictsWith: ['entrant_1'],
    reason: 'Same person cannot enter at both #1 and #30',
  },
  {
    propId: 'most_eliminations',
    conflictsWith: ['first_elimination'],
    reason: 'Cannot be eliminated first if they have the most eliminations',
  },
  {
    propId: 'longest_time',
    conflictsWith: ['first_elimination'],
    reason: 'Cannot be eliminated first if they last the longest',
  },
];

/**
 * Get wrestlers that are blocked from being picked for a specific prop
 * based on existing picks
 */
export function getBlockedWrestlers(
  gender: 'mens' | 'womens',
  propId: string,
  currentPicks: Record<string, string | null>
): Set<string> {
  const blocked = new Set<string>();
  
  // Find all rules where this propId is in the conflictsWith array
  CONFLICT_RULES.forEach((rule) => {
    if (rule.conflictsWith.includes(propId)) {
      // If the source prop has a pick, block that wrestler
      const sourceMatchId = `${gender}_${rule.propId}`;
      const sourcePick = currentPicks[sourceMatchId];
      if (sourcePick) {
        blocked.add(sourcePick);
      }
    }
  });
  
  // Also check Final Four slots for first_elimination conflicts
  if (propId === 'first_elimination') {
    for (let i = 1; i <= 4; i++) {
      const ffPick = currentPicks[`${gender}_final_four_${i}`];
      if (ffPick) {
        blocked.add(ffPick);
      }
    }
  }
  
  // Block first_elimination pick from Final Four
  if (propId.startsWith('final_four_')) {
    const firstElimPick = currentPicks[`${gender}_first_elimination`];
    if (firstElimPick) {
      blocked.add(firstElimPick);
    }
  }
  
  return blocked;
}

/**
 * Get a human-readable reason why a wrestler is blocked
 */
export function getBlockedReason(
  gender: 'mens' | 'womens',
  propId: string,
  wrestler: string,
  currentPicks: Record<string, string | null>
): string | null {
  // Check each conflicting pick
  for (const rule of CONFLICT_RULES) {
    if (rule.conflictsWith.includes(propId)) {
      const sourceMatchId = `${gender}_${rule.propId}`;
      if (currentPicks[sourceMatchId] === wrestler) {
        return `Already picked for ${formatPropName(rule.propId)}`;
      }
    }
  }
  
  // Check Final Four vs first_elimination
  if (propId === 'first_elimination') {
    for (let i = 1; i <= 4; i++) {
      if (currentPicks[`${gender}_final_four_${i}`] === wrestler) {
        return 'Already picked for Final Four';
      }
    }
  }
  
  if (propId.startsWith('final_four_') && currentPicks[`${gender}_first_elimination`] === wrestler) {
    return 'Already picked as First Elimination';
  }
  
  return null;
}

function formatPropName(propId: string): string {
  const names: Record<string, string> = {
    'first_elimination': 'First Elimination',
    'most_eliminations': 'Most Eliminations',
    'longest_time': 'Iron Man/Woman',
    'entrant_1': '#1 Entrant',
    'entrant_30': '#30 Entrant',
  };
  return names[propId] || propId;
}

/**
 * Count total completed picks across all cards
 */
export function countCompletedPicks(picks: Record<string, any>, cardConfig: readonly any[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  
  cardConfig.forEach((card) => {
    if (card.type === 'match' || card.type === 'rumble-winner') {
      total++;
      if (picks[card.id]) completed++;
    } else if (card.type === 'chaos-props') {
      // 6 chaos props per gender
      total += 6;
      for (let i = 1; i <= 6; i++) {
        if (picks[`${card.gender}_chaos_prop_${i}`]) completed++;
      }
    } else if (card.type === 'rumble-props') {
      // 5 wrestler props + 4 final four = 9
      total += 9;
      const wrestlerPropIds = ['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'];
      wrestlerPropIds.forEach((propId) => {
        if (picks[`${card.gender}_${propId}`]) completed++;
      });
      for (let i = 1; i <= 4; i++) {
        if (picks[`${card.gender}_final_four_${i}`]) completed++;
      }
    }
  });
  
  return { completed, total };
}
