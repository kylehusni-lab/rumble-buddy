// Wrestler data with local assets and WWE.com fallback images

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
import lashLegendImage from '@/assets/wrestlers/lash-legend.png';
import livMorganImage from '@/assets/wrestlers/liv-morgan.png';
import maxxineDupriImage from '@/assets/wrestlers/maxxine-dupri.png';
import michinImage from '@/assets/wrestlers/michin.png';
import montezFordImage from '@/assets/wrestlers/montez-ford.png';
import natalyaImage from '@/assets/wrestlers/natalya.png';
import niaJaxImage from '@/assets/wrestlers/nia-jax.png';
import nikkiBellaImage from '@/assets/wrestlers/nikki-bella.png';
import nikkiCrossImage from '@/assets/wrestlers/nikki-cross.png';
import pentaImage from '@/assets/wrestlers/penta.png';
import rTruthImage from '@/assets/wrestlers/r-truth.png';
import randyOrtonImage from '@/assets/wrestlers/randy-orton.png';
import raquelRodriguezImage from '@/assets/wrestlers/raquel-rodriguez.png';
import reyFenixImage from '@/assets/wrestlers/rey-fenix.png';
import rheaRipleyImage from '@/assets/wrestlers/rhea-ripley.png';
import reyMysterioImage from '@/assets/wrestlers/rey-mysterio.png';
import rusevImage from '@/assets/wrestlers/rusev.png';
import samiZaynImage from '@/assets/wrestlers/sami-zayn.png';
import sheamusImage from '@/assets/wrestlers/sheamus.png';
import sethRollinsImage from '@/assets/wrestlers/seth-rollins.png';
import shinsukeNakamuraImage from '@/assets/wrestlers/shinsuke-nakamura.png';
import soloSikoaImage from '@/assets/wrestlers/solo-sikoa.png';
import solRucaImage from '@/assets/wrestlers/sol-ruca.png';
import theMizImage from '@/assets/wrestlers/the-miz.png';
import tiffanyStrattonImage from '@/assets/wrestlers/tiffany-stratton.png';
import xavierWoodsImage from '@/assets/wrestlers/xavier-woods.png';
import obaFemiImage from '@/assets/wrestlers/oba-femi.png';
import trickWilliamsImage from '@/assets/wrestlers/trick-williams.png';
import zackRyderImage from '@/assets/wrestlers/zack-ryder.png';
import chadGableImage from '@/assets/wrestlers/chad-gable.png';
import bronsonReedImage from '@/assets/wrestlers/bronson-reed.png';
import bronBreakkerImage from '@/assets/wrestlers/bron-breakker.png';
import codyRhodesImage from '@/assets/wrestlers/cody-rhodes.png';
import austinTheoryImage from '@/assets/wrestlers/austin-theory.png';
import jevonEvansImage from '@/assets/wrestlers/jevon-evans.png';

export interface WrestlerData {
  name: string;
  imageUrl: string;
  gender: 'male' | 'female';
}

// WWE CDN base URL (fallback for wrestlers without local images)
const WWE_CDN = 'https://www.wwe.com/f/styles/wwe_1_1_540/public';

// Generate fallback avatar URL for a wrestler
export function getPlaceholderImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=D4AF37&color=0A0A0A&size=100&bold=true`;
}

// Default male wrestlers with local images (alphabetized, Surprise at end)
export const DEFAULT_MALE_WRESTLERS: WrestlerData[] = [
  { name: 'AJ Styles', imageUrl: ajStylesImage, gender: 'male' },
  { name: 'Aleister Black', imageUrl: aleisterBlackImage, gender: 'male' },
  { name: 'Austin Theory', imageUrl: austinTheoryImage, gender: 'male' },
  { name: 'Brock Lesnar', imageUrl: brockLesnarImage, gender: 'male' },
  { name: 'Bron Breakker', imageUrl: bronBreakkerImage, gender: 'male' },
  { name: 'Bronson Reed', imageUrl: bronsonReedImage, gender: 'male' },
  { name: 'Carmelo Hayes', imageUrl: carmeloHayesImage, gender: 'male' },
  { name: 'Chad Gable', imageUrl: chadGableImage, gender: 'male' },
  { name: 'CM Punk', imageUrl: `${WWE_CDN}/2025/11/CMPUNK_PROFILE.png`, gender: 'male' },
  { name: 'Cody Rhodes', imageUrl: codyRhodesImage, gender: 'male' },
  { name: 'Damian Priest', imageUrl: damianPriestImage, gender: 'male' },
  { name: 'Dominik Mysterio', imageUrl: dominikMysterioImage, gender: 'male' },
  { name: 'Dragon Lee', imageUrl: dragonLeeImage, gender: 'male' },
  { name: 'Drew McIntyre', imageUrl: `${WWE_CDN}/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png`, gender: 'male' },
  { name: 'El Grande Gordo', imageUrl: elGrandeGordoImage, gender: 'male' },
  { name: 'Finn Balor', imageUrl: finnBalorImage, gender: 'male' },
  { name: 'Gunther', imageUrl: guntherImage, gender: 'male' },
  { name: 'Ilja Dragunov', imageUrl: iljaDragunovImage, gender: 'male' },
  { name: 'Jacob Fatu', imageUrl: jacobFatuImage, gender: 'male' },
  { name: "Je'Von Evans", imageUrl: jevonEvansImage, gender: 'male' },
  { name: 'Jey Uso', imageUrl: jeyUsoImage, gender: 'male' },
  { name: 'Joe Hendry', imageUrl: joeHendryImage, gender: 'male' },
  { name: 'Kofi Kingston', imageUrl: kofiKingstonImage, gender: 'male' },
  { name: 'LA Knight', imageUrl: laKnightImage, gender: 'male' },
  { name: 'Logan Paul', imageUrl: loganPaulImage, gender: 'male' },
  { name: 'Montez Ford', imageUrl: montezFordImage, gender: 'male' },
  { name: 'Oba Femi', imageUrl: obaFemiImage, gender: 'male' },
  { name: 'Penta', imageUrl: pentaImage, gender: 'male' },
  { name: 'R-Truth', imageUrl: rTruthImage, gender: 'male' },
  { name: 'Randy Orton', imageUrl: randyOrtonImage, gender: 'male' },
  { name: 'Rey Fenix', imageUrl: reyFenixImage, gender: 'male' },
  { name: 'Rey Mysterio', imageUrl: reyMysterioImage, gender: 'male' },
  { name: 'Roman Reigns', imageUrl: romanReignsImage, gender: 'male' },
  { name: 'Rusev', imageUrl: rusevImage, gender: 'male' },
  { name: 'Sami Zayn', imageUrl: samiZaynImage, gender: 'male' },
  { name: 'Seth Rollins', imageUrl: sethRollinsImage, gender: 'male' },
  { name: 'Sheamus', imageUrl: sheamusImage, gender: 'male' },
  { name: 'Shinsuke Nakamura', imageUrl: shinsukeNakamuraImage, gender: 'male' },
  { name: 'Solo Sikoa', imageUrl: soloSikoaImage, gender: 'male' },
  { name: 'The Miz', imageUrl: theMizImage, gender: 'male' },
  { name: 'Trick Williams', imageUrl: trickWilliamsImage, gender: 'male' },
  { name: 'Xavier Woods', imageUrl: xavierWoodsImage, gender: 'male' },
  { name: 'Zack Ryder', imageUrl: zackRyderImage, gender: 'male' },
  { name: 'Surprise/Other Entrant', imageUrl: getPlaceholderImageUrl('Surprise'), gender: 'male' },
];

// Default female wrestlers with local images (alphabetized, Surprise at end)
export const DEFAULT_FEMALE_WRESTLERS: WrestlerData[] = [
  { name: 'Alexa Bliss', imageUrl: alexaBlissImage, gender: 'female' },
  { name: 'Asuka', imageUrl: asukaImage, gender: 'female' },
  { name: 'B-Fab', imageUrl: bFabImage, gender: 'female' },
  { name: 'Bayley', imageUrl: bayleyImage, gender: 'female' },
  { name: 'Becky Lynch', imageUrl: beckyLynchImage, gender: 'female' },
  { name: 'Bianca Belair', imageUrl: biancaBelairImage, gender: 'female' },
  { name: 'Candice LeRae', imageUrl: candiceLeRaeImage, gender: 'female' },
  { name: 'Charlotte Flair', imageUrl: charlotteFlairImage, gender: 'female' },
  { name: 'Chelsea Green', imageUrl: chelseaGreenImage, gender: 'female' },
  { name: 'Giulia', imageUrl: `${WWE_CDN}/2026/01/guilia_PROFILE.png`, gender: 'female' },
  { name: 'IYO SKY', imageUrl: iyoSkyImage, gender: 'female' },
  { name: 'Jordynne Grace', imageUrl: jordynneGraceImage, gender: 'female' },
  { name: 'Kairi Sane', imageUrl: kairiSaneImage, gender: 'female' },
  { name: 'Lash Legend', imageUrl: lashLegendImage, gender: 'female' },
  { name: 'Liv Morgan', imageUrl: livMorganImage, gender: 'female' },
  { name: 'Lyra Valkyria', imageUrl: `${WWE_CDN}/2025/11/Lyra_Valkyria_Profile.png`, gender: 'female' },
  { name: 'Maxxine Dupri', imageUrl: maxxineDupriImage, gender: 'female' },
  { name: 'Michin', imageUrl: michinImage, gender: 'female' },
  { name: 'Natalya', imageUrl: natalyaImage, gender: 'female' },
  { name: 'Nia Jax', imageUrl: niaJaxImage, gender: 'female' },
  { name: 'Nikki Bella', imageUrl: nikkiBellaImage, gender: 'female' },
  { name: 'Nikki Cross', imageUrl: nikkiCrossImage, gender: 'female' },
  { name: 'Raquel Rodriguez', imageUrl: raquelRodriguezImage, gender: 'female' },
  { name: 'Rhea Ripley', imageUrl: rheaRipleyImage, gender: 'female' },
  { name: 'Roxanne Perez', imageUrl: `${WWE_CDN}/2025/11/Roxanne_Perez_Profile.png`, gender: 'female' },
  { name: 'Sol Ruca', imageUrl: solRucaImage, gender: 'female' },
  { name: 'Tiffany Stratton', imageUrl: tiffanyStrattonImage, gender: 'female' },
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
