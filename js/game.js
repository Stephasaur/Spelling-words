/* ============================================================
   Spelling Quest — game engine
   Reads word list from SPELLING_WORDS (js/words.js).
   Vanilla JS, no build step, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Config ---------------- */
  const LEVELS = [
    { id: "build", name: "Build It", icon: "🧩", desc: "Drag or tap letters into place" },
    { id: "pick", name: "Pick the Letters", icon: "🔤", desc: "Choose the right letter for each spot" },
    { id: "choose", name: "Listen & Choose", icon: "👂", desc: "Hear the word, pick the correct spelling" },
    { id: "type", name: "Type It", icon: "⌨️", desc: "Type the word you hear" },
  ];
  const STORAGE_KEY = "spelling-quest-state-v1";
  const MAX_TYPE_TRIES = 3;

  /* ---------------- Small helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function randInt(n) { return Math.floor(Math.random() * n); }
  function pickRandom(arr) { return arr[randInt(arr.length)]; }

  function speak(text, rate) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate || 0.85;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  /* ---------------- Word list handling ---------------- */
  const WORDS = (window.SPELLING_WORDS || []).map((w) => ({
    word: w.word.trim(),
    hint: w.hint || "",
  }));

  function signatureOf(words) {
    return words.map((w) => w.word.toLowerCase()).join("|");
  }
  const CURRENT_SIGNATURE = signatureOf(WORDS);

  /* ---------------- State ---------------- */
  function freshState() {
    const levelProgress = {};
    LEVELS.forEach((lv, i) => {
      levelProgress[lv.id] = { unlocked: i === 0, completedOnce: false, bestStars: 0 };
    });
    return { signature: CURRENT_SIGNATURE, totalStars: 0, levelProgress, seenTrophy: false };
  }

  function loadState() {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
    if (!raw || raw.signature !== CURRENT_SIGNATURE) {
      const isNewWeek = !!raw && raw.signature !== CURRENT_SIGNATURE;
      const fresh = freshState();
      if (isNewWeek) fresh.__announceNewWeek = true;
      return fresh;
    }
    // backfill any levels missing from an older save
    LEVELS.forEach((lv, i) => {
      if (!raw.levelProgress[lv.id]) {
        raw.levelProgress[lv.id] = { unlocked: i === 0, completedOnce: false, bestStars: 0 };
      }
    });
    return raw;
  }

  let state = loadState();
  function saveState() {
    const toSave = Object.assign({}, state);
    delete toSave.__announceNewWeek;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  /* ---------------- Misspelling / distractor generation ---------------- */
  const CONFUSABLE = {
    b: "d", d: "b", p: "q", q: "p", m: "n", n: "m", v: "w", w: "v",
    a: "e", e: "a", i: "e", o: "u", u: "o",
  };
  const PATTERN_SWAPS = [
    [/ph/i, "f"], [/ck/i, "k"], [/ng$/i, "n"], [/gh/i, ""], [/th/i, "f"],
  ];

  function letterDistractors(correctLetter, count) {
    const lower = correctLetter.toLowerCase();
    const isUpper = correctLetter === correctLetter.toUpperCase() && /[a-z]/i.test(correctLetter);
    const pool = new Set();
    if (CONFUSABLE[lower]) pool.add(CONFUSABLE[lower]);
    while (pool.size < count) {
      const c = String.fromCharCode(97 + randInt(26));
      if (c !== lower) pool.add(c);
    }
    return shuffle(Array.from(pool)).slice(0, count).map((c) => (isUpper ? c.toUpperCase() : c));
  }

  function makeMisspellings(word, count) {
    const results = new Set();
    const lower = word.toLowerCase();
    const attempts = [];

    // pattern-based phonetic confusions
    PATTERN_SWAPS.forEach(([re, replacement]) => {
      if (re.test(word)) attempts.push(word.replace(re, replacement));
    });
    // swap two adjacent letters
    if (word.length > 2) {
      const i = 1 + randInt(word.length - 2);
      const chars = word.split("");
      [chars[i - 1], chars[i]] = [chars[i], chars[i - 1]];
      attempts.push(chars.join(""));
    }
    // double a random letter
    {
      const i = randInt(word.length);
      attempts.push(word.slice(0, i + 1) + word[i] + word.slice(i + 1));
    }
    // drop a random letter (not the first)
    if (word.length > 3) {
      const i = 1 + randInt(word.length - 1);
      attempts.push(word.slice(0, i) + word.slice(i + 1));
    }
    // replace a random letter with a confusable one
    {
      const i = randInt(word.length);
      const repl = letterDistractors(word[i], 1)[0];
      attempts.push(word.slice(0, i) + repl + word.slice(i + 1));
    }

    shuffle(attempts).forEach((candidate) => {
      const c = candidate.trim();
      if (c && c.toLowerCase() !== lower && !results.has(c.toLowerCase())) {
        results.add(c.toLowerCase());
      }
    });

    const out = Array.from(results).slice(0, count);
    // guarantee we have enough by mutating letters if needed
    let guard = 0;
    while (out.length < count && guard < 20) {
      guard++;
      const chars = word.split("");
      const i = randInt(chars.length);
      chars[i] = letterDistractors(chars[i], 1)[0];
      const candidate = chars.join("").toLowerCase();
      if (candidate !== lower && !out.includes(candidate)) out.push(candidate);
    }
    // re-apply original casing style (capitalize like the source word)
    return out.map((w) => matchCase(w, word));
  }

  function matchCase(str, sample) {
    if (sample[0] === sample[0].toUpperCase()) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
  }

  /* ---------------- Sentence blanking ---------------- */
  function blankSentence(sentence, word) {
    if (!sentence) return "";
    const re = new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    return sentence.replace(re, '<span class="blank">&nbsp;</span>');
  }

  /* ---------------- DOM refs ---------------- */
  const topbar = $("#topbar");
  const levelBadge = $("#level-badge");
  const starsCountEl = $("#stars-count");
  const btnHome = $("#btn-home");
  const screens = {
    home: $("#screen-home"),
    game: $("#screen-game"),
    complete: $("#screen-level-complete"),
    trophy: $("#screen-trophy"),
  };

  btnHome.addEventListener("click", () => showHome());

  function showScreen(name) {
    Object.keys(screens).forEach((k) => (screens[k].hidden = k !== name));
    topbar.hidden = name === "trophy";
    window.scrollTo(0, 0);
  }

  function updateStarsDisplay() {
    starsCountEl.textContent = state.totalStars;
  }

  function toast(msg) {
    const t = el("div", "toast", msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------------- Confetti ---------------- */
  const CONFETTI_COLORS = ["#ff6fa5", "#ffc93c", "#35c46e", "#3fb6ff", "#6c5ce7"];
  function burstConfetti(count) {
    const layer = $("#confetti-layer");
    for (let i = 0; i < (count || 60); i++) {
      const piece = el("div", "confetti-piece");
      const size = 6 + randInt(6);
      piece.style.width = size + "px";
      piece.style.height = size * 1.6 + "px";
      piece.style.left = randInt(100) + "vw";
      piece.style.background = pickRandom(CONFETTI_COLORS);
      const duration = 1.8 + Math.random() * 1.4;
      piece.style.animationDuration = duration + "s";
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), (duration + 0.5) * 1000);
    }
  }

  function floatPoints(sourceEl, text) {
    const rect = sourceEl ? sourceEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    const f = el("div", "float-points", text);
    f.style.left = rect.left + rect.width / 2 - 20 + "px";
    f.style.top = rect.top - 10 + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  /* ================================================================
     HOME SCREEN
     ================================================================ */
  function renderHome() {
    showScreen("home");
    const root = screens.home;
    root.innerHTML = "";

    const hero = el("div", "home-hero");
    hero.innerHTML = `
      <div style="font-size:52px;">🎯</div>
      <div class="display">Spelling Quest</div>
      <p>Practice this week's words through 4 fun games!</p>
      <div class="home-stars">⭐ ${state.totalStars} stars earned</div>
    `;
    root.appendChild(hero);

    const chips = el("div", "word-chip-row");
    WORDS.forEach((w) => {
      chips.appendChild(el("span", "word-chip", w.word));
    });
    root.appendChild(chips);

    const grid = el("div", "level-grid");
    LEVELS.forEach((lv, idx) => {
      const prog = state.levelProgress[lv.id];
      const card = el("button", "level-card" + (prog.unlocked ? "" : " locked"));
      const stars = "⭐".repeat(prog.bestStars) + "☆".repeat(Math.max(0, 3 - prog.bestStars));
      card.innerHTML = `
        ${!prog.unlocked ? '<span class="lock-tag">🔒</span>' : ""}
        <span class="lvl-icon">${lv.icon}</span>
        <span class="lvl-name">${lv.name}</span>
        <span class="lvl-desc">${lv.desc}</span>
        <span class="lvl-stars">${prog.completedOnce ? stars : "&nbsp;"}</span>
      `;
      card.addEventListener("click", () => {
        if (prog.unlocked) {
          startLevel(lv.id);
        } else {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          toast("Finish the level before this one first! 🔒");
        }
      });
      grid.appendChild(card);
    });
    root.appendChild(grid);

    const allDone = LEVELS.every((lv) => state.levelProgress[lv.id].completedOnce);
    if (allDone) {
      const trophyBtn = el("button", "btn btn-secondary", "🏆 See Your Trophy");
      trophyBtn.style.display = "block";
      trophyBtn.style.margin = "20px auto 0";
      trophyBtn.addEventListener("click", showTrophy);
      root.appendChild(trophyBtn);
    }

    const resetBtn = el("button", "reset-link", "Reset this week's progress");
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all stars and progress for this week's words?")) {
        state = freshState();
        saveState();
        renderHome();
      }
    });
    root.appendChild(resetBtn);
  }

  function showHome() {
    speak(""); // no-op but ensures any pending utterance context is cleared politely
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    renderHome();
  }

  /* ================================================================
     LEVEL RUN — shared session state
     ================================================================ */
  let session = null; // { levelId, order:[wordIdx...], pos, starsThisLevel }

  function startLevel(levelId) {
    session = {
      levelId,
      order: shuffle(WORDS.map((_, i) => i)),
      pos: 0,
      starsThisLevel: 0,
    };
    levelBadge.textContent = LEVELS.find((l) => l.id === levelId).icon + " " + LEVELS.find((l) => l.id === levelId).name;
    showScreen("game");
    topbar.hidden = false;
    runCurrentWord();
  }

  function runCurrentWord() {
    if (!session) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const wordIdx = session.order[session.pos];
    const wordObj = WORDS[wordIdx];
    const root = screens.game;
    root.innerHTML = "";
    const dots = el("div", "progress-row");
    dots.id = "progress-dots-holder";
    root.appendChild(dots);
    renderProgressDots();

    const card = el("div", "game-card bounce-in");
    root.appendChild(card);

    switch (session.levelId) {
      case "build": renderBuild(card, wordObj); break;
      case "pick": renderPick(card, wordObj); break;
      case "choose": renderChoose(card, wordObj); break;
      case "type": renderType(card, wordObj); break;
    }
  }

  function renderProgressDots() {
    const holder = $("#progress-dots-holder") || (() => {
      const d = el("div", "progress-row");
      d.id = "progress-dots-holder";
      screens.game.prepend(d);
      return d;
    })();
    holder.innerHTML = "";
    session.order.forEach((_, i) => {
      const cls = i < session.pos ? "done" : i === session.pos ? "current" : "";
      holder.appendChild(el("div", "progress-dot " + cls));
    });
  }

  function awardStars(n, anchorEl) {
    session.starsThisLevel += n;
    state.totalStars += n;
    updateStarsDisplay();
    saveState();
    if (anchorEl) floatPoints(anchorEl, "+" + n + " ⭐");
  }

  function goToNextWord() {
    session.pos++;
    if (session.pos >= session.order.length) {
      finishLevel();
    } else {
      runCurrentWord();
    }
  }

  function finishLevel() {
    const prog = state.levelProgress[session.levelId];
    const maxPossible = session.order.length * 3;
    const starRating = Math.max(1, Math.round((session.starsThisLevel / maxPossible) * 3));
    prog.completedOnce = true;
    prog.bestStars = Math.max(prog.bestStars, starRating);

    const idx = LEVELS.findIndex((l) => l.id === session.levelId);
    if (idx >= 0 && idx + 1 < LEVELS.length) {
      state.levelProgress[LEVELS[idx + 1].id].unlocked = true;
    }
    saveState();

    const allDone = LEVELS.every((lv) => state.levelProgress[lv.id].completedOnce);
    if (allDone && !state.seenTrophy) {
      state.seenTrophy = true;
      saveState();
      showTrophy();
      return;
    }

    showScreen("complete");
    const root = screens.complete;
    root.innerHTML = "";
    const card = el("div", "card complete-card pop");
    const nextLevel = idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null;
    card.innerHTML = `
      <span class="big-emoji">🎉</span>
      <h2>Level Complete!</h2>
      <div class="stars-earned">${"⭐".repeat(starRating)}${"☆".repeat(3 - starRating)}</div>
      <p style="color:var(--ink-soft);font-weight:700;">You earned ${session.starsThisLevel} stars in ${LEVELS.find((l) => l.id === session.levelId).name}!</p>
    `;
    const actions = el("div", "action-row");
    if (nextLevel) {
      const nextBtn = el("button", "btn btn-primary", "Next: " + nextLevel.name + " " + nextLevel.icon);
      nextBtn.addEventListener("click", () => startLevel(nextLevel.id));
      actions.appendChild(nextBtn);
    }
    const homeBtn = el("button", "btn btn-ghost", "Back to Home");
    homeBtn.addEventListener("click", showHome);
    actions.appendChild(homeBtn);
    card.appendChild(actions);
    root.appendChild(card);
    burstConfetti(50);
  }

  function showTrophy() {
    showScreen("trophy");
    const root = screens.trophy;
    root.innerHTML = "";
    const card = el("div", "card trophy-card pop");
    card.innerHTML = `
      <span class="big-emoji">🏆</span>
      <h2>Weekly Champion!</h2>
      <div class="stars-earned">⭐ ${state.totalStars} total stars ⭐</div>
      <p>You practiced every word in all 4 games. Amazing work!</p>
    `;
    const actions = el("div", "action-row");
    const homeBtn = el("button", "btn btn-primary", "Back to Home");
    homeBtn.addEventListener("click", showHome);
    actions.appendChild(homeBtn);
    card.appendChild(actions);
    root.appendChild(card);
    burstConfetti(90);
  }

  /* ================================================================
     LEVEL 1 — BUILD IT (drag & drop / tap to place)
     ================================================================ */
  function renderBuild(card, wordObj) {
    const word = wordObj.word;
    const letters = word.split("");
    let scrambled;
    do { scrambled = shuffle(letters); } while (scrambled.join("") === word && letters.length > 1);

    card.innerHTML = `
      <div class="context-sentence">${blankSentence(wordObj.hint, word) || "Listen to the word, then build it!"}</div>
      <div class="audio-row">
        <button class="audio-btn" id="hear-word">🔊 Hear the word</button>
        ${wordObj.hint ? '<button class="audio-btn secondary" id="hear-sentence">📖 Hear the sentence</button>' : ""}
      </div>
      <div class="slots-row" id="slots"></div>
      <div class="tray-row" id="tray"></div>
      <div class="feedback" id="feedback"></div>
      <div class="action-row">
        <button class="btn btn-primary" id="check-btn" disabled>Check ✓</button>
      </div>
    `;
    $("#hear-word", card).addEventListener("click", () => speak(word));
    if (wordObj.hint) $("#hear-sentence", card).addEventListener("click", () => speak(wordObj.hint));
    speak(word);

    const slotsRow = $("#slots", card);
    const trayRow = $("#tray", card);
    const feedback = $("#feedback", card);
    const checkBtn = $("#check-btn", card);

    const slotState = new Array(letters.length).fill(null); // holds tray index placed at each slot

    letters.forEach(() => slotsRow.appendChild(makeSlot()));
    scrambled.forEach((ch, i) => trayRow.appendChild(makeTrayTile(ch, i)));

    function makeSlot() {
      const s = el("div", "tile slot");
      s.addEventListener("dragover", (e) => { e.preventDefault(); s.classList.add("drag-over"); });
      s.addEventListener("dragleave", () => s.classList.remove("drag-over"));
      s.addEventListener("drop", (e) => {
        e.preventDefault();
        s.classList.remove("drag-over");
        const trayIdx = Number(e.dataTransfer.getData("text/plain"));
        placeInSlot(s, trayIdx);
      });
      s.addEventListener("click", () => {
        const slotIdx = Array.from(slotsRow.children).indexOf(s);
        if (slotState[slotIdx] !== null) removeFromSlot(slotIdx);
      });
      return s;
    }

    function makeTrayTile(ch, trayIdx) {
      const t = el("div", "tile tray-tile", ch);
      t.draggable = true;
      t.dataset.trayIdx = trayIdx;
      t.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(trayIdx));
        t.classList.add("dragging");
      });
      t.addEventListener("dragend", () => t.classList.remove("dragging"));
      t.addEventListener("click", () => {
        if (t.classList.contains("used")) return;
        const firstEmpty = slotState.findIndex((v) => v === null);
        if (firstEmpty !== -1) placeInSlot(slotsRow.children[firstEmpty], trayIdx);
      });
      return t;
    }

    function placeInSlot(slotEl, trayIdx) {
      const slotIdx = Array.from(slotsRow.children).indexOf(slotEl);
      if (slotIdx === -1 || slotState[slotIdx] !== null) return;
      const trayTile = trayRow.querySelector('[data-tray-idx="' + trayIdx + '"]');
      if (!trayTile || trayTile.classList.contains("used")) return;
      slotState[slotIdx] = trayIdx;
      slotEl.textContent = scrambled[trayIdx];
      slotEl.classList.add("filled");
      trayTile.classList.add("used");
      updateCheckBtn();
    }

    function removeFromSlot(slotIdx) {
      const trayIdx = slotState[slotIdx];
      slotState[slotIdx] = null;
      const slotEl = slotsRow.children[slotIdx];
      slotEl.textContent = "";
      slotEl.classList.remove("filled");
      const trayTile = trayRow.querySelector('[data-tray-idx="' + trayIdx + '"]');
      if (trayTile) trayTile.classList.remove("used");
      updateCheckBtn();
    }

    function updateCheckBtn() {
      checkBtn.disabled = slotState.some((v) => v === null);
    }

    let tries = 0;
    checkBtn.addEventListener("click", () => {
      tries++;
      const built = slotState.map((trayIdx) => scrambled[trayIdx]).join("");
      if (built.toLowerCase() === word.toLowerCase()) {
        const stars = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        feedback.textContent = "Great job! That's correct! 🎉";
        feedback.className = "feedback good";
        awardStars(stars, checkBtn);
        Array.from(slotsRow.children).forEach((s) => (s.style.background = "var(--green)"));
        checkBtn.disabled = true;
        speak("Correct! " + word);
        setTimeout(goToNextWord, 900);
      } else {
        feedback.textContent = "Not quite — try again!";
        feedback.className = "feedback bad";
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        // send letters back to tray for another attempt
        for (let i = slotState.length - 1; i >= 0; i--) {
          if (slotState[i] !== null) removeFromSlot(i);
        }
      }
    });
  }

  /* ================================================================
     LEVEL 2 — PICK THE LETTERS
     ================================================================ */
  function renderPick(card, wordObj) {
    const word = wordObj.word;
    const letters = word.split("");

    card.innerHTML = `
      <div class="context-sentence">${blankSentence(wordObj.hint, word) || "Listen, then pick each letter!"}</div>
      <div class="audio-row">
        <button class="audio-btn" id="hear-word">🔊 Hear the word</button>
        ${wordObj.hint ? '<button class="audio-btn secondary" id="hear-sentence">📖 Hear the sentence</button>' : ""}
      </div>
      <div class="pick-columns" id="cols"></div>
      <div class="feedback" id="feedback"></div>
      <div class="action-row">
        <button class="btn btn-primary" id="check-btn" disabled>Check ✓</button>
      </div>
    `;
    $("#hear-word", card).addEventListener("click", () => speak(word));
    if (wordObj.hint) $("#hear-sentence", card).addEventListener("click", () => speak(wordObj.hint));
    speak(word);

    const colsRoot = $("#cols", card);
    const feedback = $("#feedback", card);
    const checkBtn = $("#check-btn", card);
    const selection = new Array(letters.length).fill(null);

    letters.forEach((correct, i) => {
      const col = el("div", "pick-col");
      const options = shuffle([correct, ...letterDistractors(correct, 2)]);
      options.forEach((opt) => {
        const btn = el("button", "pick-letter-btn", opt);
        btn.addEventListener("click", () => {
          Array.from(col.children).forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          selection[i] = { btn, value: opt, correct: opt.toLowerCase() === correct.toLowerCase() };
          checkBtn.disabled = selection.some((s) => s === null);
        });
        col.appendChild(btn);
      });
      colsRoot.appendChild(col);
    });

    let tries = 0;
    checkBtn.addEventListener("click", () => {
      tries++;
      let allCorrect = true;
      selection.forEach((s) => {
        if (s.correct) {
          s.btn.classList.add("correct");
        } else {
          s.btn.classList.add("wrong");
          allCorrect = false;
        }
      });
      if (allCorrect) {
        const stars = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        feedback.textContent = "Perfect spelling! 🎉";
        feedback.className = "feedback good";
        awardStars(stars, checkBtn);
        checkBtn.disabled = true;
        speak("Correct! " + word);
        setTimeout(goToNextWord, 900);
      } else {
        feedback.textContent = "A couple letters need another try!";
        feedback.className = "feedback bad";
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        setTimeout(() => {
          selection.forEach((s, i) => {
            if (!s.correct) {
              s.btn.classList.remove("selected", "wrong");
              selection[i] = null;
            } else {
              s.btn.classList.remove("correct");
            }
          });
          checkBtn.disabled = true;
        }, 700);
      }
    });
  }

  /* ================================================================
     LEVEL 3 — LISTEN & CHOOSE (whole-word multiple choice)
     ================================================================ */
  function renderChoose(card, wordObj) {
    const word = wordObj.word;
    const wrong = makeMisspellings(word, 2);
    const options = shuffle([word, ...wrong]);

    card.innerHTML = `
      <div class="context-sentence">${blankSentence(wordObj.hint, word) || "Listen carefully, then choose!"}</div>
      <div class="audio-row">
        <button class="audio-btn" id="hear-word">🔊 Hear the word</button>
        ${wordObj.hint ? '<button class="audio-btn secondary" id="hear-sentence">📖 Hear the sentence</button>' : ""}
      </div>
      <div class="choice-list" id="choices"></div>
      <div class="feedback" id="feedback"></div>
    `;
    $("#hear-word", card).addEventListener("click", () => speak(word));
    if (wordObj.hint) $("#hear-sentence", card).addEventListener("click", () => speak(wordObj.hint));
    speak(word);

    const choicesRoot = $("#choices", card);
    const feedback = $("#feedback", card);
    let tries = 0;
    let done = false;

    options.forEach((opt) => {
      const btn = el("button", "choice-btn", opt);
      btn.addEventListener("click", () => {
        if (done) return;
        tries++;
        if (opt.toLowerCase() === word.toLowerCase()) {
          btn.classList.add("correct");
          done = true;
          const stars = tries === 1 ? 3 : tries === 2 ? 2 : 1;
          feedback.textContent = "Yes! That's it! 🎉";
          feedback.className = "feedback good";
          awardStars(stars, btn);
          Array.from(choicesRoot.children).forEach((b) => (b.disabled = true));
          speak("Correct! " + word);
          setTimeout(goToNextWord, 900);
        } else {
          btn.classList.add("wrong");
          btn.disabled = true;
          feedback.textContent = "Not that one — listen again!";
          feedback.className = "feedback bad";
          card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        }
      });
      choicesRoot.appendChild(btn);
    });
  }

  /* ================================================================
     LEVEL 4 — TYPE IT (dictation)
     ================================================================ */
  function renderType(card, wordObj) {
    const word = wordObj.word;

    card.innerHTML = `
      <div class="context-sentence">${blankSentence(wordObj.hint, word) || "Type the word you hear!"}</div>
      <div class="audio-row">
        <button class="audio-btn" id="hear-word">🔊 Hear the word</button>
        ${wordObj.hint ? '<button class="audio-btn secondary" id="hear-sentence">📖 Hear the sentence</button>' : ""}
      </div>
      <div class="type-input-row">
        <input type="text" class="type-input" id="type-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type here..." />
      </div>
      <div class="feedback" id="feedback"></div>
      <div class="action-row">
        <button class="btn btn-primary" id="check-btn">Check ✓</button>
      </div>
    `;
    $("#hear-word", card).addEventListener("click", () => speak(word));
    if (wordObj.hint) $("#hear-sentence", card).addEventListener("click", () => speak(wordObj.hint));
    speak(word);

    const input = $("#type-input", card);
    const feedback = $("#feedback", card);
    const checkBtn = $("#check-btn", card);
    let tries = 0;
    input.focus();

    function doCheck() {
      const val = input.value.trim();
      if (!val) return;
      tries++;
      if (val.toLowerCase() === word.toLowerCase()) {
        input.classList.add("correct");
        const stars = tries === 1 ? 3 : tries === 2 ? 2 : 1;
        feedback.textContent = "Awesome spelling! 🎉";
        feedback.className = "feedback good";
        awardStars(stars, checkBtn);
        input.disabled = true;
        checkBtn.disabled = true;
        speak("Correct! " + word);
        setTimeout(goToNextWord, 900);
      } else if (tries >= MAX_TYPE_TRIES) {
        input.classList.add("wrong");
        feedback.innerHTML = "The word is: <strong>" + word + "</strong>. You'll get it next time!";
        feedback.className = "feedback bad";
        awardStars(1, checkBtn);
        input.disabled = true;
        checkBtn.disabled = true;
        setTimeout(goToNextWord, 1700);
      } else {
        input.classList.add("wrong");
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        feedback.textContent = "Not quite — try again! (" + (MAX_TYPE_TRIES - tries) + " left)";
        feedback.className = "feedback bad";
        setTimeout(() => {
          input.classList.remove("wrong");
          input.select();
        }, 500);
      }
    }

    checkBtn.addEventListener("click", doCheck);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doCheck(); });
  }

  /* ================================================================
     BOOT
     ================================================================ */
  function boot() {
    if (WORDS.length === 0) {
      screens.home.innerHTML = '<div class="card" style="margin-top:40px;text-align:center;">Add some words to js/words.js to get started! 📝</div>';
      showScreen("home");
      return;
    }
    updateStarsDisplay();
    renderHome();
    if (state.__announceNewWeek) {
      toast("New words loaded for this week! 🎉");
      delete state.__announceNewWeek;
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
