

# Plan: Add Real WWE Wrestler Photos

## Overview
Update `wrestler-data.ts` to use official WWE.com profile image URLs instead of placeholder avatars. These images are hosted on WWE's CDN and provide high-quality wrestler headshots.

---

## Important Caveat
WWE.com image URLs can change when WWE updates their website or wrestler profiles. If images stop loading in the future, you may need to update the URLs or switch back to placeholder avatars as a fallback.

---

## Implementation

### File to Modify
**`src/lib/wrestler-data.ts`**

Replace the current placeholder avatar URLs with actual WWE.com profile image URLs.

### WWE Image URL Pattern
WWE hosts wrestler profile images at URLs like:
```
https://www.wwe.com/f/styles/wwe_1_1_540/public/{year}/{month}/{filename}_Profile.png
```

### Wrestler Image Mapping

**Male Wrestlers:**
| Wrestler | Image URL |
|----------|-----------|
| Roman Reigns | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/12/Roman_Reigns_Profile.png` |
| Cody Rhodes | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Cody_Rhodes_Profile.png` |
| Gunther | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/08/GUNTHER_Profile.png` |
| Jey Uso | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/12/20251229_usos_worldtag.png` |
| Solo Sikoa | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Solo_Sikoa_Profile.png` |
| Jacob Fatu | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Jacob_Fatu_Profile.png` |
| Rey Mysterio | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Rey_Mysterio_Profile.png` |
| Dragon Lee | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Dragon_Lee_Profile.png` |
| Penta | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/02/Penta_Profile.png` |
| CM Punk | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/CMPUNK_PROFILE.png` |
| Drew McIntyre | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Drew_McIntyre_Profile.png` |
| Randy Orton | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Randy_Orton_Profile.png` |
| Trick Williams | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Trick_Williams_Profile.png` |
| Surprise/Other Entrant | Keep placeholder avatar |

**Female Wrestlers:**
| Wrestler | Image URL |
|----------|-----------|
| Liv Morgan | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Liv_Morgan_Profile.png` |
| Rhea Ripley | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Rhea_Ripley_Profile.png` |
| IYO SKY | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/IYO_SKY_Profile.png` |
| Charlotte Flair | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Charlotte_Flair_Profile.png` |
| Bayley | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Bayley_Profile.png` |
| Asuka | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/04/Asuka_Profile.png` |
| Giulia | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2026/01/guilia_PROFILE.png` |
| Jordynne Grace | Keep placeholder avatar (not WWE roster) |
| Alexa Bliss | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Alexa_Bliss_Profile.png` |
| Nia Jax | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Nia_Jax_Profile.png` |
| Roxanne Perez | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Roxanne_Perez_Profile.png` |
| Raquel Rodriguez | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Raquel_Rodriguez_Profile.png` |
| Lyra Valkyria | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Lyra_Valkyria_Profile.png` |
| Lash Legend | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Lash_Legend_Profile.png` |
| Chelsea Green | `https://www.wwe.com/f/styles/wwe_1_1_540/public/2025/11/Chelsea_Green_Profile.png` |
| Surprise/Other Entrant | Keep placeholder avatar |

---

## Technical Details

### Updated Code Structure

```typescript
// Wrestler data with WWE.com official images
// Note: URLs may change if WWE updates their website

export interface WrestlerData {
  name: string;
  imageUrl: string;
  gender: 'male' | 'female';
}

// Fallback to placeholder if WWE image fails
export function getWrestlerImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=D4AF37&color=0A0A0A&size=100&bold=true`;
}

// WWE CDN base URL
const WWE_CDN = 'https://www.wwe.com/f/styles/wwe_1_1_540/public';

// Male wrestlers with WWE profile images
export const DEFAULT_MALE_WRESTLERS: WrestlerData[] = [
  { name: 'Roman Reigns', imageUrl: `${WWE_CDN}/2025/12/Roman_Reigns_Profile.png`, gender: 'male' },
  { name: 'Cody Rhodes', imageUrl: `${WWE_CDN}/2025/04/Cody_Rhodes_Profile.png`, gender: 'male' },
  // ... etc
];
```

### Add Image Error Fallback
Update `WrestlerPickerModal.tsx` to handle image loading errors by falling back to the placeholder avatar:

```tsx
<img
  src={getWrestlerImageUrl(wrestler)}
  alt={wrestler}
  className="w-full h-full object-cover"
  loading="lazy"
  onError={(e) => {
    // Fallback to placeholder avatar if WWE image fails
    const target = e.target as HTMLImageElement;
    const encodedName = encodeURIComponent(wrestler);
    target.src = `https://ui-avatars.com/api/?name=${encodedName}&background=D4AF37&color=0A0A0A&size=100&bold=true`;
  }}
/>
```

---

## Files to Modify

1. **`src/lib/wrestler-data.ts`** - Replace placeholder URLs with WWE.com CDN URLs
2. **`src/components/WrestlerPickerModal.tsx`** - Add `onError` fallback handler for images

---

## Risk Mitigation

Since WWE.com image URLs can change:
1. The fallback `onError` handler ensures graceful degradation to placeholder avatars
2. The `getWrestlerImageUrl()` function is kept as a fallback generator
3. URLs are constructed using a base constant for easy updates if WWE changes their CDN structure

