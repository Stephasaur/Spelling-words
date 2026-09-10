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
  { word: "Graph",   hint: "The teacher drew a graph to show our favorite fruits." },
  { word: "Chick",   hint: "The baby chick followed its mother around the yard." },
  { word: "Phrase",  hint: "Can you use that word in a phrase?" },
  { word: "Wick",    hint: "The candle's wick burned brightly in the dark." },
  { word: "Thing",   hint: "What is that strange thing on the table?" },
  { word: "Song",    hint: "We sang our favorite song at the concert." },
  { word: "Thick",   hint: "The thick blanket kept me warm all night." },
  { word: "Bang",    hint: "We heard a loud bang from the kitchen." },
  { word: "Sung",    hint: "She has sung that song many times before." },
  { word: "Dolphin", hint: "The dolphin jumped high out of the ocean water." },
  { word: "Viking",  hint: "The Viking sailed across the icy sea in his ship." },
];

// Expose on window explicitly (top-level `const` doesn't become a global
// property on its own) so game.js can read it regardless of load order.
window.SPELLING_WORDS = SPELLING_WORDS;
