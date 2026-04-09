// WrestleMania 42 Configuration
// April 18-19, 2026 - Allegiant Stadium, Las Vegas, Nevada

import type { EventConfig, MatchConfig, PropConfig, ScoringConfig, CardConfig } from './types';

// ── Night 1 (Saturday) ──────────────────────────────────────────────

export const MANIA_42_NIGHT1_MATCHES: MatchConfig[] = [
  {
    id: 'wm42_n1_undisputed',
    title: 'Undisputed WWE Championship',
    options: ['Cody Rhodes', 'Randy Orton'],
    matchType: 'singles',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_womens_world',
    title: "Women's World Championship",
    options: ['Stephanie Vaquer', 'Liv Morgan'],
    matchType: 'singles',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_rollins_gunther',
    title: 'Seth Rollins vs. Gunther',
    options: ['Seth Rollins', 'Gunther'],
    matchType: 'singles',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_womens_ic',
    title: "Women's Intercontinental Championship",
    options: ['AJ Lee', 'Becky Lynch'],
    matchType: 'singles',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_womens_tag',
    title: "WWE Women's Tag Team Championship",
    options: [
      'Nia Jax & Lash Legend',
      'Charlotte Flair & Alexa Bliss',
      'Bayley & Lyra Valkyria',
      'The Bella Twins',
    ],
    matchType: 'other',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_unsanctioned',
    title: 'Unsanctioned Match',
    options: ['Jacob Fatu', 'Drew McIntyre'],
    matchType: 'singles',
    night: 'night_1',
  },
  {
    id: 'wm42_n1_sixman',
    title: 'Six-Man Tag Team Match',
    options: [
      'Logan Paul, Austin Theory & IShowSpeed',
      'The Usos & LA Knight',
    ],
    matchType: 'tag',
    night: 'night_1',
  },
];

// ── Night 2 (Sunday) ────────────────────────────────────────────────

export const MANIA_42_NIGHT2_MATCHES: MatchConfig[] = [
  {
    id: 'wm42_n2_whc',
    title: 'World Heavyweight Championship',
    options: ['CM Punk', 'Roman Reigns'],
    matchType: 'singles',
    night: 'night_2',
  },
  {
    id: 'wm42_n2_womens_wwe',
    title: "WWE Women's Championship",
    options: ['Jade Cargill', 'Rhea Ripley'],
    matchType: 'singles',
    night: 'night_2',
  },
  {
    id: 'wm42_n2_balor_dom',
    title: 'Finn Balor vs. Dominik Mysterio',
    options: ['Finn Balor', 'Dominik Mysterio'],
    matchType: 'singles',
    night: 'night_2',
  },
  {
    id: 'wm42_n2_us',
    title: 'United States Championship',
    options: ['Sami Zayn', 'Trick Williams'],
    matchType: 'singles',
    night: 'night_2',
  },
  {
    id: 'wm42_n2_femi_lesnar',
    title: 'Oba Femi vs. Brock Lesnar',
    options: ['Oba Femi', 'Brock Lesnar'],
    matchType: 'singles',
    night: 'night_2',
  },
  {
    id: 'wm42_n2_ic_ladder',
    title: 'Intercontinental Championship Ladder Match',
    options: [
      'Penta',
      "Je'Von Evans",
      'Dragon Lee',
      'JD McDonagh',
      'Rusev',
      'Rey Mysterio',
    ],
    matchType: 'ladder',
    night: 'night_2',
  },
];

export const MANIA_42_MATCHES: MatchConfig[] = [
  ...MANIA_42_NIGHT1_MATCHES,
  ...MANIA_42_NIGHT2_MATCHES,
];

// ── Props ────────────────────────────────────────────────────────────

export const MANIA_42_PROPS: PropConfig[] = [
  // Night 1 Props
  { id: 'wm42_n1_prop_main_length', title: 'Main Event Length', question: 'Night 1 main event runs over 30 minutes?', shortName: 'N1 Main Event O/U', category: 'general' },
  { id: 'wm42_n1_prop_title_changes', title: 'Night 1 Title Changes', question: 'More than 2 title changes on Night 1?', shortName: 'N1 Title Changes', category: 'general' },
  { id: 'wm42_n1_prop_surprise', title: 'Night 1 Surprise Return', question: 'A legend or surprise return on Night 1?', shortName: 'N1 Surprise', category: 'general' },
  // Night 2 Props
  { id: 'wm42_n2_prop_main_length', title: 'Main Event Length', question: 'Night 2 main event runs over 30 minutes?', shortName: 'N2 Main Event O/U', category: 'general' },
  { id: 'wm42_n2_prop_title_changes', title: 'Night 2 Title Changes', question: 'More than 2 title changes on Night 2?', shortName: 'N2 Title Changes', category: 'general' },
  { id: 'wm42_n2_prop_surprise', title: 'Night 2 Surprise Return', question: 'A legend or surprise return on Night 2?', shortName: 'N2 Surprise', category: 'general' },
  // Cross-Night Props
  { id: 'wm42_prop_celebrity', title: 'Celebrity Appearance', question: 'A celebrity appears in a match across both nights?', shortName: 'Celebrity', category: 'general' },
  { id: 'wm42_prop_total_titles', title: 'Total Title Changes', question: 'More than 4 title changes across both nights?', shortName: 'Total Titles O/U', category: 'general' },
];

// ── Scoring ──────────────────────────────────────────────────────────

export const MANIA_42_SCORING: ScoringConfig = {
  UNDERCARD_WINNER: 25,
  PROP_BET: 10,
};

// ── Card Config (pick-flow order) ────────────────────────────────────

export const MANIA_42_CARD_CONFIG: CardConfig[] = [
  // Night 1 Matches
  ...MANIA_42_NIGHT1_MATCHES.map((m) => ({
    type: 'match' as const,
    id: m.id,
    title: `Night 1: ${m.title}`,
    options: m.options,
    night: 'night_1',
  })),
  // Night 1 Props Card
  { type: 'prop' as const, id: 'wm42_n1_props', title: 'Night 1 Props', night: 'night_1' },
  // Night 2 Matches
  ...MANIA_42_NIGHT2_MATCHES.map((m) => ({
    type: 'match' as const,
    id: m.id,
    title: `Night 2: ${m.title}`,
    options: m.options,
    night: 'night_2',
  })),
  // Night 2 Props Card
  { type: 'prop' as const, id: 'wm42_n2_props', title: 'Night 2 Props', night: 'night_2' },
  // Cross-Night Props
  { type: 'prop' as const, id: 'wm42_cross_props', title: 'WrestleMania Props' },
];

// ── Event Config ─────────────────────────────────────────────────────

export const MANIA_42_CONFIG: EventConfig = {
  id: 'mania_42',
  title: 'WrestleMania 42',
  type: 'mania',
  nights: [
    {
      id: 'night_1',
      label: 'Night 1 - Saturday',
      date: new Date('2026-04-18T19:00:00-04:00'),
    },
    {
      id: 'night_2',
      label: 'Night 2 - Sunday',
      date: new Date('2026-04-19T19:00:00-04:00'),
    },
  ],
  venue: 'Allegiant Stadium',
  location: 'Las Vegas, Nevada',
  matches: MANIA_42_MATCHES,
  props: MANIA_42_PROPS,
  scoring: MANIA_42_SCORING,
  cardConfig: MANIA_42_CARD_CONFIG,
  // 13 matches + 8 props = 21 picks
  totalPicks: 21,
};
