# Location Tracker — Design Guidelines

## Color Palette
- **Primary background:** Deep space navy `#0B0F1A`
- **Secondary surface:** Dark indigo `#131929`
- **Accent / CTA:** Electric cyan `#00E5FF`
- **Accent secondary:** Soft violet `#7B61FF`
- **Text primary:** White `#FFFFFF`
- **Text secondary:** Cool gray `#A0AEC0`
- **Pin / marker:** Vivid coral `#FF5C5C`
- **Success:** Emerald `#10B981`

## Typography
- **Display / Hero:** Inter or Space Grotesk — bold, wide-tracked. Used for globe labels and page titles.
- **Body:** Inter Regular 16px, line-height 1.6.
- **Monospace (coordinates):** JetBrains Mono — used to display raw GPS coordinates for a techy-premium feel.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48px

## Elevation & Depth
- Globe sits on a fully dark background with a subtle radial starfield or gradient — conveys outer-space depth.
- Cards / modals use `backdrop-filter: blur(12px)` with a semi-transparent dark surface (`rgba(19,25,41,0.85)`).
- Pin popover floats above the globe with a soft drop shadow and a cyan border accent.
- No sharp corners on UI cards — `border-radius: 16px` standard; `8px` for smaller chips.

## Components
- **Globe canvas:** Full-viewport, no margins. Globe is centered, auto-rotates when idle.
- **Pin marker:** Glowing coral dot with a subtle pulse animation on the globe surface.
- **Pin detail card:** Slides up from bottom on mobile, appears as a floating popover on desktop. Contains title, description, GPS coordinates (mono), and share button.
- **Share button:** Prominent cyan CTA `#00E5FF`. Opens native share sheet (Web Share API) with fallback buttons for WhatsApp, Instagram, X, Email, SMS.
- **Search / locate bar:** Minimal floating pill at the top — frosted glass, no border, placeholder "Search or drop a pin…"
- **Toolbar:** Minimal — zoom in / zoom out / reset view. Icon-only, bottom-right corner.

## Motion & Animation
- Globe: smooth inertia rotation on drag; auto-rotate at 0.3°/s when idle; ease-in/out on programmatic spin-to-location.
- Pin drop: spring-physics bounce animation on placement.
- Card entrance: slide-up with `cubic-bezier(0.22, 1, 0.36, 1)` ease — 300ms.
- Share sheet: scale-up from center — 200ms.

## Layout
- **Mobile-first:** Full-screen globe with floating UI elements layered on top. No persistent sidebars.
- **Desktop:** Globe fills ~70% of viewport; optional right sidebar for pin list (hidden at MVP if not needed).
- Floating elements use `position: fixed` with a z-index stack: globe (0) → markers (10) → cards (20) → modals (30) → toasts (40).

## Accessibility
- Minimum contrast 4.5:1 for all text on dark backgrounds.
- Focus rings in cyan on all interactive elements.
- All share actions reachable via keyboard.