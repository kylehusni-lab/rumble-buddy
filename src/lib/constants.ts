// Royal Rumble 2026 Constants

export const UNDERCARD_MATCHES = [
  { id: 'undercard_1', title: 'Drew McIntyre vs Sami Zayn', options: ['Drew McIntyre', 'Sami Zayn'] },
  { id: 'undercard_2', title: 'CM Punk vs Logan Paul', options: ['CM Punk', 'Logan Paul'] },
  { id: 'undercard_3', title: 'AJ Styles vs Gunther', options: ['AJ Styles', 'Gunther'] },
] as const;

export const CHAOS_PROPS = [
  { id: 'prop_1', question: 'The "Kofi/Logan Save": Will someone use a prop to stay in?', shortName: 'Kofi/Logan Save' },
  { id: 'prop_2', question: 'The "Bushwhacker" Exit: Will anyone be eliminated in under 10 seconds?', shortName: 'Bushwhacker Exit' },
  { id: 'prop_3', question: 'The Friendly Fire: Will tag team partners eliminate each other?', shortName: 'Friendly Fire' },
  { id: 'prop_4', question: 'First Blood: Will we see blood before entrant #15?', shortName: 'First Blood' },
  { id: 'prop_5', question: 'The Mystery Entrant: Will there be an unannounced debut/return?', shortName: 'Mystery Entrant' },
  { id: 'prop_6', question: 'The Weapon: Will someone use a chair/kendo stick/non-standard weapon?', shortName: 'The Weapon' },
] as const;

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
