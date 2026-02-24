# Automated Unit Testing for a Browser-Based Unicode Text Formatter

## How I added 144 Jest tests to a standalone HTML app, fixed 9 bugs, and built a regression safety net — without touching the UI

---

## The Problem

The [Social Media Post Formatter](https://github.com/gsaravanan/post-formatter) is a single-page web application that converts plain text into stylized Unicode characters — bold, italic, fraktur, script, double-struck, and more — for use in LinkedIn posts, Twitter, and other social platforms.

The entire application was a single `html/index.html` file with inline JavaScript. No build system, no modules, no tests.

Over time, several bugs had crept in silently:

- The **Fraktur R** was rendering the same glyph as Fraktur S (a direct character duplication)
- The **Fraktur Z** was accidentally using the *lowercase* z fraktur character (𝔷) instead of the uppercase (ℨ)
- Three Fraktur letters (C, H, I) pointed to **unassigned Unicode codepoints** — rendering as empty boxes in some environments
- Eight Script uppercase letters were using **Mathematical Italic** characters instead of Mathematical Script characters
- The **italic serif** style was identical to **italic sans** — making the reverse lookup collide and format detection unreliable
- The **circular** style's uppercase letters from C onward used **Bold Fraktur** glyphs instead of the correct Double-Struck (𝕀𝕁𝕂…) glyphs
- The **clearFormat** function only stripped combining diacritics (underlines), never converting Unicode math characters back to ASCII — so bold text would remain bold after "clearing"
- The **toggle** logic failed for multi-word selections — "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱" could never be toggled off because the space character (always plain) confused the uniformity check
- The **Copy button** was invisible on mobile viewports

None of these were caught by any test, because there were no tests.

The goal: **add a comprehensive automated test suite and fix all the bugs**, with the tests acting as both a bug-discovery tool and a regression safety net going forward.

---

## The Core Challenge: Testing DOM-Less Browser JavaScript

The formatter logic was written as inline `<script>` tags inside `index.html`. To test it in Node.js (where Jest runs), two things were needed:

1. **Extract the logic** into a separate `.js` file
2. **Make it importable** by both the browser (`<script src="">`) and Node.js (`require()`)

### The Architecture Decision: UMD Pattern

The solution was the **Universal Module Definition (UMD)** pattern — a wrapper that detects the environment and exports accordingly:

```javascript
// js/formatter.js
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js (for Jest)
        module.exports = factory();
    } else {
        // Browser — attach to window
        const exports = factory();
        Object.assign(root, exports);
    }
}(typeof self !== 'undefined' ? self : this, function () {

    // --- All the pure logic goes here ---
    const maps = { ... };
    function toPlain(char) { ... }
    function detectFormats(char) { ... }
    function applyFormatToText(text, format) { ... }
    function clearFormatText(text) { ... }

    return {
        maps, reverseMaps, detectFormats, toPlain,
        formatSetToString, applyFormatToText, clearFormatText,
        buzzwordEmojiMap, shortcodeMap, autoEmojifyText, convertShortcodesText
    };
}));
```

**The key insight:** All of the interesting formatter logic is *pure functions* — they take text in and return text out. They don't touch the DOM. They don't need a browser. Extracting them to `js/formatter.js` required zero changes to the logic itself.

The HTML file was updated to `<script src="../js/formatter.js"></script>`, and the inline functions that previously duplicated this logic now call the shared module.

---

## The Test Stack

```
Runtime:      Node.js (via nvm)
Test runner:  Jest 29
Test file:    tests/formatter.test.js
Logic file:   js/formatter.js
```

**package.json:**

```json
{
  "name": "post-formatter",
  "version": "1.0.0",
  "description": "Social Media Unicode Text Formatter",
  "scripts": {
    "test": "jest --verbose",
    "test:coverage": "jest --verbose --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

**Running tests:**

```bash
nvm use node
npm install
npm test
```

**Result: 144 tests, 13 suites, all passing.**

---

## The 13 Test Suites — Strategy and Rationale

### Suite 1: Map Completeness

**What it tests:** Every formatting style must have entries for all 26 lowercase letters, all 26 uppercase letters, and (for relevant styles) all 10 digits.

**Why it matters:** A missing entry means that letter silently passes through unformatted — the user sees plain text mixed in with styled text, which looks broken.

```javascript
const STYLE_NAMES = [
    'boldSans', 'italicSans', 'boldItalicSans', 'boldSerif', 'boldItalicSerif',
    'italicSerif', 'fraktur', 'script', 'circular', 'square'
];

describe('Map Completeness', () => {
    for (const style of STYLE_NAMES) {
        test(`${style} has all 26 lowercase letters`, () => {
            for (const c of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
                expect(maps[style]).toHaveProperty(c);
                expect(maps[style][c]).toBeTruthy();
            }
        });
    }

    test('boldSans has digits 0-9', () => {
        for (let d = 0; d <= 9; d++) {
            expect(maps.boldSans).toHaveProperty(String(d));
        }
    });
});
```

**Pattern:** Use `for...of` loops to generate parameterized tests dynamically. Adding a new style to `STYLE_NAMES` automatically adds it to all applicable suites.

---

### Suite 2: No Intra-Map Duplicates

**What it tests:** Within a single style's character map, every output character must be unique — no two input letters should map to the same Unicode glyph.

**Why it matters:** A duplicate means two input characters are indistinguishable after formatting. The reverse lookup (used for detection and toggling) would silently fail for one of them.

This is exactly the bug that affected Fraktur R — it was mapped to 𝔖, which was *also* the mapping for S. Clicking "Fraktur" on text containing R would produce S-looking characters.

```javascript
describe('No Intra-Map Duplicates', () => {
    for (const style of STYLE_NAMES) {
        test(`${style}: all output characters are unique`, () => {
            const seen = new Set();
            const duplicates = [];
            for (const [key, val] of Object.entries(maps[style])) {
                if (seen.has(val)) duplicates.push({ key, val });
                seen.add(val);
            }
            expect(duplicates).toEqual([]);
        });
    }
});
```

**Pattern:** Build a `Set` of seen values; any repeated value is a duplicate. Report all duplicates at once rather than failing on first, to make debugging efficient.

---

### Suite 3: No Cross-Map Collisions

**What it tests:** The output characters of two different styles must not overlap. If `italicSans['a']` and `italicSerif['a']` produce the same Unicode character, the reverse map cannot distinguish which style was applied.

**Why it matters:** This was the root cause of the `italicSerif` bug. The italicSerif map was accidentally populated with the same characters as italicSans. When you applied italicSerif, the reverse map would detect it as italicSans, making the toggle logic wrong.

```javascript
const STYLE_PAIRS_TO_CHECK = [
    ['boldSans',    'italicSans'],
    ['italicSans',  'italicSerif'],   // CRITICAL: was identical before the fix
    ['italicSerif', 'script'],        // script uppercase had used italic chars
    ['fraktur',     'circular'],      // circular uppercase had used bold-fraktur chars
    // ... more pairs ...
];

for (const [styleA, styleB] of STYLE_PAIRS_TO_CHECK) {
    test(`${styleA} and ${styleB} share no alpha characters`, () => {
        const valsA = new Set(ALL_ALPHA.map(c => maps[styleA][c]).filter(Boolean));
        const collisions = ALL_ALPHA
            .map(c => maps[styleB][c])
            .filter(v => v && valsA.has(v));
        expect(collisions).toEqual([]);
    });
}
```

**Pattern:** The pairs are carefully chosen to cover all the historically-known collision risks. The comments in the test code explain *why* each pair is critical.

---

### Suite 4: Specific Bug Regression Checks

**What it tests:** 24 explicit character-level assertions, one per known historical bug. Each test names the bug, the wrong character, and the correct character.

**Why it matters:** These are the "never again" tests. Once a specific character is confirmed correct, this suite will catch any future regression immediately.

```javascript
describe('Specific Bug Regression Checks', () => {
    test('fraktur R is ℜ (U+211C), not S duplicate 𝔖', () => {
        expect(maps.fraktur['R']).toBe('ℜ');
        expect(maps.fraktur['R']).not.toBe(maps.fraktur['S']);
    });

    test('fraktur Z is ℨ (U+2128), not lowercase z fraktur 𝔷', () => {
        expect(maps.fraktur['Z']).toBe('ℨ');
        expect(maps.fraktur['Z']).not.toBe(maps.fraktur['z']);
    });

    test('script L is ℒ (U+2112), not lowercase script 𝓁', () => {
        expect(maps.script['L']).toBe('ℒ');
        expect(maps.script['L']).not.toBe(maps.script['l']);
    });

    test('italicSerif and italicSans use completely different characters', () => {
        for (const c of ALL_ALPHA) {
            expect(maps.italicSerif[c]).not.toBe(maps.italicSans[c]);
        }
    });

    test('circular C is ℂ (double-struck), not Bold Fraktur 𝕮', () => {
        expect(maps.circular['C']).toBe('ℂ');
        expect(maps.circular['C']).not.toBe('𝕮');
    });
});
```

**Pattern:** Use both `.toBe()` (the correct value) and `.not.toBe()` (the wrong value) in the same test. This makes the test self-documenting about what the bug *was* and what it was changed *to*.

---

### Suite 5: Reverse Map Round-Trip

**What it tests:** For every formatting style and every letter, `toPlain(maps[style][letter])` must equal the original letter. This validates the entire reverse lookup system.

**Why it matters:** The reverse map is what makes format detection and toggling work. A broken reverse map means the app cannot detect what formatting has been applied, making toggle fail silently.

```javascript
describe('Reverse Map Round-Trip', () => {
    for (const style of STYLE_NAMES) {
        test(`${style}: toPlain reverses all alpha characters`, () => {
            for (const c of ALL_ALPHA) {
                const formatted = maps[style][c];
                expect(formatted).toBeTruthy();
                expect(toPlain(formatted)).toBe(c);
            }
        });
    }

    test('plain ASCII characters pass through toPlain unchanged', () => {
        for (const c of ALL_ALPHA) {
            expect(toPlain(c)).toBe(c);
        }
    });
});
```

**Pattern:** The round-trip test is the ultimate integration test for the map + reverse-map system. If any character is wrong in the map (pointing to an unassigned codepoint, or stealing another letter's glyph), this test catches it because `toPlain` won't be able to look it up.

---

### Suite 6: Format Detection

**What it tests:** The `detectFormats()` function, which analyzes a single Unicode character and returns a `Set` of the formatting styles it belongs to.

**Why it matters:** Detection drives the toggle: before applying a format, the app checks whether all selected characters are already in that format. If detection is wrong, toggling is wrong.

```javascript
describe('Format Detection', () => {
    test('plain ASCII returns empty Set', () => {
        expect(detectFormats('a').size).toBe(0);
    });

    for (const [style, expectedKey] of singleFormatStyles) {
        test(`${style} char detected as {${expectedKey}}`, () => {
            const fmtA = detectFormats(maps[style]['a']);
            expect(fmtA.has(expectedKey)).toBe(true);
        });
    }

    test('boldItalicSans char detected as {boldSans, italicSans}', () => {
        const fmts = detectFormats(maps.boldItalicSans['a']);
        expect(fmts.has('boldSans')).toBe(true);
        expect(fmts.has('italicSans')).toBe(true);
    });
});
```

**Note on boldItalicSans:** This style is not stored as a separate map — it is the *composition* of `boldSans` and `italicSans`. Characters in this style are detected as belonging to *both* parent styles simultaneously. This reflects the underlying Unicode block structure (Mathematical Sans-Serif Bold Italic).

---

### Suite 7: Apply Format — Basic Application

**What it tests:** End-to-end formatting of short strings, verifying the exact Unicode output for each style.

**Why it matters:** This is the core user-facing behavior. If `applyFormatToText('hello', 'boldSans')` doesn't return `'𝗵𝗲𝗹𝗹𝗼'`, something fundamental is broken.

```javascript
test('boldSans applied to plain text produces bold sans chars', () => {
    expect(applyFormatToText('hello', 'boldSans')).toBe('𝗵𝗲𝗹𝗹𝗼');
});

test('fraktur applied to plain text', () => {
    // H (uppercase) → ℌ; e,l,o (lowercase) → 𝔢,𝔩,𝔬
    expect(applyFormatToText('Hello', 'fraktur')).toBe('ℌ𝔢𝔩𝔩𝔬');
});

test('spaces pass through any format unchanged', () => {
    expect(applyFormatToText('a b', 'boldSans')).toBe('𝗮 𝗯');
});

test('boldSans formats digits', () => {
    expect(applyFormatToText('123', 'boldSans')).toBe('𝟭𝟮𝟯');
});
```

**Unicode caveat in test source files:** The test file itself contains Unicode characters like `𝗵𝗲𝗹𝗹𝗼` (Mathematical Sans-Serif Bold). These look unusual in source code, but Jest handles them correctly as UTF-8 string literals. The source file must be saved as UTF-8.

---

### Suite 8: Toggle Behavior

**What it tests:** Applying the same format twice should return the original plain text.

**The space-skipping fix:** The original `allHaveSameState` check considered every character in the selection, including spaces. A space is always "plain" — it has no Unicode formatting. So "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱" would always be detected as "mixed" (some formatted, one space that is plain), preventing toggle from ever removing the format.

The fix: filter to only alphabetic characters when checking uniformity.

```javascript
test('toggle works for text with spaces (space-skipping fix)', () => {
    const bold = applyFormatToText('Hello World', 'boldSans');
    expect(bold).toBe('𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱');

    // Before the fix, this would apply bold again instead of removing it
    const toggled = applyFormatToText(bold, 'boldSans');
    expect(toggled).toBe('Hello World');
});
```

The suite also tests all 9 individual styles for toggle correctness, and mixed-case text:

```javascript
for (const style of toggleStyles) {
    test(`${style}: apply twice → returns plain text`, () => {
        const formatted = applyFormatToText('Hello', style);
        const toggled = applyFormatToText(formatted, style);
        expect(toggled).toBe('Hello');
    });
}
```

---

### Suite 9: Format Composition

**What it tests:** Layering two formats — applying bold and then italic should produce bold-italic characters, not just italic.

**Why it matters:** BoldItalicSans is produced by composing BoldSans + ItalicSans. The system must correctly detect that a bold character is being italicized and upgrade it to the combined style, rather than just replacing bold with italic.

```javascript
test('boldSans + italicSans = boldItalicSans', () => {
    const afterBold   = applyFormatToText('hi', 'boldSans');
    const afterItalic = applyFormatToText(afterBold, 'italicSans');
    expect(afterItalic).toBe('𝙝𝙞'); // Mathematical Sans-Serif Bold Italic
});

test('italicSans + boldSans = boldItalicSans (order independent)', () => {
    const afterItalic = applyFormatToText('hi', 'italicSans');
    const afterBold   = applyFormatToText(afterItalic, 'boldSans');
    expect(afterBold).toBe('𝙝𝙞');
});

test('removing boldSans from boldItalicSans leaves italicSans', () => {
    const boldItalic = applyFormatToText(applyFormatToText('hi', 'boldSans'), 'italicSans');
    const onlyItalic = applyFormatToText(boldItalic, 'boldSans'); // toggle off bold
    expect(onlyItalic).toBe(maps.italicSans['h'] + maps.italicSans['i']);
});
```

**Composition creation caveat:** The composed format `boldItalicSans` must be created via composition (`boldSans` then `italicSans`), not by calling `applyFormatToText('hi', 'boldItalicSans')` directly, because the system resolves `boldItalicSans` through the composition chain, not as a standalone format name.

---

### Suite 10: Clear Format

**What it tests:** The `clearFormatText()` function must convert any styled Unicode text back to plain ASCII.

**The original bug:** The old `clearFormat()` only did:
```javascript
text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
```

This only stripped combining diacritics (the underline overlay character U+0332). It had no effect on Unicode Mathematical characters. So `𝗮` (bold sans a) would remain `𝗮` after "clearing."

**The fix:** Iterate each character through `toPlain()` first, then strip diacritics:

```javascript
function clearFormatText(text) {
    let clean = '';
    for (const char of text) clean += toPlain(char);
    return clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
```

The tests validate both behaviors:

```javascript
for (const style of STYLE_NAMES) {
    test(`clears ${style} formatting`, () => {
        const formatted = applyFormatToText('Hello', style);
        expect(clearFormatText(formatted)).toBe('Hello');
    });
}

test('clears underline (combining low line \\u0332)', () => {
    const underlined = 'H\u0332e\u0332l\u0332l\u0332o\u0332';
    expect(clearFormatText(underlined)).toBe('Hello');
});

test('clears full sentence with multiple formats', () => {
    const bold   = applyFormatToText('Hello', 'boldSans');
    const italic = applyFormatToText('World', 'italicSerif');
    expect(clearFormatText(bold + ' ' + italic)).toBe('Hello World');
});
```

---

### Suite 11: Auto-Emojify

**What it tests:** The `autoEmojifyText()` function appends an appropriate emoji after known "buzzwords" (growth, launch, fire, etc.).

```javascript
test('adds emoji after known buzzword', () => {
    expect(autoEmojifyText('growth is key')).toContain('growth 📈');
});

test('case-insensitive matching', () => {
    expect(autoEmojifyText('GROWTH matters')).toContain('GROWTH 📈');
});

test('unknown words are not changed', () => {
    expect(autoEmojifyText('banana is tasty')).toBe('banana is tasty');
});

test('non-buzzword words between emojis are unchanged', () => {
    const result = autoEmojifyText('fire safety');
    expect(result).toContain('fire 🔥');
    expect(result).not.toContain('safety 🔥');
});
```

---

### Suite 12: Shortcode Conversion

**What it tests:** `:rocket:` → 🚀, `:fire:` → 🔥, etc. Unknown shortcodes pass through unchanged.

```javascript
test(':rocket: converts to 🚀', () => {
    expect(convertShortcodesText("Let's :rocket: this!")).toBe("Let's 🚀 this!");
});

test('unknown shortcodes are unchanged', () => {
    expect(convertShortcodesText(':unknown:')).toBe(':unknown:');
});

test('multiple shortcodes in one string', () => {
    const result = convertShortcodesText(':rocket: to the moon :fire:');
    expect(result).toBe('🚀 to the moon 🔥');
});
```

---

### Suite 13: Edge Cases

**What it tests:** Boundary conditions — empty strings, digit round-trips, the Planck constant (ℎ), style switching, and `formatSetToString` stability.

```javascript
test('empty string returns empty string for any format', () => {
    expect(applyFormatToText('', 'boldSans')).toBe('');
    expect(clearFormatText('')).toBe('');
    expect(autoEmojifyText('')).toBe('');
});

test('italic serif h round-trips correctly (ℎ is Planck constant)', () => {
    // U+1D455 (italic h) is unassigned in Unicode; the fallback is U+210E (ℎ)
    expect(maps.italicSerif['h']).toBe('ℎ');
    expect(toPlain('ℎ')).toBe('h');
});

test('applying format to already-formatted text in different style replaces it', () => {
    const frakturText = applyFormatToText('Hello', 'fraktur');
    const boldText    = applyFormatToText(frakturText, 'boldSans');
    for (const c of 'Hello') {
        expect(boldText).toContain(maps.boldSans[c]);
    }
});

test('formatSetToString produces stable sort', () => {
    const set1 = new Set(['italicSans', 'boldSans']);
    const set2 = new Set(['boldSans', 'italicSans']);
    expect(formatSetToString(set1)).toBe(formatSetToString(set2));
});
```

**The Planck constant note:** In Unicode Mathematical Italic block (U+1D400–U+1D44F), the slot for lowercase italic h (U+1D455) is *permanently unassigned* because ℎ (U+210E, the Planck constant symbol) already existed in the Letterlike Symbols block and was deemed equivalent. Every correct implementation must map italic h to U+210E, not leave it blank.

---

## The Unicode Testing Challenge

Testing Unicode formatters is harder than testing regular string functions because:

### 1. Invisible characters look identical in code
`𝕮` (Bold Fraktur C, U+1D56E) and `ℂ` (Double-Struck C, U+2102) look similar in many fonts. Only the codepoint — and therefore the test assertion — reveals which is which.

### 2. Unassigned codepoints are not errors at runtime
JavaScript doesn't throw an exception when you assign `maps.fraktur['C'] = '\u{1D506}'`. The string is valid. It just renders as a tofu box (□) in environments that don't have a glyph for that codepoint. The original code had three such unassigned codepoints in the Fraktur map.

The round-trip test catches these indirectly: `toPlain('\u{1D506}')` won't find anything in the reverse map, so it returns the character unchanged — and `toPlain(maps.fraktur['C']) !== 'C'` fails the assertion.

### 3. Case confusion
`𝔷` (Fraktur lowercase z, U+1D537) and `ℨ` (Fraktur uppercase Z, U+2128) are different characters. The original code mapped uppercase Z to the lowercase glyph. Tests using both `maps.fraktur['Z']` and `maps.fraktur['z']` explicitly check they are different.

### 4. Cross-block contamination
Different Unicode blocks cover similar-looking characters. The original circular/double-struck map accidentally used Mathematical Bold Fraktur (U+1D56C–U+1D59F) for uppercase C–Z instead of the correct Mathematical Double-Struck (U+1D538–U+1D56B, with special cases at ℂ, ℍ, ℕ, ℙ, ℚ, ℝ, ℤ).

The cross-map collision tests catch this by verifying that fraktur and circular share no alpha characters.

---

## Bugs Found and Fixed

| # | Bug | Discovered By |
|---|-----|---------------|
| 1 | Fraktur R duplicated S's glyph (𝔖) | Intra-map duplicate + regression tests |
| 2 | Fraktur Z used lowercase glyph (𝔷) | Regression test |
| 3 | Fraktur C, H, I used unassigned codepoints | Round-trip test |
| 4 | Script uppercase B/E/F/H/I/L/M/R used italic chars | Cross-map collision + regression tests |
| 5 | Script lowercase e/g/o used italic chars | Cross-map collision + regression tests |
| 6 | italicSerif was identical to italicSans | Cross-map collision test |
| 7 | Circular uppercase C–Z used Bold Fraktur | Cross-map collision + regression tests |
| 8 | clearFormat() only stripped diacritics, not Unicode math chars | clearFormat suite |
| 9 | Toggle failed for multi-word selections (space confusion) | Toggle behavior suite |

**Bonus bugs fixed (UI/CSS, not test-discoverable):**
- Copy button invisible on mobile (viewport overflow)
- Emoji modal close button using `float: right` (outdated layout)

---

## Final Test Run

```
Test Suites: 13 passed, 13 total
Tests:       144 passed, 144 total
Snapshots:   0 total
Time:        ~0.8s
```

All 144 tests pass. The suite runs in under a second because it is pure Node.js — no browser, no DOM, no network.

---

## Key Takeaways

### 1. Extract logic before you can test it
If your business logic lives inside a `<script>` tag in HTML, the first step to testability is extracting it to a separate `.js` file. Use the UMD pattern to stay compatible with both browser and Node.js.

### 2. Data integrity tests are undervalued
The Map Completeness, Intra-Map Duplicates, and Cross-Map Collision suites are not testing behavior — they are testing *data*. They are cheap to write and caught the majority of bugs in this codebase.

### 3. Round-trip tests catch invisible errors
`toPlain(maps[style][c]) === c` is a one-liner that validates the entire map + reverse-map system for 520 combinations (10 styles × 52 letters). It caught three unassigned Unicode codepoints and one case confusion bug.

### 4. Regression tests should name the bug
The Specific Bug Regression suite uses test names like `"fraktur R is ℜ (U+211C), not S duplicate 𝔖"`. This is intentional — it turns the test into permanent documentation of what the bug was, why it matters, and what the correct value is.

### 5. Composition is a first-class concept
`boldItalicSans` is not a map entry — it is the mathematical intersection of `boldSans` and `italicSans`. Testing composition separately from basic application reveals whether the format system is correctly modeling the underlying Unicode block structure.

### 6. Test your invariants, not just your outputs
Many of the suites test properties (no duplicates, no collisions, round-trip identity) rather than specific values. This is more powerful: a property test covers all 52 letters × all 10 styles automatically, whereas a spot-check test only covers the letters you thought to include.

---

## Resources

- [Unicode Mathematical Alphanumeric Symbols block (U+1D400–U+1D7FF)](https://www.unicode.org/charts/PDF/U1D400.pdf)
- [Unicode Letterlike Symbols block (U+2100–U+214F)](https://www.unicode.org/charts/PDF/U2100.pdf)
- [Jest documentation](https://jestjs.io/docs/getting-started)
- [UMD (Universal Module Definition) pattern](https://github.com/umdjs/umd)
- [Source code](https://github.com/gsaravanan/post-formatter)

---

*Tests written with Jest 29. All 144 tests pass on Node.js 22 (LTS).*
