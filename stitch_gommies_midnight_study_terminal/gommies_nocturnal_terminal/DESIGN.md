# Design System Specification: Nocturnal Productivity Terminal

## 1. Overview & Creative North Star: "The Midnight Architect"
The Creative North Star for this design system is **"The Midnight Architect."** Unlike standard productivity tools that rely on stark white backgrounds and rigid grids, this system celebrates the focus of the nocturnal hours. It blends the precision of a terminal interface with the tactile comfort of high-end industrial design.

The goal is to move away from "flat" web design toward a sophisticated, layered environment. We achieve this through **intentional asymmetry**, where left-aligned headers create a strong vertical anchor, and content flows with purposeful breathing room. This isn't just a dashboard; it’s a focused digital sanctuary.

---

## 2. Colors & Tonal Depth
The palette is rooted in the deep spectrum of the night, utilizing "Abyss" and "Deep Pit" tones to minimize eye strain, while "Focus Teal" and "Alive Green" act as biological signals for progress and life.

### Color Tokens
*   **Surface:** `#0c1322` (The foundation)
*   **Surface Container Low:** `#141b2b` (Deep Pit / Submerged sections)
*   **Surface Container High:** `#232a3a` (Elevated Surface / Interactive regions)
*   **Primary:** `#6bd8cb` (Focus Teal / Interactive elements)
*   **Secondary:** `#4edea3` (Alive Green / Growth & XP)
*   **Outline Variant:** `#3d4947` (The "Ghost Border")

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. To separate a sidebar from a main feed, transition from `surface` to `surface-container-low`.

### The Glass & Gradient Rule
To prevent the UI from feeling "heavy," use Glassmorphism for floating elements (e.g., modals, hovering tooltips). Apply `surface-container-high` at 70% opacity with a `20px` backdrop-blur. For primary CTAs, use a signature linear gradient: `primary` (#6bd8cb) to `primary-container` (#29a195) at a 135-degree angle.

---

## 3. Typography: Editorial Precision
The typography system balances the high-fashion feel of Cabinet Grotesk with the technical clarity of JetBrains Mono.

| Level | Token | Font Family | Size | Character Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Space Grotesk | 3.5rem | -0.04em (Tight) |
| **Headline** | `headline-md`| Space Grotesk | 1.75rem | -0.02em |
| **Title** | `title-lg` | Manrope | 1.375rem | Normal |
| **Body** | `body-md` | Manrope | 0.875rem | Normal |
| **Data/XP** | `label-md` | JetBrains Mono | 0.75rem | +0.05em |
| **Status Pill**| `label-sm` | JetBrains Mono | 0.6875rem | +0.1em (Uppercase) |

**Editorial Note:** Always left-align headlines. Use JetBrains Mono exclusively for numerical data, XP gains, and timestamps to reinforce the "terminal" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
We do not use standard elevation shadows. We use **Tonal Layering** and **Neumorphism** to create a tactile, molded surface.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on `surface-container-low` backgrounds. This creates a natural "carved" or "recessed" look.
*   **Neumorphic Cards:** For interactive cards, use dual shadows to simulate a molded plastic surface:
    *   *Light Shadow:* `rgba(27, 37, 55, 0.5)` at -4px, -4px, 12px blur.
    *   *Dark Shadow:* `#080c14` at 4px, 4px, 12px blur.
*   **Ambient Shadows:** For floating menus, use a highly diffused shadow: `0 24px 48px rgba(0, 0, 0, 0.4)`. 
*   **The Ghost Border:** If a container requires extra definition (e.g., in a complex data view), use `outline-variant` at 15% opacity.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`). Background is the Teal-to-Dark-Teal gradient. Text is `on-primary-fixed` (JetBrains Mono, Bold).
*   **Tertiary:** No background. `primary` text color. On hover, apply a subtle `surface-container-high` background with 0.5s transition.

### Status Pills
*   **Design:** Ultra-tight height, `rounded-full`, `surface-container-highest` background.
*   **Typography:** Uppercase JetBrains Mono with 0.1em letter spacing. No icons.

### Cards & Lists
*   **Rule:** Never use horizontal dividers. 
*   **Execution:** Use `24px` vertical spacing to separate list items. For cards, use the Neumorphic dual-shadow treatment. Elements within cards should be left-aligned to maintain the terminal "flow."

### Terminal Input Fields
*   **Style:** Minimalist. No bottom border. A subtle `surface-container-lowest` background with a `2px` left-accent bar in `primary` when focused.
*   **Focus State:** The left-accent bar glows using a 4px `primary` shadow.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use asymmetric layouts. If the left side is heavy with text, leave the right side for a large, recessed data visualization.
*   **DO** use 24px horizontal padding as a hard rule for all containers.
*   **DO** treat "Empty States" as an opportunity for minimalist art—use subtle tonal gradients instead of illustrations.
*   **DO** lean into the "Warmth" by ensuring the Teal and Green accents have enough saturation to "pop" against the Abyss base.

### Don't
*   **DON’T** use emojis. The system is designed for professional, high-concentration study; emojis break the sophisticated terminal aesthetic.
*   **DON’T** use 100% opaque white (#FFFFFF). Use `on-surface` (#dce2f7) to maintain the nocturnal comfort.
*   **DON’T** center-align headers. Everything anchors to the left to mimic a code editor’s hierarchy.
*   **DON’T** use sharp corners. Follow the Roundedness Scale (`DEFAULT: 1rem`) to maintain the "Warmth" in the productivity terminal.