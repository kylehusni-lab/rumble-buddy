

# Request Access Modal + Enhanced Navigation + Learn More CTA

## Summary
This plan addresses three improvements to the homepage and join flow:
1. Make all "Request Access" buttons trigger the modal (currently JoinParty navigates away)
2. Replace the bouncing "Scroll" indicator with a more engaging "Learn More" button
3. Expand the top navigation with more section links

---

## 1. Consistent Request Access Modal on JoinParty Page

**Current behavior**: The "Request Access" button on `/join` navigates back to the homepage instead of opening the modal directly.

**New behavior**: Opens the same Request Access modal inline without leaving the page.

**File**: `src/pages/JoinParty.tsx`

**Changes**:
- Import `RequestAccessModal` component
- Add `isModalOpen` state
- Replace `navigate("/")` with `setIsModalOpen(true)` on the Request Access button
- Render the modal at the bottom of the component

---

## 2. Replace Scroll Indicator with "Learn More" Button

**Current behavior**: Passive "Scroll" text with a bouncing chevron that has no interactivity.

**New behavior**: An interactive "Learn More" button that:
- Displays as a subtle pill/button with border
- Smooth-scrolls to the Story section when clicked
- Still has the animated chevron to draw attention
- Feels intentional and actionable

**Files**: 
- `src/components/home/HeroSection.tsx` - Accept new `onLearnMore` prop, update UI
- `src/pages/HomePage.tsx` - Pass `scrollToStory` as `onLearnMore`

**Visual treatment**:
```text
+---------------------------+
|  Learn More               |
|      v (animated)         |
+---------------------------+
```
- Rounded pill shape with border
- Hover state that brightens
- Text changes from "Scroll" to "Learn More"

---

## 3. Expanded Top Navigation

**Current nav links**: Our Story, Features

**Proposed nav links**: Our Story, Features, TV Mode, Demo

| Link | Action |
|------|--------|
| Our Story | Scroll to Story section |
| Features | Scroll to Features section |
| TV Mode | Scroll to TV Mode Gallery section |
| Demo | Navigate to `/demo` |

**Files**:
- `src/components/OttNavBar.tsx` - Add new props and nav items
- `src/pages/HomePage.tsx` - Add tvModeRef, pass new handlers

---

## Technical Implementation Details

### JoinParty.tsx Changes
```tsx
// New imports
import { RequestAccessModal } from "@/components/RequestAccessModal";

// New state
const [isModalOpen, setIsModalOpen] = useState(false);

// Updated button handler
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsModalOpen(true)}
  className="text-ott-accent hover:text-ott-accent/80"
>
  Request Access
</Button>

// Add modal at end of component
<RequestAccessModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
/>
```

### HeroSection.tsx Changes
```tsx
// Updated props interface
interface HeroSectionProps {
  onRequestAccess: () => void;
  onLearnMore?: () => void;  // New
}

// Replace scroll indicator with interactive button
<motion.button
  onClick={onLearnMore}
  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 
             px-4 py-2 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm
             text-muted-foreground hover:text-foreground hover:border-border transition-colors
             group cursor-pointer"
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 1, duration: 0.5 }}
>
  <span className="text-xs font-medium uppercase tracking-wider">Learn More</span>
  <motion.div
    animate={{ y: [0, 4, 0] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
  >
    <ChevronDown className="w-4 h-4" />
  </motion.div>
</motion.button>
```

### OttNavBar.tsx Changes
```tsx
// Updated props
interface OttNavBarProps {
  onStoryClick?: () => void;
  onFeaturesClick?: () => void;
  onTvModeClick?: () => void;  // New
}

// Updated nav links section
<div className="hidden md:flex items-center gap-6">
  <button onClick={onStoryClick} className="...">
    Our Story
  </button>
  <button onClick={onFeaturesClick} className="...">
    Features
  </button>
  <button onClick={onTvModeClick} className="...">
    TV Mode
  </button>
  <button onClick={() => navigate("/demo")} className="...">
    Demo
  </button>
</div>
```

### HomePage.tsx Changes
```tsx
// Add new ref
const tvModeRef = useRef<HTMLDivElement>(null);

// Add scroll function
const scrollToTvMode = () => {
  tvModeRef.current?.scrollIntoView({ behavior: "smooth" });
};

// Update HeroSection
<HeroSection 
  onRequestAccess={() => setIsRequestModalOpen(true)} 
  onLearnMore={scrollToStory}  // New prop
/>

// Update OttNavBar
<OttNavBar 
  onStoryClick={scrollToStory} 
  onFeaturesClick={scrollToFeatures}
  onTvModeClick={scrollToTvMode}  // New prop
/>

// Wrap TvModeGallery with ref
<div ref={tvModeRef}>
  <TvModeGallery id="tv-mode" />
</div>
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/pages/JoinParty.tsx` | Add modal import, state, and rendering |
| `src/components/home/HeroSection.tsx` | Add `onLearnMore` prop, replace scroll indicator with button |
| `src/pages/HomePage.tsx` | Add tvModeRef, pass scroll handlers to both components |
| `src/components/OttNavBar.tsx` | Add TV Mode and Demo nav links with new props |

---

## User Experience Impact

- **Request Access**: Users can now request access from any page without losing context
- **Learn More**: Clear call-to-action that invites exploration rather than passive scrolling hint
- **Navigation**: Users can quickly jump to any section from the top nav, including TV Mode and Demo

