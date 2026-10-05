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
  { word: "Cell",    hint: "My mom keeps her cell phone in her purse." },
  { word: "Space",   hint: "The astronaut flew a rocket into outer space." },
  { word: "Range",   hint: "We could see a mountain range far away from the car window." },
  { word: "Gent",    hint: "The kind gent held the door open for us at the store." },
  { word: "Stretch", hint: "We stretch our arms and legs before we run in gym class." },
  { word: "Scratch", hint: "The kitten tried to scratch the side of the couch." },
  { word: "Splotch", hint: "I got a big splotch of blue paint on my shirt." },
  { word: "Judge",   hint: "The judge picked the best cake at the baking contest." },
  { word: "Bridge",  hint: "We walked across the bridge to get to the other side of the river." },
  { word: "Pledge",  hint: "Our class says the pledge every morning." },
  { word: "Giant",   hint: "The giant in the story was taller than the trees." },
  { word: "Kitchen", hint: "Dad cooked pancakes in the kitchen this morning." },
];

// Expose on window explicitly (top-level `const` doesn't become a global
// property on its own) so game.js can read it regardless of load order.
window.SPELLING_WORDS = SPELLING_WORDS;
