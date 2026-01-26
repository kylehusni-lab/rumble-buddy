// Royal Rumble 2026 Constants

export const UNDERCARD_MATCHES = [
  { id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { id: 'undercard_2', title: 'CM Punk vs Logan Paul', options: ['CM Punk', 'Logan Paul'] },
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
} as const;

export const DEFAULT_MENS_ENTRANTS = [
  'Roman Reigns',
  'Cody Rhodes',
  'Gunther',
  'Jey Uso',
  'Solo Sikoa',
  'Jacob Fatu',
  'Rey Mysterio',
  'Dragon Lee',
  'Penta',
  'CM Punk',
  'Drew McIntyre',
  'Randy Orton',
  'Trick Williams',
  'Surprise/Other Entrant',
];

export const DEFAULT_WOMENS_ENTRANTS = [
  'Liv Morgan',
  'Rhea Ripley',
  'IYO SKY',
  'Charlotte Flair',
  'Bayley',
  'Asuka',
  'Giulia',
  'Jordynne Grace',
  'Alexa Bliss',
  'Nia Jax',
  'Roxanne Perez',
  'Raquel Rodriguez',
  'Lyra Valkyria',
  'Lash Legend',
  'Chelsea Green',
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
} as const;

export const EVENT_INFO = {
  name: 'Royal Rumble 2026',
  venue: 'Kingdom Arena',
  location: 'Riyadh, Saudi Arabia',
  date: 'February 1, 2026',
} as const;

// Card configuration for the swipeable pick flow
export const CARD_CONFIG = [
  { type: 'match', id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { type: 'match', id: 'undercard_2', title: 'CM Punk vs Logan Paul', options: ['CM Punk', 'Logan Paul'] },
  { type: 'match', id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
  { type: 'rumble-winner', id: 'mens_rumble_winner', title: "Men's Royal Rumble Winner", gender: 'mens' },
  { type: 'chaos-props', id: 'mens_chaos_props', title: "Men's Rumble Chaos Props", gender: 'mens' },
  { type: 'rumble-winner', id: 'womens_rumble_winner', title: "Women's Royal Rumble Winner", gender: 'womens' },
  { type: 'chaos-props', id: 'womens_chaos_props', title: "Women's Rumble Chaos Props", gender: 'womens' },
] as const;

export const TOTAL_CARDS = CARD_CONFIG.length;
