// Wrestler data with placeholder images
// Images use UI Avatars API - can be replaced with real photos later

export interface WrestlerData {
  name: string;
  imageUrl: string;
  gender: 'male' | 'female';
}

// Generate avatar URL for a wrestler
export function getWrestlerImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=D4AF37&color=0A0A0A&size=100&bold=true`;
}

// Default male wrestlers with placeholder images
export const DEFAULT_MALE_WRESTLERS: WrestlerData[] = [
  { name: 'Roman Reigns', imageUrl: getWrestlerImageUrl('Roman Reigns'), gender: 'male' },
  { name: 'Cody Rhodes', imageUrl: getWrestlerImageUrl('Cody Rhodes'), gender: 'male' },
  { name: 'Gunther', imageUrl: getWrestlerImageUrl('Gunther'), gender: 'male' },
  { name: 'Jey Uso', imageUrl: getWrestlerImageUrl('Jey Uso'), gender: 'male' },
  { name: 'Solo Sikoa', imageUrl: getWrestlerImageUrl('Solo Sikoa'), gender: 'male' },
  { name: 'Jacob Fatu', imageUrl: getWrestlerImageUrl('Jacob Fatu'), gender: 'male' },
  { name: 'Rey Mysterio', imageUrl: getWrestlerImageUrl('Rey Mysterio'), gender: 'male' },
  { name: 'Dragon Lee', imageUrl: getWrestlerImageUrl('Dragon Lee'), gender: 'male' },
  { name: 'Penta', imageUrl: getWrestlerImageUrl('Penta'), gender: 'male' },
  { name: 'CM Punk', imageUrl: getWrestlerImageUrl('CM Punk'), gender: 'male' },
  { name: 'Drew McIntyre', imageUrl: getWrestlerImageUrl('Drew McIntyre'), gender: 'male' },
  { name: 'Randy Orton', imageUrl: getWrestlerImageUrl('Randy Orton'), gender: 'male' },
  { name: 'Trick Williams', imageUrl: getWrestlerImageUrl('Trick Williams'), gender: 'male' },
  { name: 'Surprise/Other Entrant', imageUrl: getWrestlerImageUrl('Surprise'), gender: 'male' },
];

// Default female wrestlers with placeholder images
export const DEFAULT_FEMALE_WRESTLERS: WrestlerData[] = [
  { name: 'Liv Morgan', imageUrl: getWrestlerImageUrl('Liv Morgan'), gender: 'female' },
  { name: 'Rhea Ripley', imageUrl: getWrestlerImageUrl('Rhea Ripley'), gender: 'female' },
  { name: 'IYO SKY', imageUrl: getWrestlerImageUrl('IYO SKY'), gender: 'female' },
  { name: 'Charlotte Flair', imageUrl: getWrestlerImageUrl('Charlotte Flair'), gender: 'female' },
  { name: 'Bayley', imageUrl: getWrestlerImageUrl('Bayley'), gender: 'female' },
  { name: 'Asuka', imageUrl: getWrestlerImageUrl('Asuka'), gender: 'female' },
  { name: 'Giulia', imageUrl: getWrestlerImageUrl('Giulia'), gender: 'female' },
  { name: 'Jordynne Grace', imageUrl: getWrestlerImageUrl('Jordynne Grace'), gender: 'female' },
  { name: 'Alexa Bliss', imageUrl: getWrestlerImageUrl('Alexa Bliss'), gender: 'female' },
  { name: 'Nia Jax', imageUrl: getWrestlerImageUrl('Nia Jax'), gender: 'female' },
  { name: 'Roxanne Perez', imageUrl: getWrestlerImageUrl('Roxanne Perez'), gender: 'female' },
  { name: 'Raquel Rodriguez', imageUrl: getWrestlerImageUrl('Raquel Rodriguez'), gender: 'female' },
  { name: 'Lyra Valkyria', imageUrl: getWrestlerImageUrl('Lyra Valkyria'), gender: 'female' },
  { name: 'Lash Legend', imageUrl: getWrestlerImageUrl('Lash Legend'), gender: 'female' },
  { name: 'Chelsea Green', imageUrl: getWrestlerImageUrl('Chelsea Green'), gender: 'female' },
  { name: 'Surprise/Other Entrant', imageUrl: getWrestlerImageUrl('Surprise'), gender: 'female' },
];

// Get wrestler data from a name (dynamically generates image if not in defaults)
export function getWrestlerData(name: string, gender: 'male' | 'female'): WrestlerData {
  const defaults = gender === 'male' ? DEFAULT_MALE_WRESTLERS : DEFAULT_FEMALE_WRESTLERS;
  const found = defaults.find(w => w.name === name);
  if (found) return found;
  
  return {
    name,
    imageUrl: getWrestlerImageUrl(name),
    gender,
  };
}
