// Event type system for multi-event platform support

export type EventType = 'rumble' | 'mania' | 'standard_ple';

export interface EventNight {
  id: string;
  label: string;
  date: Date;
}

export interface MatchConfig {
  id: string;
  title: string;
  options: readonly string[] | string[];
  matchType?: 'singles' | 'tag' | 'rumble' | 'ladder' | 'other';
  night?: string; // For multi-night events
}

export interface PropConfig {
  id: string;
  title: string;
  question: string;
  shortName: string;
  category?: 'chaos' | 'rumble' | 'general';
  type?: 'wrestler' | 'yesno';
}

export interface RumblePropConfig {
  id: string;
  title: string;
  question: string;
  type: 'wrestler' | 'yesno';
}

export interface ScoringConfig {
  UNDERCARD_WINNER: number;
  PROP_BET: number;
  RUMBLE_WINNER_PICK?: number;
  RUMBLE_WINNER_NUMBER?: number;
  ELIMINATION?: number;
  IRON_MAN?: number;
  FINAL_FOUR?: number;
  JOBBER_PENALTY?: number;
  FIRST_ELIMINATION?: number;
  MOST_ELIMINATIONS?: number;
  LONGEST_TIME?: number;
  FINAL_FOUR_PICK?: number;
  ENTRANT_GUESS?: number;
  NO_SHOW_PROP?: number;
}

export interface CardConfig {
  type: 'match' | 'rumble-winner' | 'rumble-props' | 'chaos-props' | 'prop';
  id: string;
  title: string;
  options?: readonly string[] | string[];
  gender?: 'mens' | 'womens';
  night?: string;
}

export interface EventConfig {
  id: string;
  title: string;
  type: EventType;
  nights: EventNight[];
  venue: string;
  location: string;
  matches: MatchConfig[];
  props: PropConfig[];
  scoring: ScoringConfig;
  cardConfig: CardConfig[];
  totalPicks: number;
  // Rumble-specific (optional)
  mensEntrants?: readonly string[];
  womensEntrants?: readonly string[];
  rumbleProps?: readonly RumblePropConfig[];
  chaosProps?: readonly PropConfig[];
  matchIds?: Record<string, string>;
  finalFourSlots?: number;
}
