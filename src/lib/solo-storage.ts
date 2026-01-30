// Solo mode localStorage utilities

import { SCORING, CARD_CONFIG, CHAOS_PROPS, RUMBLE_PROPS, FINAL_FOUR_SLOTS } from './constants';

const SOLO_PICKS_KEY = 'rumble_solo_picks';
const SOLO_RESULTS_KEY = 'rumble_solo_results';
const SOLO_SESSION_KEY = 'rumble_solo_session';
const SOLO_MENS_NUMBERS_KEY = 'rumble_solo_mens_numbers';
const SOLO_WOMENS_NUMBERS_KEY = 'rumble_solo_womens_numbers';

export interface SoloSession {
  displayName: string;
  createdAt: string;
}

export interface SoloRumbleNumber {
  number: number;
  wrestler_name: string | null;
  entry_timestamp: string | null;
  elimination_timestamp: string | null;
  eliminated_by_number: number | null;
}

// Session management
export function getSoloSession(): SoloSession | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SOLO_SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as SoloSession;
  } catch {
    return null;
  }
}

export function setSoloSession(session: SoloSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOLO_SESSION_KEY, JSON.stringify(session));
}

export function clearSoloSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SOLO_SESSION_KEY);
  localStorage.removeItem(SOLO_PICKS_KEY);
  localStorage.removeItem(SOLO_RESULTS_KEY);
  localStorage.removeItem(SOLO_MENS_NUMBERS_KEY);
  localStorage.removeItem(SOLO_WOMENS_NUMBERS_KEY);
}

// Rumble number management
export function initSoloRumbleNumbers(): SoloRumbleNumber[] {
  return Array.from({ length: 30 }, (_, i) => ({
    number: i + 1,
    wrestler_name: null,
    entry_timestamp: null,
    elimination_timestamp: null,
    eliminated_by_number: null,
  }));
}

export function saveSoloRumbleNumbers(gender: 'mens' | 'womens', numbers: SoloRumbleNumber[]): void {
  if (typeof window === 'undefined') return;
  const key = gender === 'mens' ? SOLO_MENS_NUMBERS_KEY : SOLO_WOMENS_NUMBERS_KEY;
  localStorage.setItem(key, JSON.stringify(numbers));
}

export function getSoloRumbleNumbers(gender: 'mens' | 'womens'): SoloRumbleNumber[] {
  if (typeof window === 'undefined') return initSoloRumbleNumbers();
  const key = gender === 'mens' ? SOLO_MENS_NUMBERS_KEY : SOLO_WOMENS_NUMBERS_KEY;
  const data = localStorage.getItem(key);
  if (!data) return initSoloRumbleNumbers();
  try {
    return JSON.parse(data) as SoloRumbleNumber[];
  } catch {
    return initSoloRumbleNumbers();
  }
}

// Pick management
export function saveSoloPicks(picks: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOLO_PICKS_KEY, JSON.stringify(picks));
}

export function getSoloPicks(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(SOLO_PICKS_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data) as Record<string, string>;
  } catch {
    return {};
  }
}

// Result management
export function saveSoloResults(results: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOLO_RESULTS_KEY, JSON.stringify(results));
}

export function getSoloResults(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(SOLO_RESULTS_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data) as Record<string, string>;
  } catch {
    return {};
  }
}

// Score calculation
export function calculateSoloScore(
  picks: Record<string, string>,
  results: Record<string, string>
): number {
  let score = 0;

  // Score undercard matches
  CARD_CONFIG.forEach((card) => {
    if (card.type === 'match') {
      const pick = picks[card.id];
      const result = results[card.id];
      if (pick && result && pick === result) {
        score += SCORING.UNDERCARD_WINNER;
      }
    }
  });

  // Score rumble winners
  const mensWinnerPick = picks['mens_rumble_winner'];
  const mensWinnerResult = results['mens_rumble_winner'];
  if (mensWinnerPick && mensWinnerResult && mensWinnerPick === mensWinnerResult) {
    score += SCORING.RUMBLE_WINNER_PICK;
  }

  const womensWinnerPick = picks['womens_rumble_winner'];
  const womensWinnerResult = results['womens_rumble_winner'];
  if (womensWinnerPick && womensWinnerResult && womensWinnerPick === womensWinnerResult) {
    score += SCORING.RUMBLE_WINNER_PICK;
  }

  // Score chaos props
  ['mens', 'womens'].forEach((gender) => {
    CHAOS_PROPS.forEach((_, index) => {
      const matchId = `${gender}_chaos_prop_${index + 1}`;
      const pick = picks[matchId];
      const result = results[matchId];
      if (pick && result && pick === result) {
        score += SCORING.PROP_BET;
      }
    });
  });

  // Score rumble props
  ['mens', 'womens'].forEach((gender) => {
    RUMBLE_PROPS.forEach((prop) => {
      const matchId = `${gender}_${prop.id}`;
      const pick = picks[matchId];
      const result = results[matchId];
      if (pick && result && pick === result) {
        if (prop.id === 'first_elimination') {
          score += SCORING.FIRST_ELIMINATION;
        } else if (prop.id === 'most_eliminations') {
          score += SCORING.MOST_ELIMINATIONS;
        } else if (prop.id === 'longest_time') {
          score += SCORING.LONGEST_TIME;
        } else if (prop.id.startsWith('entrant_')) {
          score += SCORING.ENTRANT_GUESS;
        }
      }
    });

    // Score Final Four picks
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      const matchId = `${gender}_final_four_${i}`;
      const pick = picks[matchId];
      // Check if pick is in any of the actual final four results
      const finalFourResults = [];
      for (let j = 1; j <= 4; j++) {
        const resultId = `${gender}_final_four_${j}`;
        if (results[resultId]) {
          finalFourResults.push(results[resultId]);
        }
      }
      if (pick && finalFourResults.includes(pick)) {
        score += SCORING.FINAL_FOUR_PICK;
      }
    }
  });

  return score;
}

// Get all scorable match IDs
export function getAllMatchIds(): string[] {
  const matchIds: string[] = [];

  // Undercard matches
  CARD_CONFIG.forEach((card) => {
    if (card.type === 'match') {
      matchIds.push(card.id);
    }
  });

  // Rumble winners
  matchIds.push('mens_rumble_winner', 'womens_rumble_winner');

  // Chaos props
  ['mens', 'womens'].forEach((gender) => {
    CHAOS_PROPS.forEach((_, index) => {
      matchIds.push(`${gender}_chaos_prop_${index + 1}`);
    });
  });

  // Rumble props
  ['mens', 'womens'].forEach((gender) => {
    RUMBLE_PROPS.forEach((prop) => {
      matchIds.push(`${gender}_${prop.id}`);
    });
    for (let i = 1; i <= FINAL_FOUR_SLOTS; i++) {
      matchIds.push(`${gender}_final_four_${i}`);
    }
  });

  return matchIds;
}
