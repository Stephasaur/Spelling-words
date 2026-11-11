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
{ word: "bigger", hint: "My new puppy is much bigger than my old stuffed animal." },
{ word: "biggest", hint: "That was the biggest pumpkin we saw at the patch." },
{ word: "sadder", hint: "She felt even sadder after her favorite toy broke." },
{ word: "saddest", hint: "That was the saddest movie I have ever watched." },
{ word: "drummer", hint: "The drummer kept a steady beat for the whole song." },
{ word: "drumming", hint: "I could hear the loud drumming coming from the band room." },
{ word: "hugged", hint: "My mom hugged me tightly before I went to school." },
{ word: "flopped", hint: "The tired dog flopped down on the soft rug." },
{ word: "shredding", hint: "Dad was shredding old paper in the machine." },
{ word: "admitted", hint: "He admitted that he ate the last cookie." },
{ word: "swimmer", hint: "The fast swimmer won a gold medal at the pool." },
{ word: "maddest", hint: "He was the maddest when he lost his favorite video game." }
];

// Expose on window explicitly (top-level `const` doesn't become a global
// property on its own) so game.js can read it regardless of load order.
window.SPELLING_WORDS = SPELLING_WORDS;
