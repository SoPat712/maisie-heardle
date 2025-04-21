# Heardle – Maisie Peters Edition

**Josh Patra**

A daily “Heardle”‑style music‑guessing game built with SvelteKit, Tailwind CSS, and the SoundCloud Widget API. Each day, a 2‑second snippet of a Maisie Peters track is unlocked with skips and wrong guesses revealing longer segments until you either guess the song or run out of tries.

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

---

## Features

- 🎧 **Daily Track**: A new Maisie Peters song every day, chosen deterministically by date.
- ⏱ **Progressive Snippets**: Starts with a 2 s snippet, then 1 s, 2 s, 3 s, 4 s, and finally 5 s until the full track.
- ❌ **Skips & Wrong Guesses**: Skip to unlock the next snippet; wrong guesses also unlock more audio.
- ⏳ **Countdown**: Live countdown timer until the next daily track.
- 🌙 **Dark Mode**: Auto‑detects system preference and can be toggled manually.
- 💾 **No Data Collection**: No analytics or personal data stored.

---

## Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)**  
- **[Tailwind CSS](https://tailwindcss.com/)**  
- **[SoundCloud Widget API](https://developers.soundcloud.com/docs/api/html5-widget)**  
- **[Svelte Hero Icons](https://www.npmjs.com/package/svelte-hero-icons)**  
- **[Moment.js](https://momentjs.com/)**  

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+  
- [npm](https://www.npmjs.com/) v8+  

### Installation

```bash
git clone https://github.com/joshpatra/maisie-peters-heardle.git
cd maisie-peters-heardle
npm install
```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser. The game will load the SoundCloud widget and pre‑warm the daily snippet.

### Building for Production

```bash
npm run build
```

### Deploying to Netlify

1. Create a `netlify.toml` with:
   ```toml
   [build]
     command   = "npm run build"
     publish   = ".svelte-kit/output/client"
   ```
2. Push to a Git repository and connect to Netlify.  
3. Set the publish directory to `.svelte-kit/output/client`.

---

## Configuration

- **Artist & User**  
  In `src/lib/HeardleGame.svelte`:
  ```ts
  const ARTIST_NAME = 'Maisie Peters';
  const SC_USER     = 'maisie-peters';
  ```
- **Track List**  
  Edit `const TRACKS_DATA: TrackData[] = [...]` to add, remove, or comment out tracks.
  I'm putting together a way to make this easier, but it's still going to require a lot of manual labor to do.
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
├── netlify.toml                 # (Optional) Netlify configuration
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

---

## License

This project is licensed under the MIT License.  
