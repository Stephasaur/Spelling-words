# Spelling Quest 🎯

A gamified spelling practice app for a 2nd grader, built as a simple static website — no installs, no accounts, no build tools.

Kids practice this week's spelling words through **4 game modes**, unlocked one at a time:

1. **🧩 Build It** — drag (or tap) scrambled letter tiles into the right order.
2. **🔤 Pick the Letters** — for each letter spot, choose the correct letter from a few options.
3. **👂 Listen & Choose** — hear the word read aloud and pick the correctly spelled version among a few look-alikes.
4. **⌨️ Type It** — hear the word and type it out (real dictation practice).

Every correct answer earns stars (more stars for getting it right on the first try), with confetti, encouraging feedback, and a trophy screen once all 4 games are finished for the week. Progress and stars are saved in the browser (`localStorage`), so it picks up where the child left off.

## ✏️ Updating the word list each week

Open [`js/words.js`](js/words.js) and edit the list — that's it:

```js
const SPELLING_WORDS = [
  { word: "Graph", hint: "The teacher drew a graph to show our favorite fruits." },
  { word: "Chick", hint: "The baby chick followed its mother around the yard." },
  // ...add, remove, or change words here
];
```

- `word` is the spelling word.
- `hint` is a short sentence using the word one time. It's read aloud (with the word blanked out) to give context during a couple of the games, and it's what gets blanked-out on screen too.

The game automatically detects when the word list has changed and starts a fresh week (new stars, all levels re-locked except "Build It"). It works with any number of words.

## 🚀 Running it

This is a plain static site (HTML/CSS/JS, no dependencies, no build step):

- **Quickest:** just open `index.html` in a browser.
- **Local server** (recommended, so audio/fonts behave consistently):
  ```
  npx serve .
  # or
  python3 -m http.server 8080
  ```
- **GitHub Pages:** enable Pages for this repo (Settings → Pages → deploy from the `main` branch, root folder) and it will be live at `https://<your-username>.github.io/<repo-name>/`.

Word pronunciation uses the browser's built-in text-to-speech (Web Speech API), so it works offline with no API keys — just make sure the device's volume is on.

## 📁 Project structure

```
index.html        Page shell
css/style.css      All styling (bright, playful, mobile-friendly)
js/words.js         <-- the file you edit weekly
js/game.js          Game engine (levels, scoring, progress, speech)
```
