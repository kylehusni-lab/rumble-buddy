
# Royal Rumble Party Tracker - Application Guidelines

## 1. Application Overview

A digitized poster board for tracking Royal Rumble watch parties. Designed for annual use during WWE Royal Rumble events.

### Core Purpose
- Track predictions and scores during live Royal Rumble viewing
- Support both solo users and group watch parties (up to 10 players)
- Provide TV display mode for party visibility
- No emojis throughout the application

### Primary Platforms
- Mobile-first design (375px target width)
- Desktop support
- TV display mode for 10-foot viewing

---

## 2. User Roles & Flows

### 2.1 Solo Mode
Individual users track their own predictions without a group.

**Flow:**
1. `/solo/setup` - Create account (display name, email, 4-digit PIN)
2. `/solo/picks` - Make predictions using card stack interface
3. `/solo/dashboard` - View picks, manually score results

**Permissions:**
- Full control over own picks and results
- No visibility to other users
- Self-managed scoring via `SoloScoringModal`

**Data:**
- `solo_players` table (owns their record)
- `solo_picks` table (predictions)
- `solo_results` table (self-scored outcomes)

### 2.2 Party Mode - Host
Creates and manages a group watch party.

**Flow:**
1. Index → "I'm Hosting" → Anonymous auth → Generate 4-digit group code
2. `/player/join?code=XXXX&host=true` - Enter name/email
3. `/host/setup/:code` - Set 4-digit PIN, view guest list
4. `/host/verify/:code` - Re-enter PIN to access controls
5. `/host/control/:code` - Live event management

**Permissions:**
- Create party, set/verify PIN
- View all players in party
- Score matches and props
- Manage Rumble entrants (assign wrestlers, track eliminations)
- Access TV display
- Participate as a player (auto-added to party)

**Host-Specific Features:**
- Quick Actions menu (My Picks, TV Display)
- Bulk props scoring modal
- Rumble entry control panel
- Winner declaration modal

### 2.3 Party Mode - Player (Guest)
Joins an existing watch party.

**Flow:**
1. Index → "Join a Group" → Enter 4-digit code
2. `/player/join?code=XXXX` - Enter name/email
3. `/player/picks/:code` - Make predictions
4. `/player/dashboard/:code` - View picks and leaderboard

**Permissions:**
- Join party by code (read-only party access)
- Create/update own picks (before scoring)
- View fellow players on leaderboard
- View own assigned Rumble numbers

**Restrictions:**
- Cannot score matches
- Cannot manage Rumble entrants
- Cannot access host controls

### 2.4 Demo Mode
Pre-seeded test environment with 6 fake players.

**Purpose:** Testing host controls without real participants

**How it works:**
1. Index → "Try Demo Mode"
2. Creates party with PIN "0000"
3. Uses `seed_demo_player` RPC to create 6 players with `user_id = NULL`
4. Uses `seed_demo_picks` RPC to generate random picks
5. Host (Kyle) is authenticated and can access all controls

---

## 3. Scoring System

### 3.1 Point Values (from `src/lib/constants.ts`)

| Category | Points | Constant |
|----------|--------|----------|
| Undercard Match Winner | +25 | `SCORING.UNDERCARD_WINNER` |
| Chaos Prop Bet | +10 | `SCORING.PROP_BET` |
| Rumble Winner (Pick) | +50 | `SCORING.RUMBLE_WINNER_PICK` |
| Rumble Winner (Number) | +50 | `SCORING.RUMBLE_WINNER_NUMBER` |
| Elimination (Number) | +5 | `SCORING.ELIMINATION` |
| Iron Man/Woman | +20 | `SCORING.IRON_MAN` |
| Final Four | +10 | `SCORING.FINAL_FOUR` |
| Jobber Penalty (<60s) | -10 | `SCORING.JOBBER_PENALTY` |
| First Elimination | +10 | `SCORING.FIRST_ELIMINATION` |
| Most Eliminations | +20 | `SCORING.MOST_ELIMINATIONS` |
| Longest Time | +20 | `SCORING.LONGEST_TIME` |
| Entrant Guess (#1/#30) | +15 | `SCORING.ENTRANT_GUESS` |
| No-Show Prop | +10 | `SCORING.NO_SHOW_PROP` |

### 3.2 Scoring Rules

**Undercard Matches:**
- Host selects winner → players with matching pick get +25

**Chaos Props (Yes/No questions):**
- 6 props per Rumble (Men's and Women's)
- Correct answer = +10 points

**Rumble Winner:**
- Picking the correct wrestler = +50 (pick bonus)
- Owning the winning entry number = +50 (number bonus)
- Same player can earn both if they picked AND owned the number

**Rumble Numbers:**
- Numbers 1-30 randomly assigned to players
- Each elimination earns the number owner +5
- Jobber penalty: If your wrestler is eliminated in under 60 seconds = -10

**Final Four:**
- Players pick 4 wrestlers they think will be in final four
- Set-based matching: Any overlap with actual final 4 = +10 per match
- Maximum +40 if all 4 correct

**Iron Man/Woman:**
- Automatically calculated when winner declared
- Player who correctly picked longest-lasting wrestler = +20

### 3.3 Anti-Cheating

**Solo Mode:**
- `save_solo_pick` RPC blocks updates if `solo_results` entry exists for that match
- Direct UPDATE on `solo_picks` blocked by RLS

**Party Mode:**
- Picks have `points_awarded` column
- UPDATE policy: `points_awarded IS NULL` (can't change scored picks)
- Only hosts can create `match_results`

---

## 4. Database Architecture

### 4.1 Table Relationships

```
parties (1) ─── (many) players
    │                    │
    │                    └─── (many) picks
    │
    └─── (many) rumble_numbers
    │
    └─── (many) match_results

solo_players (1) ─── (many) solo_picks
                         │
                         └─── (many) solo_results
```

### 4.2 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `parties` | Watch party groups | code, host_user_id, host_pin, status |
| `players` | Party participants | party_code, user_id, display_name, points |
| `picks` | Player predictions | player_id, match_id, prediction |
| `rumble_numbers` | Number assignments | party_code, number, wrestler_name, assigned_to_player_id |
| `match_results` | Scored outcomes | party_code, match_id, result |
| `solo_players` | Solo mode users | email, pin, display_name |
| `solo_picks` | Solo predictions | solo_player_id, match_id, prediction |
| `solo_results` | Solo scored results | solo_player_id, match_id, result |
| `wrestlers` | Roster database | name, division, image_url, is_confirmed |

### 4.3 Public Views (Security Filtered)

| View | Exposes | Hides |
|------|---------|-------|
| `parties_public` | code, status, entrants, timestamps | host_pin, host_session_id |
| `players_public` | id, display_name, points, party_code | email, session_id, user_id |
| `solo_players_public` | id, display_name, timestamps | email, pin, user_id |

### 4.4 Security Functions (SECURITY DEFINER)

| Function | Purpose |
|----------|---------|
| `is_party_host(p_party_code)` | Returns true if current user owns the party |
| `is_party_member(p_party_code)` | Returns true if current user is a player in party |
| `verify_host_pin(p_party_code, p_pin)` | Validates PIN without exposing it |
| `set_host_pin(p_party_code, p_pin)` | Sets PIN only if not already set |
| `seed_demo_player(...)` | Creates demo players with null user_id |
| `seed_demo_picks(p_picks)` | Bulk inserts demo picks |
| `get_tv_snapshot(p_party_code)` | Returns all TV data in one call |
| `save_solo_pick(...)` | Validates and saves solo picks with anti-cheat |

### 4.5 RLS Patterns

**Pattern: Host-Only Writes**
```sql
CREATE POLICY "Hosts can create X"
ON public.table FOR INSERT
TO authenticated
WITH CHECK (is_party_host(party_code));
```

**Pattern: Party Member Reads**
```sql
CREATE POLICY "Party members can read X"
ON public.table FOR SELECT
TO authenticated
USING (is_party_member(party_code) OR is_party_host(party_code));
```

**Pattern: Own Record Only**
```sql
CREATE POLICY "Users can read own record"
ON public.table FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

## 5. UI/UX Conventions

### 5.1 Mobile-First Standards

| Metric | Value |
|--------|-------|
| Target Width | 375px |
| Min Tap Target | 44px |
| Min Body Font | 14px |
| Primary Actions | Bottom 1/3 (thumb zone) |

**Avoid:**
- Side-by-side grids on mobile
- Horizontal scrolling
- Actions requiring precise taps

### 5.2 Navigation Patterns

**Bottom Navigation Bar** (PlayerDashboard)
- Fixed position, 5 tabs: Numbers, Matches, Men's, Women's, Chaos
- Active state with glow effect
- Gradient background

**Sticky Headers**
- Score + rank display
- Backdrop blur effect
- Collapse on scroll (useAutoHideHeader hook)

**Host Quick Actions**
- Sheet-based menu
- Links: My Picks, TV Display, View All Picks

### 5.3 Component Patterns

**Collapsible Sections**
- Header with category name + completion badge
- Green checkmark for correct, muted count for pending
- Expand/collapse with Radix Collapsible

**Pick Cards (Swipeable Flow)**
- PickCardHeader: icon, title, counter, points
- Touch handlers: 50px threshold for navigation
- Back navigation is role-aware

**Wrestler Picker Modal**
- Full-screen search
- 100x100px cards with circular photos
- Confetti on selection

**Number Grid (Rumble)**
- 30 cells, 6x5 grid
- Status colors: gold (active), muted (eliminated), pulse (winner)
- Click to reveal wrestler assignment

### 5.4 Visual Identity

| Token | Value | Usage |
|-------|-------|-------|
| Riyadh Gold | #D4AF37 | Primary accent, winners |
| Riyadh Green | #006C35 | Correct picks, success |
| Royal Purple | #4B0082 | Secondary accent |
| Event Black | #0A0A0A | Backgrounds |

**Typography:**
- Display: Impact/Inter Black
- Body: System sans-serif

**Effects:**
- Gold shimmer for celebrations
- Gradient cards: card-gradient, card-gradient-gold
- GPU-accelerated keyframes (no Framer Motion in hot paths)

### 5.5 Animation Philosophy

Prefer simplified, purposeful animations:
- Clean fades and subtle scaling
- Avoid 3D flips, particle effects, excessive bouncing
- One well-timed hero animation > scattered micro-interactions

---

## 6. Code Standards & Practices

### 6.1 File Organization

```
src/
├── components/
│   ├── ui/           # shadcn primitives
│   ├── dashboard/    # player dashboard sections
│   ├── host/         # host control components
│   ├── picks/        # pick flow cards
│   ├── tv/           # TV display components
│   └── [feature].tsx # standalone components
├── hooks/            # custom React hooks
├── lib/              # utilities, constants, helpers
├── pages/            # route components
└── integrations/     # Supabase client (auto-generated)
```

### 6.2 Component Guidelines

**Size Limits:**
- Components > 300 lines should be refactored
- Extract reusable logic to hooks
- Split large components into focused sub-components

**Naming:**
- Components: PascalCase
- Hooks: useCamelCase
- Files: kebab-case or PascalCase (match export)

**Props:**
- Destructure in function signature
- Use TypeScript interfaces
- Default optional props inline

### 6.3 State Management

**Local State:** useState for UI state
**Server State:** React Query (TanStack Query)
**Session State:** localStorage + custom hooks (useAuth, useSoloCloud)
**Realtime:** Supabase channels for TV display

### 6.4 Supabase Patterns

**Client Import:**
```typescript
import { supabase } from "@/integrations/supabase/client";
```

**Type-safe Queries:**
```typescript
const { data } = await supabase
  .from("players")
  .select("id, display_name")
  .eq("party_code", code);
// data is typed from generated types
```

**RPC Calls:**
```typescript
const { data } = await supabase.rpc("verify_host_pin", {
  p_party_code: code,
  p_pin: pin,
});
```

### 6.5 Error Handling

- Use `toast.error()` for user-facing errors
- Log to console for debugging
- Wrap async operations in try/catch
- Provide fallback UI for loading states

### 6.6 Testing Considerations

- Demo mode for manual testing
- Edge function logs for backend debugging
- Browser tools for visual/interaction testing
- Network request inspection for API issues

---

## 7. Event Configuration

All event-specific data lives in `src/lib/constants.ts`:

- `EVENT_CONFIG`: Date, venue, location
- `UNDERCARD_MATCHES`: Pre-set match cards
- `CHAOS_PROPS`: Yes/No prop questions
- `RUMBLE_PROPS`: Wrestler-based predictions
- `DEFAULT_MENS_ENTRANTS` / `DEFAULT_WOMENS_ENTRANTS`: Roster lists
- `CARD_CONFIG`: Pick flow sequence
- `SCORING`: Point values

**Updating for Next Year:**
1. Update `EVENT_CONFIG.DATE`
2. Modify `UNDERCARD_MATCHES` for new card
3. Update entrant lists with confirmed/rumored wrestlers
4. Adjust `CHAOS_PROPS` for new scenarios

---

## 8. Security Considerations

### Authentication
- Anonymous auth for seamless party joining
- PIN-based host verification (4 digits)
- Session persistence via localStorage

### Data Protection
- Views hide PII (email, session_id)
- RLS enforces party membership for reads
- SECURITY DEFINER functions bypass RLS safely

### Anti-Tampering
- Picks locked after scoring (`points_awarded IS NOT NULL`)
- Solo picks blocked after results exist
- No client-side role storage (server-verified)

---

## 9. Legal & Compliance

- Fan-made, unofficial application
- WWE trademarks/images used under Fair Use
- No commercial monetization
- Disclaimer on `/legal` page and footer

