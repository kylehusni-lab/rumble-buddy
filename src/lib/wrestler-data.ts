// Wrestler data with WWE.com official images
// Note: URLs may change if WWE updates their website

import samiZaynImage from '@/assets/wrestlers/sami-zayn.webp';
import romanReignsImage from '@/assets/wrestlers/roman-reigns.png';
import brockLesnarImage from '@/assets/wrestlers/brock-lesnar.png';
import damianPriestImage from '@/assets/wrestlers/damian-priest.png';
import guntherImage from '@/assets/wrestlers/gunther.png';
import joeHendryImage from '@/assets/wrestlers/joe-hendry.png';
import loganPaulImage from '@/assets/wrestlers/logan-paul.png';
import ajStylesImage from '@/assets/wrestlers/aj-styles.png';
import jeyUsoImage from '@/assets/wrestlers/jey-uso.png';
import dominikMysterioImage from '@/assets/wrestlers/dominik-mysterio.png';
import carmeloHayesImage from '@/assets/wrestlers/carmelo-hayes.png';
import aleisterBlackImage from '@/assets/wrestlers/aleister-black.png';
import alexaBlissImage from '@/assets/wrestlers/alexa-bliss.png';
import asukaImage from '@/assets/wrestlers/asuka.png';
import bFabImage from '@/assets/wrestlers/b-fab.png';
import bayleyImage from '@/assets/wrestlers/bayley.png';
import beckyLynchImage from '@/assets/wrestlers/becky-lynch.png';
import biancaBelairImage from '@/assets/wrestlers/bianca-belair.png';
import candiceLeRaeImage from '@/assets/wrestlers/candice-lerae.png';
import chelseaGreenImage from '@/assets/wrestlers/chelsea-green.png';
import charlotteFlairImage from '@/assets/wrestlers/charlotte-flair.png';
import dragonLeeImage from '@/assets/wrestlers/dragon-lee.png';
import elGrandeGordoImage from '@/assets/wrestlers/el-grande-gordo.png';
import finnBalorImage from '@/assets/wrestlers/finn-balor.png';
import iyoSkyImage from '@/assets/wrestlers/iyo-sky.png';
import iljaDragunovImage from '@/assets/wrestlers/ilja-dragunov.png';
import jacobFatuImage from '@/assets/wrestlers/jacob-fatu.png';
import jordynneGraceImage from '@/assets/wrestlers/jordynne-grace.png';
import kairiSaneImage from '@/assets/wrestlers/kairi-sane.png';
import laKnightImage from '@/assets/wrestlers/la-knight.png';
import kofiKingstonImage from '@/assets/wrestlers/kofi-kingston.png';

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
  { name: 'Roman Reigns', imageUrl: romanReignsImage, gender: 'male' },
  { name: 'Cody Rhodes', imageUrl: `${WWE_CDN}/2025/04/Cody_Rhodes_Profile.png`, gender: 'male' },
  { name: 'Gunther', imageUrl: guntherImage, gender: 'male' },
  { name: 'Jey Uso', imageUrl: jeyUsoImage, gender: 'male' },
  { name: 'Solo Sikoa', imageUrl: `${WWE_CDN}/2025/11/Solo_Sikoa_Profile.png`, gender: 'male' },
  { name: 'Jacob Fatu', imageUrl: jacobFatuImage, gender: 'male' },
  { name: 'Rey Mysterio', imageUrl: `${WWE_CDN}/2025/04/Rey_Mysterio_Profile.png`, gender: 'male' },
  { name: 'Dragon Lee', imageUrl: dragonLeeImage, gender: 'male' },
  { name: 'Penta', imageUrl: `${WWE_CDN}/2025/02/Penta_Profile.png`, gender: 'male' },
  { name: 'CM Punk', imageUrl: `${WWE_CDN}/2025/11/CMPUNK_PROFILE.png`, gender: 'male' },
  { name: 'Drew McIntyre', imageUrl: `${WWE_CDN}/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png`, gender: 'male' },
  { name: 'Randy Orton', imageUrl: `${WWE_CDN}/2025/04/Randy_Orton_Profile.png`, gender: 'male' },
  { name: 'Trick Williams', imageUrl: `${WWE_CDN}/2025/11/Trick_Williams_Profile.png`, gender: 'male' },
  { name: 'Sami Zayn', imageUrl: samiZaynImage, gender: 'male' },
  { name: 'Seth Rollins', imageUrl: `${WWE_CDN}/2025/11/Seth_Rollins_Profile.png`, gender: 'male' },
  { name: 'Damian Priest', imageUrl: damianPriestImage, gender: 'male' },
  { name: 'Logan Paul', imageUrl: loganPaulImage, gender: 'male' },
  { name: 'Brock Lesnar', imageUrl: brockLesnarImage, gender: 'male' },
  { name: 'Joe Hendry', imageUrl: joeHendryImage, gender: 'male' },
  { name: 'AJ Styles', imageUrl: ajStylesImage, gender: 'male' },
  { name: 'Dominik Mysterio', imageUrl: dominikMysterioImage, gender: 'male' },
  { name: 'Carmelo Hayes', imageUrl: carmeloHayesImage, gender: 'male' },
  { name: 'Aleister Black', imageUrl: aleisterBlackImage, gender: 'male' },
  { name: 'Finn Balor', imageUrl: finnBalorImage, gender: 'male' },
  { name: 'Ilja Dragunov', imageUrl: iljaDragunovImage, gender: 'male' },
  { name: 'LA Knight', imageUrl: laKnightImage, gender: 'male' },
  { name: 'Kofi Kingston', imageUrl: kofiKingstonImage, gender: 'male' },
  { name: 'El Grande Gordo', imageUrl: elGrandeGordoImage, gender: 'male' },
  { name: 'Surprise/Other Entrant', imageUrl: getPlaceholderImageUrl('Surprise'), gender: 'male' },
];

// Default female wrestlers with WWE profile images
export const DEFAULT_FEMALE_WRESTLERS: WrestlerData[] = [
  { name: 'Liv Morgan', imageUrl: `${WWE_CDN}/2025/11/Liv_Morgan_Profile.png`, gender: 'female' },
  { name: 'Rhea Ripley', imageUrl: `${WWE_CDN}/2025/11/Rhea_Ripley_Profile.png`, gender: 'female' },
  { name: 'IYO SKY', imageUrl: iyoSkyImage, gender: 'female' },
  { name: 'Charlotte Flair', imageUrl: charlotteFlairImage, gender: 'female' },
  { name: 'Bayley', imageUrl: bayleyImage, gender: 'female' },
  { name: 'Asuka', imageUrl: asukaImage, gender: 'female' },
  { name: 'Giulia', imageUrl: `${WWE_CDN}/2026/01/guilia_PROFILE.png`, gender: 'female' },
  { name: 'Jordynne Grace', imageUrl: jordynneGraceImage, gender: 'female' },
  { name: 'Alexa Bliss', imageUrl: alexaBlissImage, gender: 'female' },
  { name: 'Nia Jax', imageUrl: `${WWE_CDN}/2025/11/Nia_Jax_Profile.png`, gender: 'female' },
  { name: 'Roxanne Perez', imageUrl: `${WWE_CDN}/2025/11/Roxanne_Perez_Profile.png`, gender: 'female' },
  { name: 'Raquel Rodriguez', imageUrl: `${WWE_CDN}/2025/11/Raquel_Rodriguez_Profile.png`, gender: 'female' },
  { name: 'Lyra Valkyria', imageUrl: `${WWE_CDN}/2025/11/Lyra_Valkyria_Profile.png`, gender: 'female' },
  { name: 'Lash Legend', imageUrl: `${WWE_CDN}/2025/11/Lash_Legend_Profile.png`, gender: 'female' },
  { name: 'Chelsea Green', imageUrl: chelseaGreenImage, gender: 'female' },
  { name: 'Becky Lynch', imageUrl: beckyLynchImage, gender: 'female' },
  { name: 'Bianca Belair', imageUrl: biancaBelairImage, gender: 'female' },
  { name: 'Candice LeRae', imageUrl: candiceLeRaeImage, gender: 'female' },
  { name: 'B-Fab', imageUrl: bFabImage, gender: 'female' },
  { name: 'Kairi Sane', imageUrl: kairiSaneImage, gender: 'female' },
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
