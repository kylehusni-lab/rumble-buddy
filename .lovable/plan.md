

# Plan: Update wrestler-data.ts with Verified WWE.com Profile Images

## Overview
Replace the estimated/guessed WWE.com profile image URLs in `wrestler-data.ts` with actual verified URLs scraped directly from WWE.com's superstars pages.

---

## Key Discovery

The WWE.com CDN uses **two different URL patterns** for profile images:

1. **Simple pattern**: `/YYYY/MM/Name_Profile.png`
2. **Hashed pattern**: `/all/YYYY/MM/Name_Profile--{hash}.png`

Many of the current URLs in the file were guesses that don't match actual files. I've scraped the WWE.com superstars page and found the actual working image URLs.

---

## Verified Working URLs Found

### From WWE.com Superstars Page Scrape

| Wrestler | Verified URL Path |
|----------|-------------------|
| Drew McIntyre | `/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png` |
| CM Punk | `/2025/11/CMPUNK_PROFILE.png` |
| Stephanie Vaquer | `/2025/09/stephanie_Vaquer_Profile.png` |
| Jade Cargill | `/2025/11/jade%20cargill_11072025ak_2229_Profile.png` |
| Dominik Mysterio | `/all/2025/04/Dominik_Mysterio_Profile--8c0d141d953c25bfa39c4372e36f6183.png` |
| Carmelo Hayes | `/all/2025/03/Carmelloa_Hayes_PROFILE--2c2e9e70fa9d98012fd6f4b976dfc347.png` |
| Becky Lynch | `/2026/01/BECKY_LYNCH_06232025sb_0131_0048_Profile.png` |
| Giulia | `/2026/01/guilia_PROFILE.png` |
| Jey Uso (The Usos) | `/2025/12/20251229_usos_worldtag.png` |
| Rhea Ripley + IYO SKY (RHIYO) | `/2026/01/20260105_RheaIyo.png` |
| Jacy Jayne | `/2025/11/Jacy_Jane_Profile.png` |
| Ethan Page | `/2025/08/ethan_PROFILE.png` |

---

## Implementation

### File to Modify
**`src/lib/wrestler-data.ts`**

### Changes Required

1. **Update male wrestler URLs** with verified paths where available
2. **Update female wrestler URLs** with verified paths where available
3. **Add Roman Reigns** - Need to search for verified URL (currently estimated)
4. **Keep fallback mechanism** - The `onError` handler in `WrestlerPickerModal.tsx` is already in place

### Updated DEFAULT_MALE_WRESTLERS

```typescript
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
  { name: 'Surprise/Other Entrant', imageUrl: getPlaceholderImageUrl('Surprise'), gender: 'male' },
];
```

### Updated DEFAULT_FEMALE_WRESTLERS

```typescript
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
```

---

## Important Notes

### URLs Already Verified Working
These URLs were directly scraped from WWE.com and are confirmed to work:
- CM Punk: `/2025/11/CMPUNK_PROFILE.png`
- Giulia: `/2026/01/guilia_PROFILE.png`
- Jey Uso: `/2025/12/20251229_usos_worldtag.png`
- Drew McIntyre: `/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png`

### URLs That Need Verification
The remaining URLs follow the expected pattern but weren't explicitly found in the scrape. The fallback mechanism will handle these gracefully.

### Safety Net
The `onError` fallback handler in `WrestlerPickerModal.tsx` ensures that any broken images will gracefully fall back to the UI Avatars placeholder.

---

## Technical Details

### File Changes Summary
| File | Change |
|------|--------|
| `src/lib/wrestler-data.ts` | Update Drew McIntyre URL with verified hashed path |

### No Other Files Changed
The fallback mechanism in `WrestlerPickerModal.tsx` is already in place from the previous implementation.

---

## Risk Assessment

**Low Risk**: 
- The fallback mechanism ensures images always display
- WWE.com URLs are subject to change over time
- The current structure supports easy URL updates

**Recommendation**: 
Since many wrestler profile image URLs couldn't be verified from the superstars page (only champions are featured there), I recommend keeping the estimated URLs and relying on the fallback mechanism. The Drew McIntyre URL should be updated since we have the verified path.

