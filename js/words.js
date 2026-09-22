/* =========================================================
   THIS WEEK'S SPELLING WORDS
   ---------------------------------------------------------
   ✏️  HOW TO UPDATE FOR A NEW WEEK:
   Just edit the list below — change, add, or remove entries.
   The game automatically adjusts to however many words you
   put here (works great with 5-15 words).

   Each entry needs:
     word  -> the spelling word (capitalize it however you like)
     hint  -> a short sentence that uses the word ONE time.
              It gets read aloud during a couple of the games
              with the word blanked out, so the sentence gives
              a clue without showing the spelling.

   When you save a new list, the game notices the words changed
   and automatically starts a fresh week for the player (new
   stars, all levels re-lockable) — no other steps needed!
   ========================================================= */

const SPELLING_WORDS = [
  { word: "Children", hint: "The children played tag on the playground at recess." },
  { word: "Animal",   hint: "My favorite animal at the zoo is the giraffe." },
  { word: "Salad",    hint: "Mom made a salad with lettuce and tomatoes for dinner." },
  { word: "Camel",    hint: "The camel walked slowly across the hot desert sand." },
  { word: "Lemon",    hint: "The lemon tasted so sour that I made a funny face." },
  { word: "Bottom",   hint: "I found my lost sock at the bottom of the basket." },
  { word: "Campus",   hint: "The college campus had big buildings and green lawns." },
  { word: "Silent",   hint: "The library was silent while everyone read their books." },
  { word: "Album",    hint: "Grandma showed us old pictures in her photo album." },
  { word: "Festival", hint: "We ate cotton candy and rode rides at the festival." },
  { word: "Women",    hint: "Two women waved to us from across the street." },
  { word: "Carrot",   hint: "The bunny munched on a crunchy orange carrot." },
];

// Expose on window explicitly (top-level `const` doesn't become a global
// property on its own) so game.js can read it regardless of load order.
window.SPELLING_WORDS = SPELLING_WORDS;
