// Royal Rumble 2026 Configuration
// This is the preserved Rumble configuration used by Demo Mode

import type { EventConfig, MatchConfig, PropConfig, RumblePropConfig, ScoringConfig } from './types';

export const RUMBLE_2026_MATCHES: readonly MatchConfig[] = [
  { id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
] as const;

export const RUMBLE_2026_CHAOS_PROPS: readonly PropConfig[] = [
  { id: 'prop_1', title: 'The Floor is Lava', question: 'A wrestler uses a stunt (chair, handstand, etc.) to keep their feet from touching.', shortName: 'Floor is Lava', category: 'chaos' },
  { id: 'prop_2', title: 'The Revolving Door', question: 'A wrestler is thrown out in under 10 seconds of entering.', shortName: 'Revolving Door', category: 'chaos' },
  { id: 'prop_3', title: 'Betrayal!', question: 'Tag team partners or allies eliminate each other.', shortName: 'Betrayal!', category: 'chaos' },
  { id: 'prop_4', title: 'Over/Under: Surprises', question: 'Will there be more than 2.5 unannounced/legend entrants?', shortName: 'O/U Surprises', category: 'chaos' },
  { id: 'prop_5', title: 'The Giant Slayer', question: 'It takes 3+ wrestlers working together to eliminate one person.', shortName: 'Giant Slayer', category: 'chaos' },
  { id: 'prop_6', title: 'Brought a Toy', question: 'A chair, kendo stick, or other weapon is brought into the ring.', shortName: 'Brought a Toy', category: 'chaos' },
  { id: 'prop_7', title: 'Left on Read', question: 'Music hits but no one appears, or attacked before reaching the ring.', shortName: 'Left on Read', category: 'chaos' },
] as const;

export const RUMBLE_2026_PROPS: readonly RumblePropConfig[] = [
  { id: 'entrant_1', title: '#1 Entrant', question: 'Who enters at #1?', type: 'wrestler' },
  { id: 'entrant_30', title: '#30 Entrant', question: 'Who enters at #30?', type: 'wrestler' },
  { id: 'first_elimination', title: 'First Eliminated', question: 'Who gets eliminated first?', type: 'wrestler' },
  { id: 'most_eliminations', title: 'Most Eliminations', question: 'Who has the most eliminations?', type: 'wrestler' },
  { id: 'longest_time', title: 'Longest Time in Match', question: 'Who lasts longest in the ring?', type: 'wrestler' },
] as const;

export const RUMBLE_2026_MENS_ENTRANTS = [
  // Confirmed
  'Oba Femi',
  'Bron Breakker',
  'Logan Paul',
  'Bronson Reed',
  'Austin Theory',
  'Je\'Von Evans',
  'Roman Reigns',
  'Cody Rhodes',
  'Gunther',
  'Jey Uso',
  'Rey Mysterio',
  'Dragon Lee',
  'Penta',
  'Solo Sikoa',
  'Jacob Fatu',
  '*CM Punk',
  '*Drew McIntyre',
  'Trick Williams',
  // Unconfirmed (prefixed with *)
  '*Seth Rollins',
  '*Finn Balor',
  '*Dominik Mysterio',
  '*Kofi Kingston',
  '*Xavier Woods',
  '*Chad Gable',
  '*Otis',
  '*Sami Zayn',
  '*Carmelo Hayes',
  '*Ilja Dragunov',
  '*Damian Priest',
  '*Shinsuke Nakamura',
  '*The Miz',
  '*LA Knight',
  '*Randy Orton',
  'Surprise/Other Entrant',
] as const;

export const RUMBLE_2026_WOMENS_ENTRANTS = [
  // Confirmed
  'Charlotte Flair',
  'Jordynne Grace',
  'Giulia',
  'Nia Jax',
  'Chelsea Green',
  'Jakara Jackson',
  'Becky Lynch',
  'Rhea Ripley',
  'IYO SKY',
  'Liv Morgan',
  'Roxanne Perez',
  'Raquel Rodriguez',
  'Bayley',
  'Lyra Valkyria',
  'Asuka',
  // Unconfirmed (prefixed with *)
  '*Bianca Belair',
  '*Natalya',
  '*Tiffany Stratton',
  '*Michin',
  '*Candice LeRae',
  '*Ivy Nile',
  '*Maxxine Dupri',
  '*Zoey Stark',
  '*Kairi Sane',
  '*Alba Fyre',
  '*Piper Niven',
  '*Nikki Cross',
  '*B-Fab',
  'Surprise/Other Entrant',
] as const;

export const RUMBLE_2026_SCORING: ScoringConfig = {
  UNDERCARD_WINNER: 25,
  PROP_BET: 10,
  RUMBLE_WINNER_PICK: 50,
  RUMBLE_WINNER_NUMBER: 50,
  ELIMINATION: 5,
  IRON_MAN: 20,
  FINAL_FOUR: 10,
  JOBBER_PENALTY: -10,
  FIRST_ELIMINATION: 10,
  MOST_ELIMINATIONS: 20,
  LONGEST_TIME: 20,
  FINAL_FOUR_PICK: 10,
  ENTRANT_GUESS: 15,
  NO_SHOW_PROP: 10,
};

export const RUMBLE_2026_MATCH_IDS = {
  UNDERCARD_1: 'undercard_1',
  UNDERCARD_3: 'undercard_3',
  MENS_RUMBLE_WINNER: 'mens_rumble_winner',
  WOMENS_RUMBLE_WINNER: 'womens_rumble_winner',
  // Men's Chaos Props
  MENS_PROP_1: 'mens_chaos_prop_1',
  MENS_PROP_2: 'mens_chaos_prop_2',
  MENS_PROP_3: 'mens_chaos_prop_3',
  MENS_PROP_4: 'mens_chaos_prop_4',
  MENS_PROP_5: 'mens_chaos_prop_5',
  MENS_PROP_6: 'mens_chaos_prop_6',
  MENS_PROP_7: 'mens_chaos_prop_7',
  // Women's Chaos Props
  WOMENS_PROP_1: 'womens_chaos_prop_1',
  WOMENS_PROP_2: 'womens_chaos_prop_2',
  WOMENS_PROP_3: 'womens_chaos_prop_3',
  WOMENS_PROP_4: 'womens_chaos_prop_4',
  WOMENS_PROP_5: 'womens_chaos_prop_5',
  WOMENS_PROP_6: 'womens_chaos_prop_6',
  WOMENS_PROP_7: 'womens_chaos_prop_7',
  // Men's Rumble Props
  MENS_FIRST_ELIMINATION: 'mens_first_elimination',
  MENS_MOST_ELIMINATIONS: 'mens_most_eliminations',
  MENS_LONGEST_TIME: 'mens_longest_time',
  MENS_FINAL_FOUR_1: 'mens_final_four_1',
  MENS_FINAL_FOUR_2: 'mens_final_four_2',
  MENS_FINAL_FOUR_3: 'mens_final_four_3',
  MENS_FINAL_FOUR_4: 'mens_final_four_4',
  MENS_ENTRANT_1: 'mens_entrant_1',
  MENS_ENTRANT_30: 'mens_entrant_30',
  // Women's Rumble Props
  WOMENS_FIRST_ELIMINATION: 'womens_first_elimination',
  WOMENS_MOST_ELIMINATIONS: 'womens_most_eliminations',
  WOMENS_LONGEST_TIME: 'womens_longest_time',
  WOMENS_FINAL_FOUR_1: 'womens_final_four_1',
  WOMENS_FINAL_FOUR_2: 'womens_final_four_2',
  WOMENS_FINAL_FOUR_3: 'womens_final_four_3',
  WOMENS_FINAL_FOUR_4: 'womens_final_four_4',
  WOMENS_ENTRANT_1: 'womens_entrant_1',
  WOMENS_ENTRANT_30: 'womens_entrant_30',
} as const;

export const RUMBLE_2026_CARD_CONFIG = [
  { type: 'match' as const, id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { type: 'match' as const, id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
  { type: 'rumble-winner' as const, id: 'mens_rumble_winner', title: "Men's Royal Rumble Winner", gender: 'mens' as const },
  { type: 'rumble-props' as const, id: 'mens_rumble_props', title: "Men's Rumble Props", gender: 'mens' as const },
  { type: 'chaos-props' as const, id: 'mens_chaos_props', title: "Men's Rumble Chaos Props", gender: 'mens' as const },
  { type: 'rumble-winner' as const, id: 'womens_rumble_winner', title: "Women's Royal Rumble Winner", gender: 'womens' as const },
  { type: 'rumble-props' as const, id: 'womens_rumble_props', title: "Women's Rumble Props", gender: 'womens' as const },
  { type: 'chaos-props' as const, id: 'womens_chaos_props', title: "Women's Rumble Chaos Props", gender: 'womens' as const },
] as const;

export const RUMBLE_2026_CONFIG: EventConfig = {
  id: 'rumble_2026',
  title: 'WWE Royal Rumble 2026',
  type: 'rumble',
  nights: [
    {
      id: 'night_1',
      label: 'Royal Rumble',
      date: new Date('2026-01-31T14:00:00-05:00'), // 2pm EST
    },
  ],
  venue: 'Lucas Oil Stadium',
  location: 'Indianapolis, Indiana',
  matches: [...RUMBLE_2026_MATCHES],
  props: [], // General props (none for Rumble, uses chaosProps instead)
  scoring: RUMBLE_2026_SCORING,
  cardConfig: [...RUMBLE_2026_CARD_CONFIG],
  totalPicks: 36,
  // Rumble-specific
  mensEntrants: RUMBLE_2026_MENS_ENTRANTS,
  womensEntrants: RUMBLE_2026_WOMENS_ENTRANTS,
  rumbleProps: RUMBLE_2026_PROPS,
  chaosProps: RUMBLE_2026_CHAOS_PROPS,
  matchIds: RUMBLE_2026_MATCH_IDS,
  finalFourSlots: 4,
};
