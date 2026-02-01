// WrestleMania 41 Configuration
// April 18-19, 2026 - Las Vegas, Nevada

import type { EventConfig, MatchConfig, PropConfig, ScoringConfig } from './types';

export const MANIA_41_MATCHES: MatchConfig[] = [
  // Night 1 Matches - Placeholder until card is announced
  { id: 'mania_n1_match_1', title: 'Match 1 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { id: 'mania_n1_match_2', title: 'Match 2 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { id: 'mania_n1_match_3', title: 'Match 3 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { id: 'mania_n1_match_4', title: 'Match 4 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { id: 'mania_n1_match_5', title: 'Match 5 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  // Night 2 Matches - Placeholder until card is announced
  { id: 'mania_n2_match_1', title: 'Match 1 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { id: 'mania_n2_match_2', title: 'Match 2 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { id: 'mania_n2_match_3', title: 'Match 3 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { id: 'mania_n2_match_4', title: 'Match 4 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { id: 'mania_n2_match_5', title: 'Match 5 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
];

export const MANIA_41_PROPS: PropConfig[] = [
  // Night 1 Props
  { id: 'mania_n1_prop_1', title: 'Main Event Length', question: 'Night 1 main event runs over 30 minutes?', shortName: 'N1 Main Event O/U', category: 'general' },
  { id: 'mania_n1_prop_2', title: 'Title Changes', question: 'More than 2 title changes on Night 1?', shortName: 'N1 Title Changes', category: 'general' },
  { id: 'mania_n1_prop_3', title: 'Surprise Return', question: 'A legend or surprise return on Night 1?', shortName: 'N1 Surprise Return', category: 'general' },
  // Night 2 Props
  { id: 'mania_n2_prop_1', title: 'Main Event Length', question: 'Night 2 main event runs over 30 minutes?', shortName: 'N2 Main Event O/U', category: 'general' },
  { id: 'mania_n2_prop_2', title: 'Title Changes', question: 'More than 2 title changes on Night 2?', shortName: 'N2 Title Changes', category: 'general' },
  { id: 'mania_n2_prop_3', title: 'Surprise Return', question: 'A legend or surprise return on Night 2?', shortName: 'N2 Surprise Return', category: 'general' },
  // Cross-Night Props
  { id: 'mania_prop_celebrity', title: 'Celebrity Appearance', question: 'A celebrity appears in a match across both nights?', shortName: 'Celebrity', category: 'general' },
  { id: 'mania_prop_total_titles', title: 'Total Title Changes', question: 'More than 4 title changes across both nights?', shortName: 'Total Titles O/U', category: 'general' },
];

export const MANIA_41_SCORING: ScoringConfig = {
  UNDERCARD_WINNER: 25, // Match winner points
  PROP_BET: 10,
};

export const MANIA_41_CARD_CONFIG = [
  // Night 1 Matches
  { type: 'match' as const, id: 'mania_n1_match_1', title: 'Night 1: Match 1 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { type: 'match' as const, id: 'mania_n1_match_2', title: 'Night 1: Match 2 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { type: 'match' as const, id: 'mania_n1_match_3', title: 'Night 1: Match 3 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { type: 'match' as const, id: 'mania_n1_match_4', title: 'Night 1: Match 4 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  { type: 'match' as const, id: 'mania_n1_match_5', title: 'Night 1: Match 5 (TBD)', options: ['TBD', 'TBD'], night: 'night_1' },
  // Night 1 Props Card
  { type: 'prop' as const, id: 'mania_n1_props', title: 'Night 1 Props', night: 'night_1' },
  // Night 2 Matches
  { type: 'match' as const, id: 'mania_n2_match_1', title: 'Night 2: Match 1 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { type: 'match' as const, id: 'mania_n2_match_2', title: 'Night 2: Match 2 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { type: 'match' as const, id: 'mania_n2_match_3', title: 'Night 2: Match 3 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { type: 'match' as const, id: 'mania_n2_match_4', title: 'Night 2: Match 4 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  { type: 'match' as const, id: 'mania_n2_match_5', title: 'Night 2: Match 5 (TBD)', options: ['TBD', 'TBD'], night: 'night_2' },
  // Night 2 Props Card
  { type: 'prop' as const, id: 'mania_n2_props', title: 'Night 2 Props', night: 'night_2' },
  // Cross-Night Props
  { type: 'prop' as const, id: 'mania_cross_props', title: 'WrestleMania Props' },
];

export const MANIA_41_CONFIG: EventConfig = {
  id: 'mania_41',
  title: 'WrestleMania 41',
  type: 'mania',
  nights: [
    {
      id: 'night_1',
      label: 'Night 1',
      date: new Date('2026-04-18T19:00:00-04:00'), // 7pm ET
    },
    {
      id: 'night_2',
      label: 'Night 2',
      date: new Date('2026-04-19T19:00:00-04:00'), // 7pm ET
    },
  ],
  venue: 'Allegiant Stadium',
  location: 'Las Vegas, Nevada',
  matches: MANIA_41_MATCHES,
  props: MANIA_41_PROPS,
  scoring: MANIA_41_SCORING,
  cardConfig: MANIA_41_CARD_CONFIG,
  // 10 matches + 8 props = 18 picks
  totalPicks: 18,
};
