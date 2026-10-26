# GameFit — Product Implementation Plan

A restrained, editorial game discovery and hardware compatibility platform helping PC and mobile gamers discover games they love, verify whether their hardware meets real published requirements, and find playable alternatives that run smoothly on their devices.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core user decisions were confirmed in Phase 1 and guide the architecture and visual identity:

- **Confirmed Visual Direction**: Industrial Amber (`#D97706` / `#F59E0B`) and Slate (`#0F172A`, `#334155`) set against a warm, editorial canvas (`#FAF9F6` off-white). No neon gaming clichés or purple gradients.
- **Confirmed Hero Experience**: Dual-action search bar with instant hardware compatibility toggle, allowing gamers to either search by title/feel or instantly compare against their active hardware profile.
- **Confirmed Hardware Profiler**: Quick-start presets for popular hardware tiers (e.g., Integrated Intel Iris/UHD, GTX 1650 Budget Rig, RTX 3060 Modern Midrange, Snapdragon Midrange, iPhone A-series) paired with a searchable, granular component picker for CPU, GPU, RAM, OS, and storage.

---

## 1. Overview & Core Concept

### What It Does
GameFit resolves the friction of modern gaming discovery by answering three critical questions in a single, unified flow:
1. **"What should I play?"** Natural-language & faceted discovery across genres, themes, atmosphere, and mechanics.
2. **"Can my device run it?"** Deterministic, honest compatibility diagnostics that compare user specifications against verified publisher requirements without fabricating FPS estimates.
3. **"What can I play instead if it won't run?"** Compatibility-aware alternative recommendations ranked by game similarity and hardware headroom.

### Target Audience & Persona
- **PC Gamers with Entry-Level or Midrange Hardware**: Players on integrated graphics, older discrete GPUs (GTX 1060/1650), or laptops who need reliable compatibility assessments before buying or downloading.
- **Mobile Gamers**: Android and iOS users navigating fragmented chipset requirements and storage footprints.
- **Atmospheric Game Explorers**: Players who search for specific moods, pacing, or mechanics rather than just top seller charts.

### Key Value
Honesty and transparency. When requirements are unknown or ambiguous, GameFit labels them as **Uncertain** instead of guessing. When hardware falls short, it offers concrete, explainable alternatives.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Discovery & Hardware Profile Setup**:
   - The user lands on the homepage with an Apple-editorial typographic masthead and a dual-action search bar.
   - The user selects their quick hardware preset or enters specific components. The active hardware profile is preserved client-side in session state.
2. **Search & Browsing**:
   - Catalog view (`/games`) with instant search, platform toggles (PC, Android, iOS), genre pills, and an active "Fit My Hardware" filter that instantly highlights playable titles.
3. **Deep Game Detail (`/game/:slug`)**:
   - High-fidelity visual showcase, verified metadata, minimum vs recommended PC specifications, mobile constraints, last verification date, and an interactive compatibility comparison card.
4. **Compatibility Diagnostic (`/compatibility`)**:
   - Side-by-side component-by-component comparison (OS, CPU, GPU, RAM, Storage, Resolution).
   - Clear diagnostic verdict: *Meets Listed Minimum*, *Meets Recommended*, *Below Listed Requirements*, or *Uncertain Data*.
5. **Hardware-Aware Alternatives (`/alternatives/:slug`)**:
   - Interactive ranking combining Game Similarity Index (30% genre, 25% gameplay, 20% world/exploration, 15% atmosphere/story, 10% mechanics) and Hardware Headroom Index. Each alternative displays a clear reason badge (e.g., "Shares isometric exploration and tactical combat · 45% lower GPU requirement").
6. **Provenance & Trust**:
   - Dedicated `/about`, `/privacy`, `/terms`, and `/sources` pages detailing exact source origins, publisher verification dates, and test methods.

### Visual Identity & Theme
- **Aesthetic Direction**: Restrained editorial minimalism inspired by Apple hardware briefs and Leica technical documents. Confident typographic hierarchy, generous whitespace, hairline borders, and single-elevation cards.
- **Color Palette (60-30-10 discipline)**:
  - *Canvas (60%)*: Warm editorial paper white (`#FAF9F6`), structural containers (`#FFFFFF`), subtle hairline borders (`#E2E8F0` / `rgba(15,23,42,0.08)`).
  - *Content & Typography (30%)*: Deep slate charcoal (`#0F172A`), secondary muted body (`#475569`), technical metadata (`#64748B`).
  - *Accents (10%)*: Precision industrial amber (`#D97706` / `#B45309`) for primary calls-to-action and active filters; verified green (`#059669`) and cautionary amber (`#D97706`) for diagnostic statuses.
  - *Dark Sections*: Deliberately positioned dark contrast banners (`#090D16`) for hero showcases and technical diagnostic consoles.
- **Typography & Scale**:
  - *Display / Headlines*: `Outfit` / `Plus Jakarta Sans` with tight tracking (`tracking-tight`) and `text-wrap: balance`.
  - *Body Prose*: System Sans / `DM Sans` with generous line-height (`1.6`).
  - *Technical Numerals & Hardware Specs*: Monospace with tabular numerals (`tabular-nums font-mono`).
  - *Zero-Pill Discipline*: Informational metadata rendered as clean unboxed text separated by middle dots (`·`) or slashes (`/`).

```
┌────────────────────────────────────────────────────────────────────────┐
│  GAMEFIT             Discover   Catalog   Compatibility   Sources  [Rig]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Find your next game.                                                │
│   Check whether it will run.                                           │
│   Discover alternatives that fit your hardware.                        │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │ [Search games, genres, or descriptions...]           [Filter]│    │
│   └──────────────────────────────────────────────────────────────┘    │
│   Hardware Profile: [Preset: Midrange PC (GTX 1650 / i5 / 16GB) ▼]     │
│                                                                        │
│   FEATURED TITLES            PLAYABLE ALTERNATIVES        GENRE FOCUS  │
│   ┌──────────────────────┐   ┌──────────────────────┐    ┌───────────┐ │
│   │ Elden Ring           │   │ Tunic                │    │ RPG       │ │
│   │ Action RPG · FromSoft│   │ Isometric · Low GPU  │    │ Action    │ │
│   │ Requires GTX 1060    │   │ 92% Similar · Fits   │    │ Indie     │ │
│   └──────────────────────┘   └──────────────────────┘    └───────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

- **Deterministic Rule-Based Matching vs. Hallucinated AI**:
  - *Chosen Approach*: Fully structured, deterministic specification database and similarity ranking engine running locally in TypeScript.
  - *Why*: User trust is paramount. GameFit must never hallucinate system requirements, fake benchmark FPS, or invent games.
  - *Alternative Considered*: Direct LLM prompt generation for specs was rejected because LLMs hallucinate hardware requirements and benchmarks.
- **Client-Side Hardware Profiler with Persistence**:
  - *Chosen Approach*: User hardware configuration stored in React state with `localStorage` persistence, allowing instant one-click compatibility checking across all game detail pages.
  - *Why*: Gamers should not have to re-enter their CPU, GPU, and RAM every time they view a different game.
- **Transparent Uncertainty Handling**:
  - *Chosen Approach*: Explicit "Uncertain" result category whenever publisher requirements omit specific details (e.g. unstated GPU architecture or mobile chipset constraints) with clear explanation notes.
  - *Why*: Fulfills the PRD requirement to never present incomplete data as confirmed compatibility.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                             GameFit App                                │
│                     (Client Router & Hardware Context)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐    ┌─────────────────────┐   ┌─────────────────────┐
│  Navigation &    │    │   Hardware State    │   │ Curated Game Data   │
│  Top Bar (3-Zone)│    │   (Preset & Granular│   │ (Verified PC/Mobile │
│  - Wordmark      │    │    CPU, GPU, RAM,   │   │  Specs, Tags, Proven│
│  - Clean Links   │    │    OS, Storage)     │   │  ance, Media)       │
│  - Active Rig CTA│    └──────────┬──────────┘   └──────────┬──────────┘
└──────────────────┘               │                         │
                                   ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Core Engines & Services                         │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ Compatibility Engine    │  │ Similarity & Alternatives Engine     │ │
│  │ - Tier normalization    │  │ - Multi-vector tag similarity        │ │
│  │ - Pass/Fail/Uncertain   │  │ - Hardware headroom calculation      │ │
│  │ - Bottleneck analysis   │  │ - Explainable recommendation reasons │ │
│  └─────────────────────────┘  └──────────────────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐    ┌─────────────────────┐   ┌─────────────────────┐
│  Views & Routes  │    │  Game Detail View   │   │ Transparency Views  │
│  - Home (Hero)   │    │  - Verified Specs   │   │ - About             │
│  - Catalog Grid  │    │  - Hardware Match   │   │ - Sources & Dates   │
│  - Discovery     │    │  - Alternatives     │   │ - Privacy & Terms   │
│  - Compatibility │    │  - Provenance Notes │   │                     │
└──────────────────┘    └─────────────────────┘   └─────────────────────┘
```

### Data Model & Entities
1. **`Game`**:
   - `id`, `slug`, `title`, `tagline`, `description`, `coverImage`, `heroImage`
   - `developer`, `publisher`, `releaseDate`
   - `platforms`: `Array<'pc' | 'android' | 'ios'>`
   - `genres`: `string[]`
   - `gameplayTags`: `string[]` (e.g. `['souls-like', 'open-world', 'parry', 'exploration']`)
   - `atmosphereTags`: `string[]` (e.g. `['dark-fantasy', 'cinematic', 'challenging']`)
   - `pcRequirements`: `{ minimum: SystemRequirements; recommended: SystemRequirements }`
   - `mobileRequirements`: `{ android?: MobileRequirements; ios?: MobileRequirements }`
   - `provenance`: `{ sourceName: string; sourceUrl: string; lastVerified: string; confidence: 'verified' | 'publisher-direct' | 'community-tested' }`
2. **`SystemRequirements`**:
   - `os`: `string`, `osFamily`: `'windows' | 'macos' | 'linux'`
   - `cpu`: `string`, `cpuTier`: `number` (1-10 benchmark index)
   - `gpu`: `string`, `gpuTier`: `number` (1-10 performance index)
   - `vramGb`: `number`
   - `ramGb`: `number`
   - `storageGb`: `number`
   - `notes`: `string`
3. **`HardwareProfile`**:
   - `platform`: `'pc' | 'android' | 'ios'`
   - `presetId`: `string`
   - `cpu`: `string`, `cpuTier`: `number`
   - `gpu`: `string`, `gpuTier`: `number`
   - `ramGb`: `number`
   - `os`: `string`
   - `storageFreeGb`: `number`
   - `targetResolution`: `'720p' | '1080p' | '1440p' | '4k'`

### Curated Dataset
We will seed the initial catalog with a diverse, realistic set of 14+ widely known games spanning demanding AAA (e.g. *Cyberpunk 2077*, *Elden Ring*, *Starfield*), balanced mid-spec favorites (e.g. *The Witcher 3*, *Genshin Impact*, *Hades*, *Hollow Knight*, *Celeste*, *Dead Cells*), lightweight indie masterpieces (e.g. *Stardew Valley*, *Terraria*, *Vampire Survivors*), and mobile titles (e.g. *Dead Cells Mobile*, *Call of Duty: Warzone Mobile*, *Genshin Impact Mobile*).

---

## 5. Implementation Steps

1. **Brand & Metadata Synchronization**:
   - Update `metadata.json`, `<title>`, and open-graph tags in `index.html` to reflect **GameFit**.
2. **Data & Calculation Architecture**:
   - Create data schemas, hardware databases, benchmark tiers, and curated game datasets in `/src/data/`.
   - Implement the deterministic PC & mobile compatibility evaluation algorithms in `/src/services/compatibility.ts`.
   - Implement the similarity and alternative ranking engine in `/src/services/recommendations.ts`.
3. **State Management & Hardware Context**:
   - Create `HardwareContext` with localStorage persistence and quick preset switching.
4. **Core UI System & Layout**:
   - Top Bar conforming to the 3-zone contract (`[GameFit] - [Catalog, Discover, Compatibility, Sources] - [My Rig Profile]`).
   - Editorial card components, comparison rows, diagnostic banners, and unboxed metadata text.
5. **Interactive Views & Routing**:
   - **Homepage**: Hero search with hardware toggle, curated games, alternatives teaser, how it works, and footer.
   - **Catalog (`/games`)**: Multi-faceted filter system with real-time text matching, platform filtering, genre filters, and hardware suitability toggle.
   - **Game Detail (`/game/:slug`)**: High-fidelity overview, verified requirement cards, dynamic rig diagnostic, and similar games.
   - **Compatibility Checker (`/compatibility`)**: Granular component selector, comparison matrix, bottleneck explanation, and alternatives.
   - **Discovery (`/discover`)**: Natural-language query translator matching tags, mechanics, and hardware constraints.
   - **Alternatives View (`/alternatives/:slug`)**: Side-by-side comparison of original vs recommended titles with headroom metrics.
   - **Legal & Sources (`/about`, `/privacy`, `/terms`, `/sources`)**: Honest provenance, licensing disclosures, and draft privacy practices.
6. **Verification & Testing**:
   - Execute `compile_applet` and `lint_applet` to ensure zero compilation or type errors. Verify responsive behavior across desktop and mobile viewports.
