---
name: The Sovereign Gallery
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#554241'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#887271'
  outline-variant: '#dbc0bf'
  surface-tint: '#9d4042'
  primary: '#3d0006'
  on-primary: '#ffffff'
  primary-container: '#5d1016'
  on-primary-container: '#e27675'
  inverse-primary: '#ffb3b1'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#191a19'
  on-tertiary: '#ffffff'
  tertiary-container: '#2e2f2e'
  on-tertiary-container: '#969695'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#7e292c'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e3e2e0'
  tertiary-fixed-dim: '#c7c6c5'
  on-tertiary-fixed: '#1a1c1b'
  on-tertiary-fixed-variant: '#464746'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-lg: 80px
  stack-md: 40px
  stack-sm: 16px
---

## Brand & Style
The design system is a digital expression of high-end curation, specifically tailored for the Saudi contemporary art market. It operates on the philosophy of "The Invisible Frame"—where the interface serves as a silent, luxurious conduit between the collector and the masterpiece. 

The aesthetic leans heavily into **Modern Minimalism** with a touch of **Museum-Grade Sophistication**. By prioritizing expansive whitespace and a rigid, editorial grid, the system evokes the feeling of walking through a physical gallery in Diriyah. The emotional response is one of reverence, exclusivity, and cultural pride.

**Design Principles:**
- **Art First:** No UI element should compete with the visual weight of the artwork.
- **Cultural Resonance:** Subtle use of traditional tones (Maroon and Gold) to anchor the experience in Saudi heritage.
- **Architectural Breathing Room:** Use generous margins to signal luxury and prevent visual clutter.

## Colors
The palette is a sophisticated trio that balances the depth of Saudi heritage with the lightness of a modern gallery.

- **Nabeeti (Deep Maroon):** Used sparingly for primary actions and brand accents. It represents depth, history, and the premium nature of original art.
- **Dahabi (Elegant Gold):** Reserved for high-value indicators, such as "Verified Original" badges, premium membership tiers, or subtle hover highlights.
- **Pristine White & Off-White:** The canvas of the application. The tertiary `#F9F8F6` is used for large section backgrounds to prevent eye strain, while pure white is used for card surfaces.
- **Ink Black:** Used for typography to ensure maximum legibility and a sharp, editorial contrast.

## Typography
This design system utilizes a high-contrast typographic pairing to bridge the gap between tradition and modern commerce.

- **Headlines:** *Libre Caslon Text* provides an authoritative, literary feel. Its high-contrast strokes mirror the elegance of fine calligraphy and classic exhibition catalogs. 
- **Body & UI:** *Plus Jakarta Sans* offers a clean, modern, and friendly counter-balance. Its open counters ensure readability at 16px and above, which is crucial for artist biographies and technical details.
- **Arabic Support:** For Arabic implementation, use *Amiri* for headlines to maintain the Caslon feel, and *IBM Plex Sans Arabic* for body text to match the clean geometry of Plus Jakarta Sans.
- **Rhythm:** Scale is used to create a clear hierarchy; oversized display type is used for hero sections to make a bold, editorial statement.

## Layout & Spacing
The layout follows a **RTL-first, 12-column fluid grid** for desktop, collapsing to a single column for mobile. 

- **The "Art Margin":** A generous 64px outer margin on desktop ensures the content never feels squeezed against the edge of the viewport.
- **Vertical Rhythm:** A "stack" system is used to group related content. Major gallery sections are separated by 80px (stack-lg) to allow the viewer's eyes to rest before moving to the next collection.
- **RTL Logic:** Navigation flow, breadcrumbs, and "Next/Previous" artwork controls are mirrored for the Arabic reading pattern, ensuring the primary focal point (the art) remains the priority on the right side of the visual field.

## Elevation & Depth
In keeping with the minimalist gallery aesthetic, this design system avoids heavy drop shadows and floating effects. 

- **Tonal Layers:** Depth is achieved through the subtle use of the tertiary off-white background against pure white cards. 
- **Low-Contrast Outlines:** Instead of shadows, use 1px borders in a very light grey or the secondary gold color (at 20% opacity) to define boundaries.
- **Hover States:** Depth is communicated through interaction rather than static visuals. On hover, artwork cards should subtly scale (1.02x) or transition from a 0.5px border to a 1px Maroon border to signal interactivity.

## Shapes
The design system employs **Sharp (0px)** roundedness across all primary containers and image frames. 

The use of 90-degree angles mimics the physical framing of artwork and the architectural lines of a modern gallery. This choice communicates precision, authority, and high-end luxury. Softness is reserved exclusively for icon buttons or circular artist avatars to provide a small point of visual relief within the rigid grid.

## Components
- **Artwork Cards:** The centerpiece of the UI. Feature a sharp-edged image container with no padding. Metadata (Title, Artist, Price) is placed underneath in a clean, left-aligned (RTL right-aligned) stack using `label-caps` for the artist's name.
- **Refined CTAs:** Primary buttons use a solid Maroon background with White text, sharp corners, and a 2px Gold bottom-border that appears only on hover.
- **Navigation:** A minimal top bar with high-transparency glassmorphism (backdrop-blur) ensures it remains functional without obscuring the art as the user scrolls.
- **Verified Badges:** Small, elegant Dahabi (Gold) icons used next to artist names to denote authenticity.
- **Filter Chips:** Underlined text links rather than boxes, maintaining the "un-designed" editorial look of a high-end magazine.
- **Input Fields:** Bottom-border only (ghost style) to keep the registration and checkout forms feeling light and non-intrusive.