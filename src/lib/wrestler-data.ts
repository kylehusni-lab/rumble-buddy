// Wrestler data with WWE.com official images
// Note: URLs may change if WWE updates their website

import samiZaynImage from '@/assets/wrestlers/sami-zayn.webp';

export interface WrestlerData {
  name: string;
  imageUrl: string;
  gender: 'male' | 'female';
}

// WWE CDN base URL
const WWE_CDN = 'https://www.wwe.com/f/styles/wwe_1_1_540/public';

// Generate fallback avatar URL for a wrestler
export function getPlaceholderImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=D4AF37&color=0A0A0A&size=100&bold=true`;
}

// Default male wrestlers with WWE profile images
export const DEFAULT_MALE_WRESTLERS: WrestlerData[] = [
  { name: 'Roman Reigns', imageUrl: `${WWE_CDN}/2025/12/Roman_Reigns_Profile.png`, gender: 'male' },
  { name: 'Cody Rhodes', imageUrl: `${WWE_CDN}/2025/04/Cody_Rhodes_Profile.png`, gender: 'male' },
  { name: 'Gunther', imageUrl: `${WWE_CDN}/2025/08/GUNTHER_Profile.png`, gender: 'male' },
  { name: 'Jey Uso', imageUrl: `${WWE_CDN}/2025/12/20251229_usos_worldtag.png`, gender: 'male' },
  { name: 'Solo Sikoa', imageUrl: `${WWE_CDN}/2025/11/Solo_Sikoa_Profile.png`, gender: 'male' },
  { name: 'Jacob Fatu', imageUrl: `${WWE_CDN}/2025/11/Jacob_Fatu_Profile.png`, gender: 'male' },
  { name: 'Rey Mysterio', imageUrl: `${WWE_CDN}/2025/04/Rey_Mysterio_Profile.png`, gender: 'male' },
  { name: 'Dragon Lee', imageUrl: `${WWE_CDN}/2025/04/Dragon_Lee_Profile.png`, gender: 'male' },
  { name: 'Penta', imageUrl: `${WWE_CDN}/2025/02/Penta_Profile.png`, gender: 'male' },
  { name: 'CM Punk', imageUrl: `${WWE_CDN}/2025/11/CMPUNK_PROFILE.png`, gender: 'male' },
  { name: 'Drew McIntyre', imageUrl: `${WWE_CDN}/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png`, gender: 'male' },
  { name: 'Randy Orton', imageUrl: `${WWE_CDN}/2025/04/Randy_Orton_Profile.png`, gender: 'male' },
  { name: 'Trick Williams', imageUrl: `${WWE_CDN}/2025/11/Trick_Williams_Profile.png`, gender: 'male' },
  { name: 'Sami Zayn', imageUrl: samiZaynImage, gender: 'male' },
  { name: 'Seth Rollins', imageUrl: `${WWE_CDN}/2025/11/Seth_Rollins_Profile.png`, gender: 'male' },
  { name: 'Surprise/Other Entrant', imageUrl: getPlaceholderImageUrl('Surprise'), gender: 'male' },
];

// Default female wrestlers with WWE profile images
export const DEFAULT_FEMALE_WRESTLERS: WrestlerData[] = [
  { name: 'Liv Morgan', imageUrl: `${WWE_CDN}/2025/11/Liv_Morgan_Profile.png`, gender: 'female' },
  { name: 'Rhea Ripley', imageUrl: `${WWE_CDN}/2025/11/Rhea_Ripley_Profile.png`, gender: 'female' },
  { name: 'IYO SKY', imageUrl: `${WWE_CDN}/2025/11/IYO_SKY_Profile.png`, gender: 'female' },
  { name: 'Charlotte Flair', imageUrl: `${WWE_CDN}/2025/11/Charlotte_Flair_Profile.png`, gender: 'female' },
  { name: 'Bayley', imageUrl: `${WWE_CDN}/2025/11/Bayley_Profile.png`, gender: 'female' },
  { name: 'Asuka', imageUrl: `${WWE_CDN}/2025/04/Asuka_Profile.png`, gender: 'female' },
  { name: 'Giulia', imageUrl: `${WWE_CDN}/2026/01/guilia_PROFILE.png`, gender: 'female' },
  { name: 'Jordynne Grace', imageUrl: getPlaceholderImageUrl('Jordynne Grace'), gender: 'female' },
  { name: 'Alexa Bliss', imageUrl: `${WWE_CDN}/2025/11/Alexa_Bliss_Profile.png`, gender: 'female' },
  { name: 'Nia Jax', imageUrl: `${WWE_CDN}/2025/11/Nia_Jax_Profile.png`, gender: 'female' },
  { name: 'Roxanne Perez', imageUrl: `${WWE_CDN}/2025/11/Roxanne_Perez_Profile.png`, gender: 'female' },
  { name: 'Raquel Rodriguez', imageUrl: `${WWE_CDN}/2025/11/Raquel_Rodriguez_Profile.png`, gender: 'female' },
  { name: 'Lyra Valkyria', imageUrl: `${WWE_CDN}/2025/11/Lyra_Valkyria_Profile.png`, gender: 'female' },
  { name: 'Lash Legend', imageUrl: `${WWE_CDN}/2025/11/Lash_Legend_Profile.png`, gender: 'female' },
  { name: 'Chelsea Green', imageUrl: `${WWE_CDN}/2025/11/Chelsea_Green_Profile.png`, gender: 'female' },
  { name: 'Surprise/Other Entrant', imageUrl: getPlaceholderImageUrl('Surprise'), gender: 'female' },
];

// Get wrestler image URL by name (searches defaults, falls back to placeholder)
export function getWrestlerImageUrl(name: string): string {
  const allWrestlers = [...DEFAULT_MALE_WRESTLERS, ...DEFAULT_FEMALE_WRESTLERS];
  const found = allWrestlers.find(w => w.name === name);
  return found?.imageUrl || getPlaceholderImageUrl(name);
}

// Get wrestler data from a name (dynamically generates image if not in defaults)
export function getWrestlerData(name: string, gender: 'male' | 'female'): WrestlerData {
  const defaults = gender === 'male' ? DEFAULT_MALE_WRESTLERS : DEFAULT_FEMALE_WRESTLERS;
  const found = defaults.find(w => w.name === name);
  if (found) return found;
  
  return {
    name,
    imageUrl: getPlaceholderImageUrl(name),
    gender,
  };
}
