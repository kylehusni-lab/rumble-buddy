// Royal Rumble 2026 Constants

export const EVENT_CONFIG = {
  DATE: new Date('2026-02-01T19:00:00+03:00'), // Riyadh time (UTC+3)
  VENUE: 'Kingdom Arena',
  LOCATION: 'Riyadh, Saudi Arabia',
  TITLE: 'WWE Royal Rumble 2026',
} as const;

export const UNDERCARD_MATCHES = [
  { id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { id: 'undercard_2', title: 'CM Punk vs Seth Rollins', options: ['CM Punk', 'Seth Rollins'] },
  { id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
] as const;

export const CHAOS_PROPS = [
  { id: 'prop_1', title: 'Kofi/Logan Save', question: 'Will someone use a prop to stay in?', shortName: 'Kofi/Logan Save' },
  { id: 'prop_2', title: 'Bushwhacker Exit', question: 'Will anyone be eliminated in under 10 seconds?', shortName: 'Bushwhacker Exit' },
  { id: 'prop_3', title: 'Friendly Fire', question: 'Will tag team partners eliminate each other?', shortName: 'Friendly Fire' },
  { id: 'prop_4', title: 'First Blood', question: 'Will we see blood before entrant #15?', shortName: 'First Blood' },
  { id: 'prop_5', title: 'Mystery Entrant', question: 'Will there be an unannounced debut/return?', shortName: 'Mystery Entrant' },
  { id: 'prop_6', title: 'The Weapon', question: 'Will someone use a chair/kendo stick/weapon?', shortName: 'The Weapon' },
] as const;

export const MATCH_IDS = {
  UNDERCARD_1: 'undercard_1',
  UNDERCARD_2: 'undercard_2',
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
  // Women's Chaos Props
  WOMENS_PROP_1: 'womens_chaos_prop_1',
  WOMENS_PROP_2: 'womens_chaos_prop_2',
  WOMENS_PROP_3: 'womens_chaos_prop_3',
  WOMENS_PROP_4: 'womens_chaos_prop_4',
  WOMENS_PROP_5: 'womens_chaos_prop_5',
  WOMENS_PROP_6: 'womens_chaos_prop_6',
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
  MENS_NO_SHOW: 'mens_no_show',
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
  WOMENS_NO_SHOW: 'womens_no_show',
} as const;

export const DEFAULT_MENS_ENTRANTS = [
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
  '*Finn Bálor',
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
];

export const DEFAULT_WOMENS_ENTRANTS = [
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
];

export const SCORING = {
  UNDERCARD_WINNER: 25,
  PROP_BET: 10,
  RUMBLE_WINNER_PICK: 50,
  RUMBLE_WINNER_NUMBER: 50,
  ELIMINATION: 5,
  IRON_MAN: 20,
  FINAL_FOUR: 10,
  JOBBER_PENALTY: -10,
  // Rumble Props
  FIRST_ELIMINATION: 10,
  MOST_ELIMINATIONS: 20,
  LONGEST_TIME: 20,
  FINAL_FOUR_PICK: 10,
  ENTRANT_GUESS: 15,
  NO_SHOW_PROP: 10,
} as const;

export const EVENT_INFO = {
  name: 'Royal Rumble 2026',
  venue: 'Kingdom Arena',
  location: 'Riyadh, Saudi Arabia',
  date: 'February 1, 2026',
} as const;

// Rumble Props configuration - ordered logically
export const RUMBLE_PROPS = [
  { id: 'entrant_1', title: '#1 Entrant', question: 'Who enters at #1?', type: 'wrestler' as const, icon: '1️⃣' },
  { id: 'entrant_30', title: '#30 Entrant', question: 'Who enters at #30?', type: 'wrestler' as const, icon: '3️⃣0️⃣' },
  { id: 'first_elimination', title: 'First Eliminated', question: 'Who gets eliminated first?', type: 'wrestler' as const, icon: '💨' },
  { id: 'most_eliminations', title: 'Most Eliminations', question: 'Who has the most eliminations?', type: 'wrestler' as const, icon: '💪' },
  { id: 'longest_time', title: 'Iron Man/Woman', question: 'Who lasts longest in the ring?', type: 'wrestler' as const, icon: '⏱️' },
] as const;

export const FINAL_FOUR_SLOTS = 4;

// Card configuration for the swipeable pick flow
export const CARD_CONFIG = [
  { type: 'match', id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { type: 'match', id: 'undercard_2', title: 'CM Punk vs Seth Rollins', options: ['CM Punk', 'Seth Rollins'] },
  { type: 'match', id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
  { type: 'rumble-winner', id: 'mens_rumble_winner', title: "Men's Royal Rumble Winner", gender: 'mens' },
  { type: 'rumble-props', id: 'mens_rumble_props', title: "Men's Rumble Props", gender: 'mens' },
  { type: 'chaos-props', id: 'mens_chaos_props', title: "Men's Rumble Chaos Props", gender: 'mens' },
  { type: 'rumble-winner', id: 'womens_rumble_winner', title: "Women's Royal Rumble Winner", gender: 'womens' },
  { type: 'rumble-props', id: 'womens_rumble_props', title: "Women's Rumble Props", gender: 'womens' },
  { type: 'chaos-props', id: 'womens_chaos_props', title: "Women's Rumble Chaos Props", gender: 'womens' },
] as const;

export const TOTAL_CARDS = CARD_CONFIG.length;
