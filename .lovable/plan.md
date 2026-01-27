
# Update Rumble Participant Lists

## Overview

Update the default entrant lists in `src/lib/constants.ts` to reflect the confirmed Royal Rumble 2026 participants.

---

## Men's Rumble Entrants (21 total + 1 wildcard)

**Confirmed participants to add:**

| Wrestler | Status |
|----------|--------|
| Oba Femi | Confirmed Jan 26 |
| Bron Breakker | Confirmed Jan 26 |
| Logan Paul | Confirmed Jan 26 |
| Bronson Reed | Confirmed Jan 26 |
| Austin Theory | Confirmed Jan 26 |
| Je'Von Evans | Confirmed Jan 26 |
| Roman Reigns | Confirmed Jan 23 |
| Cody Rhodes | Existing |
| Gunther | Existing |
| Jey Uso | Existing |
| Rey Mysterio | Existing |
| Dragon Lee | Existing |
| Penta | Existing |
| Solo Sikoa | Existing |
| Jacob Fatu | Existing |
| CM Punk | Existing |
| Drew McIntyre | Existing |
| Randy Orton | Existing |
| Damian Priest | NEW |
| Sami Zayn | NEW |
| Trick Williams | Existing |
| Surprise/Other Entrant | Wildcard |

---

## Women's Rumble Entrants (16 total + 1 wildcard)

**Updated list:**

| Wrestler | Status |
|----------|--------|
| Charlotte Flair | Existing |
| Jordynne Grace | Existing |
| Giulia | Existing |
| Nia Jax | Existing |
| Chelsea Green | Existing |
| Jakara Jackson | NEW |
| Becky Lynch | NEW |
| Rhea Ripley | Existing |
| IYO SKY | Existing |
| Liv Morgan | Existing |
| Roxanne Perez | Existing |
| Raquel Rodriguez | Existing |
| Bayley | Existing |
| Lyra Valkyria | Existing |
| Asuka | Existing |
| Surprise/Other Entrant | Wildcard |

**Removed from previous list:**
- Alexa Bliss
- Lash Legend

---

## File Change

**`src/lib/constants.ts`** (Lines 47-81)

### Updated Men's List:
```typescript
export const DEFAULT_MENS_ENTRANTS = [
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
  'CM Punk',
  'Drew McIntyre',
  'Randy Orton',
  'Damian Priest',
  'Sami Zayn',
  'Trick Williams',
  'Surprise/Other Entrant',
];
```

### Updated Women's List:
```typescript
export const DEFAULT_WOMENS_ENTRANTS = [
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
  'Surprise/Other Entrant',
];
```

---

## Summary

| List | Before | After |
|------|--------|-------|
| Men's | 14 entries | 22 entries |
| Women's | 16 entries | 16 entries |

**Men's additions:** Oba Femi, Bron Breakker, Logan Paul, Bronson Reed, Austin Theory, Je'Von Evans, Damian Priest, Sami Zayn

**Women's additions:** Jakara Jackson, Becky Lynch

**Women's removals:** Alexa Bliss, Lash Legend
