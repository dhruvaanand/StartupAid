# Design System: Gommies

## 1. Visual Theme & Atmosphere

A focused, nocturnal study companion — the visual language of a dark library at midnight. The interface sits between an underground dashboard and a social game: dense enough to communicate momentum (streaks, active friends, progress rings), airy enough to feel calm and focusable. Think "productivity terminal with warmth."

- **Variance:** 7 — Asymmetric hero layouts, offset widget rows, and deliberate whitespace tension. No centered-everything grids.
- **Density:** 4–5 — Daily App Balanced. Breathing room between sections, but never so sparse it feels empty. Cards earn their presence.
- **Motion:** 6 — Fluid spring physics on every interaction. Infinite micro-loops on status indicators. Staggered section reveals on screen entry. Nothing snaps — everything glides with weight.
- **Mood:** Deep slate-indigo backgrounds with a single teal-emerald accent pulse. The mascot bear shifts emotional state in real time. The app should feel alive and aware of you.

---

## 2. Color Palette & Roles

- **Abyss Base** (`#111827`) — Primary app background. Used on all screen backgrounds, tab bars, and scroll containers. Slate-gray, not pure black.
- **Elevated Surface** (`#1F2937`) — Card backgrounds, CTA containers, circle items. One notch lighter to create neumorphic depth.
- **Deep Pit** (`#0D1117`) — Stat cards, avatar backgrounds, the deepest layer. Used for inset/sunken elements.
- **Neumorphic Light** (`rgba(27, 37, 55, 0.5)`) — Top-left highlight shadow in the dual-shadow neumorphic system.
- **Neumorphic Dark** (`#080c14`) — Bottom-right depth shadow in the dual-shadow neumorphic system.
- **Ink White** (`#FFFFFF`) — Primary text. Names, percentages, key numbers.
- **Cloud Text** (`#E2E8F0`) — Secondary text. Member names, setting labels.
- **Slate Mist** (`#94A3B8`) — Descriptive text, body copy, metadata. Never on colored backgrounds.
- **Fog Label** (`#64748B`) — Timestamps, section headers (uppercase+tracked), hint text.
- **Obsidian Border** (`#374151`) — Dividers, avatar ring borders, subtle separators.
- **Coal Border** (`#1E293B`) — Deep structural lines inside cards and setting rows.
- **Focus Teal** (`#0D9488`) — **Single accent color.** CTAs, active tab indicators, nudge icons, avatar borders, toggle active states. Saturation ~70%.
- **Alive Green** (`#10B981`) — Online status dots, course codes, active member initials, goal ring progress fill. Slightly brighter than the accent — used for "live" / "active" signals only.
- **Ember Orange** (`#FB923C`) — Streak flame icon only. One-use warm accent for gamification signals.
- **Warning Amber** (`#FBBF24`) — Sparkles icon, first-place XP, trophy accents. One-use celebration color.
- **Danger Coral** (`#F97316`) — Sign-out action only. Never used for primary interactions.

**Banned:**
- `#000000` pure black — use Abyss Base or Deep Pit
- Purple, neon blue, electric violet in any form
- Warm/cool gray fluctuation within the same screen — commit to the cool Slate family

---

## 3. Typography Rules

**Current stack:** Inter (in use — transitioning recommended).

**Target stack for future screens:**
- **Display/Headlines:** `Satoshi` or `Cabinet Grotesk` — tracking tight (`-0.02em`), weight-driven hierarchy. Large text earns its size through weight contrast, not pixel inflation.
- **Body/Paragraphs:** `Satoshi Regular` — relaxed line height (`1.6`), max `65ch`, Slate Mist (`#94A3B8`) color.
- **Mono/Numbers:** `JetBrains Mono` or `ui-monospace` — for percentages in the progress ring, XP values, session timers. Numbers deserve precision.

**Scale hierarchy (React Native px equivalents):**
- Hero name: `48px / weight 800` — the greeting anchor
- Section title: `32px / weight 800` — screen-level anchors (Circles, Profile)
- Card heading: `18px / weight 600` — course names, topic text
- Label: `13–15px / weight 600` — metadata labels, member names
- Caption: `10–13px / weight 800 uppercase tracked` — section headers (`YOUR CIRCLE`, `LEVEL`, status pills)
- Body: `14–15px / weight 400` — hint text, descriptions, streak meta

**Typography rules:**
- Uppercase + letter-spacing (`2–4px`) is reserved exclusively for section-level labels and status pill text. Do not apply to body copy.
- `fontWeight: '800'` is the brand weight — used for names, numbers, CTAs. `'600'` is secondary emphasis. `'400'` is rest state.
- Never use Serif fonts anywhere in this app.

---

## 4. Component Stylings

### Neumorphic Cards (Core Pattern)
The neumorphic double-shadow system creates the illusion of surfaces extruded from the Abyss Base background. Every raised element uses **two wrapper Views** — one for the highlight shadow, one for the depth shadow — with the actual content View inside.

- **Highlight shadow:** `offsetX: -9, offsetY: -9, blurRadius: 16, color: rgba(27,37,55,0.3–0.5)`
- **Depth shadow:** `offsetX: 9, offsetY: 9, blurRadius: 16, color: #080c14`
- **Border radius:** `24px` for standard cards, `20px` for compact cards (stat cards), `99px` for pills and avatars
- **Card fill:** Elevated Surface (`#1F2937`) — never the same color as the background
- **Optional accent border:** `1.5px solid rgba(13,148,136,0.25)` for active/selected states only

### Buttons (Primary CTA)
- **Shape:** Full-width pill (`borderRadius: 99`)
- **Fill:** Linear gradient from Focus Teal (`#13b5a7`) to Deep Teal (`#077169`), top-left to bottom-right
- **Inner shadow (glass edge):** `offsetX: -4, offsetY: -4, blurRadius: 8, color: rgba(255,255,255,0.1)` — simulates inner light refraction
- **Outer depth shadow:** `offsetX: 6, offsetY: 6, blurRadius: 12, color: rgba(0,0,0,0.6)`
- **Active state:** Gradient reverses direction + `scale(0.97)` via spring (`speed: 100, bounciness: 0`) — physical push tactility
- **Label:** `17px, weight 800, uppercase, letterSpacing: -0.2` — command, not suggestion
- No outer glow. No neon. No hover effects on mobile.

### Status Pills
- **Active (study session):** `backgroundColor: #022C22`, `borderColor: rgba(16,185,129,0.25)`, text `#10B981`
- **Idle:** `backgroundColor: #111827`, `borderColor: #374151`, text `#64748B`
- **Shape:** `borderRadius: 99`, `paddingHorizontal: 12, paddingVertical: 6`
- **Text:** `10px, weight 800, uppercase, letterSpacing: 1`

### Avatar Circles
- **Size:** `56px` for circle members, `44px` for top bar avatar
- **Fill:** Deep Pit (`#111827` or `#1F2937`)
- **Border:** `1.5px solid #374151` base; `1.5px solid rgba(13,148,136,0.25)` when selected/active
- **Initial text:** `Ink White`, `weight 800`, centered
- **Status dot:** `16px` circle, `2.5px border` matching background color for separation. `#10B981` = online, `#F59E0B` = away. Pulse animation when active.
- **Nudge action:** Small `32px` circular button floating `top: -8, right: -8`. Icon-only — `Waves` icon from lucide at `15px`.

### Progress Ring (Home Hero)
- **Diameter:** `110px`
- **Track:** `8px border`, `borderColor: #111827` (sunken into background)
- **Fill arc:** `8px border`, `#10B981` (Alive Green)
- **Center label:** Percentage in `28px, weight 800, Ink White`
- **Below label:** "Daily Goal" in `14px, weight 600, Slate Mist`
- Card background: Gradient `#1F2937 → #111827`, diagonal, rounded `24px`

### Member Tooltip
- **Background:** `#020617` (deepest possible dark)
- **Border:** `1px solid #1E293B`
- **Border radius:** `24px`
- **Neumorphic shadows:** Lighter version (5px offset, 10px blur)
- **Name:** Focus Teal weight 800 inline in body text

### NudgeToast (Dynamic Island style)
- **Pill shape:** `borderRadius: 99`, full-width with horizontal margins
- **Fill:** `rgba(17,24,39,0.85)` with `expo-blur` backdrop
- **Border:** `1px solid #1e293b`
- **Entry animation:** Spring slide-in from top (`translateY: -150 → 20`), `tension: 40, friction: 7`, native driver
- **Exit:** Timing slide-out (`300ms`), native driver
- **No emojis in message text** — clean typographic messages only

### Tab Bar
- **Background:** Deep Pit (`#0D1117`)
- **Border top:** `1px solid rgba(255,255,255,0.06)`
- **Height:** `80px`, `paddingTop: 12, paddingBottom: 20`
- **Active icon:** Neumorphic recessed pill — gradient `#0D1117 → #1A232F`, `borderRadius: 16`, with icon + label below in Focus Teal (`10px, weight 800`)
- **Inactive icon:** Icon only, color `#64748B`
- **Tab switch:** No animation needed — state change is instant visual; save motion budget for content transitions

### Settings Rows (Profile)
- Separated by `1px solid rgba(30,41,59,0.25)` bottom borders — no card boxes
- Left: label `16px weight 600` + hint `13px weight 400 Fog Label`
- Right: `Switch` or `chevron-right` in `#64748B`
- Switch: `trackColor: { false: '#334155', true: '#0D9488' }`, `thumbColor: #E5E7EB`

---

## 5. Layout Principles

**Screen structure:**
- `SafeAreaView` with `backgroundColor: #111827` as root
- `ScrollView` with `paddingBottom: 60` and no visible scrollbar
- All content: `paddingHorizontal: 24` (system-wide horizontal rhythm)

**Home Screen — Hero Widget Row:**
Asymmetric: Progress Ring card (left) + Mascot bear (right), horizontally spaced with `gap: 48`. The mascot floats free with no card wrapper. This deliberate asymmetry (structured card vs. floating illustration) is the visual signature of the home screen.

**Greeting:**
Two-line — sub-label time greeting (`#94A3B8, 22px`) stacked above large name (`#FFFFFF, 48px, lineHeight: 56`). Left-aligned. No centered hero text.

**Section labels:**
`UPPERCASE, letterSpacing: 2.5, 13px, weight 800, #64748B`. The label sits above its content with `paddingLeft: 24`. Acts as a quiet organizational system.

**Horizontal member scroll:**
Overflow visible, `gap: 24` between members, `paddingHorizontal: 24`. Members never wrap — always horizontal scroll.

**Leaderboard (Compete):**
Full-width rows with `gap: 16`. No cards — just neumorphic row containers. First-place row gets a subtle `#10B981` outer glow ring.

**Profile stats:**
Three equal stat cards in a single `flexDirection: row` row with `gap: 16`. The only 3-column layout in the app — justified because it's pure data, not feature marketing.

**No element overlaps.** Every component occupies a clean, dedicated spatial zone. Z-index only for modals and toasts (`z: 9999`).

---

## 6. Motion & Interaction

**Spring physics system (all interactive elements):**
- `Animated.spring`, `speed: 100, bounciness: 0` for tactile press (scale 0.97→1.0)
- `Animated.spring`, `tension: 40, friction: 7` for entrances (toasts, modals)
- `Animated.spring`, `tension: 50, friction: 10` for tab indicator transitions

**Perpetual micro-loops:**
- Status dot pulse: `Animated.loop` on opacity `0.4→1.0` at `700ms` per half-cycle
- Sparkle icon: Same pulse loop — communicates "live social activity"
- Play icon: Subtle scale breathing on idle CTA

**Section reveal (home screen):**
Staggered `Reanimated` entrance for 4 sections — each with `withDelay(index * 80ms)` spring reveal. Sections animate in from slightly below (`translateY: 20 → 0`) with opacity fade. Never instant mount.

**Performance rules:**
- All press/scale animations: `useNativeDriver: true` on `transform`
- Color/opacity animations that reference layout (tab indicator `left`): Convert to `transform: translateX` with computed pixel values so native driver can be used
- `NudgeToast`: Always `useNativeDriver: true` — it uses only `translateY`
- Grain/noise: If added, always on `position: fixed, pointer-events: none` pseudo-element — never on scroll containers

**No bounce, no elastic, no overshoot.** `bounciness: 0` is the rule. Spring physics simulate weight, not toys.

---

## 7. Anti-Patterns (Banned)

**Emojis:** Strictly banned everywhere — in labels, button text, message strings, alt text, and toast messages. Replace with Lucide React Native icons or plain typography.

**`Inter` font:** Banned as the brand font. Use `Satoshi` or `Cabinet Grotesk` for new screens. Legacy Inter usage should be migrated over time.

**Pure black (`#000000`):** Never. Use Abyss Base (`#111827`) or Deep Pit (`#0D1117`).

**Neon outer glows:** No `box-shadow` glows on buttons. Inner refraction border + depth shadow only.

**Oversaturated accents:** The accent is teal, not electric turquoise. Keep saturation below 80%.

**Gradient text on large headers:** The name in the greeting is pure white, not gradient-filled.

**Serif fonts:** Banned entirely in this app — no editorial exceptions.

**Centered hero layouts:** All key sections (greeting, CTA card, circle members) are left-aligned.

**3-column equal card grids:** The only 3-column use is the compact stat row on Profile (data cells, not feature cards).

**Generic placeholder names:** No "John Doe", "Jane Smith", "User 1". Real-feeling names only.

**Round fake numbers:** No `100%`, `50%`, `99.99%`. Use organic values like `73%`, `12.4h`, `47 XP`.

**AI copywriting clichés:** No "Elevate your studies", "Seamless collaboration", "Unleash your potential". Use direct, concrete verbs: "Begin focus session", "Wave at a friend", "Track your progress."

**`console.error` / `console.log` in production paths:** Debug logging must be removed from all fetch handlers, nudge senders, and auth flows before release.

**`useNativeDriver: false` where native driver is possible:** Always animate via `transform` and `opacity`. Convert layout-property animations (`left`, `top`) to `translateX`/`translateY` equivalents.

**Generic loading spinners:** `ActivityIndicator` is acceptable as a fallback but skeletal loaders matching the exact layout shape are preferred for cards and lists.

**Non-interactive chevron rows:** If a row shows `chevron-right`, it must be wrapped in `Pressable` with a destination. Visual affordance without interaction is a UX lie.
