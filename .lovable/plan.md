

# Plan: Add Verified WWE Profile Images and Official Royal Rumble Logo

## Overview
Update the wrestler image URLs with verified paths scraped from WWE.com and replace the current Crown icon with the official Royal Rumble 2026 logo.

---

## Part 1: Verified WWE.com Profile Image URLs

From scraping WWE.com superstars pages, I found verified working URLs for many wrestlers. The WWE CDN uses two patterns:
1. Simple: `/YYYY/MM/Name_Profile.png`
2. Hashed: `/all/YYYY/MM/Name_Profile--{hash}.png`

### Verified URLs Found

| Wrestler | Verified URL Path |
|----------|-------------------|
| Drew McIntyre | `/all/2021/09/Drew_Mcintyre_Profile--aca391095fe74e721e098cadc93571d3.png` |
| CM Punk | `/2025/11/CMPUNK_PROFILE.png` |
| Becky Lynch | `/2026/01/BECKY_LYNCH_06232025sb_0131_0048_Profile.png` |
| Giulia | `/2026/01/guilia_PROFILE.png` |
| The Usos (Jey Uso) | `/2025/12/20251229_usos_worldtag.png` |
| Stephanie Vaquer | `/2025/09/stephanie_Vaquer_Profile.png` |
| Jade Cargill | `/2025/11/jade%20cargill_11072025ak_2229_Profile.png` |
| Dominik Mysterio | `/all/2025/04/Dominik_Mysterio_Profile--8c0d141d953c25bfa39c4372e36f6183.png` |
| Carmelo Hayes | `/all/2025/03/Carmelloa_Hayes_PROFILE--2c2e9e70fa9d98012fd6f4b976dfc347.png` |
| Jacy Jayne | `/2025/11/Jacy_Jane_Profile.png` |
| Ethan Page | `/2025/08/ethan_PROFILE.png` |
| RHIYO (Rhea + IYO) | `/2026/01/20260105_RheaIyo.png` |

---

## Part 2: Add Official Royal Rumble Logo

The user uploaded the official Royal Rumble Riyadh 2026 logo image. This will replace the current Crown icon in the Logo component.

### Current Logo Component
Currently uses a `<Crown>` Lucide icon with text "ROYAL RUMBLE" below it.

### Updated Logo Component
Will display the official WWE Royal Rumble event logo image.

---

## Files to Modify

### 1. `src/lib/wrestler-data.ts`
Add more verified WWE.com profile URLs for wrestlers. Keep the existing fallback mechanism.

### 2. Copy Royal Rumble logo to project
Copy the uploaded image to `src/assets/royal-rumble-logo.jpeg`

### 3. `src/components/Logo.tsx`
Update to use the official Royal Rumble logo image instead of the Crown icon.

---

## Technical Details

### Updated wrestler-data.ts

The file already has some working URLs. I'll update the estimates with verified paths where available. The `onError` fallback handler in `WrestlerPickerModal.tsx` will continue to handle any images that fail to load.

Note: Many wrestlers in the current list (Roman Reigns, Cody Rhodes, etc.) don't have verified individual profile URLs from the champions section - they only appear on their individual superstar pages which don't expose the profile image URL directly. The fallback mechanism handles these gracefully.

### Updated Logo.tsx

```tsx
import { motion } from "framer-motion";
import royalRumbleLogo from "@/assets/royal-rumble-logo.jpeg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = false }: LogoProps) {
  const sizes = {
    sm: { width: 120, title: "text-sm" },
    md: { width: 180, title: "text-sm" },
    lg: { width: 280, title: "text-lg" },
  };

  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.img
        src={royalRumbleLogo}
        alt="Royal Rumble 2026"
        style={{ width: sizes[size].width }}
        className="object-contain"
        animate={{ 
          scale: [1, 1.02, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 2 
        }}
      />

      {showTagline && (
        <motion.p 
          className={`text-muted-foreground ${sizes[size].title} mt-2`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Party Tracker
        </motion.p>
      )}
    </motion.div>
  );
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/assets/royal-rumble-logo.jpeg` | Copy uploaded logo image |
| `src/components/Logo.tsx` | Replace Crown icon with official logo image |
| `src/lib/wrestler-data.ts` | No immediate changes needed - existing verified URLs are already in place |

---

## Notes

- The Drew McIntyre URL was already updated in the previous change with the verified hashed path
- CM Punk, Giulia, and Jey Uso URLs are already correct in the current file
- The `onError` fallback mechanism ensures graceful degradation for any broken images
- The Royal Rumble logo will be imported as an ES6 module for proper bundling

