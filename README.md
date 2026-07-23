# Heardle – Maisie Peters Edition

[![Netlify Status](https://api.netlify.com/api/v1/badges/2bfdf524-cfe2-4026-ba4c-b65a90862033/deploy-status)](https://app.netlify.com/sites/maisie-peters-heardle/deploys)

A daily “Heardle”‑style music‑guessing game built with SvelteKit, Tailwind CSS, and the SoundCloud Widget API. Each day, a 2‑second snippet of a Maisie Peters track is unlocked with skips and wrong guesses revealing longer segments until you either guess the song or run out of tries.

Made to be modifiable, so you can play this game for any artists you like!

---

## Table of Contents

1. [Demo](#demo)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running Locally](#running-locally)
   - [Building for Production](#building-for-production)
   - [Deploying to Netlify](#deploying-to-netlify)
5. [Configuration](#configuration)
6. [Project Structure](#project-structure)
7. [Contributing](#contributing)
8. [License](#license)

---

## Demo

See it in action:

> https://maisie-peters-heardle.joshpatra.me

![image](https://github.com/user-attachments/assets/ec9bf8aa-ee41-42a7-9202-4e5e8719ffbc)

---

## Features

- 🎧 **Daily Track**: A new Maisie Peters song every day, chosen deterministically by date.
- ⏱ **Progressive Snippets**: Starts with a 2 s snippet, then 1 s, 2 s, 3 s, 4 s, and finally 5 s until the full track.
- ❌ **Skips & Wrong Guesses**: Skip to unlock the next snippet; wrong guesses also unlock more audio.
- ⏳ **Countdown**: Live countdown timer until the next daily track.
- 🌙 **Dark Mode**: Auto‑detects system preference and can be toggled manually.
- 💾 **Privacy First**: No analytics or personal data are stored. The app maintains only an
  anonymous, approximate aggregate of completed games.

---

## Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget)**
- **[Svelte Hero Icons](https://www.npmjs.com/package/svelte-hero-icons)**

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20.19+
- [npm](https://www.npmjs.com/) v10+

### Installation

```bash
git clone https://github.com/joshpatra/maisie-peters-heardle.git
cd maisie-peters-heardle
npm install
```

### Running Locally

```bash
npm run dev -- --open
```

Visit `http://localhost:5173` in your browser. The game will load the SoundCloud widget and pre‑warm the daily snippet.

### Building for Production

```bash
npm run build && npm run preview
```

### Deploying to Netlify

1. Connect your Netlify project to a Git repository and connect to Netlify.
2. Use the below build settings:
   ![image](https://github.com/user-attachments/assets/9c297433-69ee-471e-81b5-94f2ce973e4e)

---

## Configuration

- **Artist & User**  
  In `src/lib/tracks.ts`:
  ```ts
  const ARTIST_NAME = 'Maisie Peters';
  const SC_USER = 'maisie-peters';
  ```
- **Track List**  
  Edit `TRACKS_DATA` in `src/lib/tracks.ts` to add or remove tracks. Run the test suite after
  changing the catalog; the published-date assertions are intentional safeguards against
  accidentally changing a live answer.

  https://github.com/SoPat712/soundcloud-track-importer

  See this other project I put together to build a track list

- **Segment Increments**  
  Adjust `const SEGMENT_INCREMENTS = [2,1,2,3,4,5];` to change snippet lengths.

---

## Project Structure

```
.
├── src
│   ├── lib
│   │   └── HeardleGame.svelte   # Main game component
│   ├── routes
│   │   ├── +layout.svelte       # App layout & global head
│   │   └── +page.svelte         # Root page slot
│   └── app.css                  # Tailwind imports & custom styles
├── package.json
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m "Add awesome feature"`
4. Push: `git push origin feature/YourFeature`
5. Open a Pull Request

Before opening a pull request, run:

```bash
npm run check
npm run lint
npm test
npm run build
```

---

## License

This project is licensed under the GNU General Public License v3.0.
