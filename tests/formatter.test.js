'use strict';

/**
 * Comprehensive test suite for the Social Media Formatter.
 * Tests all character maps, format detection, toggle, composition,
 * clearFormat, and utility functions.
 */

const {
    maps,
    reverseMaps,
    detectFormats,
    toPlain,
    formatSetToString,
    applyFormatToText,
    clearFormatText,
    buzzwordEmojiMap,
    shortcodeMap,
    autoEmojifyText,
    convertShortcodesText
} = require('../js/formatter.js');

const ALL_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ALL_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALL_ALPHA = [...ALL_LOWERCASE, ...ALL_UPPERCASE];
const STYLE_NAMES = [
    'boldSans', 'italicSans', 'boldItalicSans', 'boldSerif', 'boldItalicSerif',
    'italicSerif', 'fraktur', 'script', 'circular', 'square'
];

// ============================================================================
// SUITE 1: MAP COMPLETENESS
// Every style must cover all 26 lowercase + 26 uppercase letters.
// ============================================================================
describe('Map Completeness', () => {
    for (const style of STYLE_NAMES) {
        describe(`${style}`, () => {
            test('has all 26 lowercase letters', () => {
                for (const c of ALL_LOWERCASE) {
                    expect(maps[style]).toHaveProperty(c);
                    expect(maps[style][c]).toBeTruthy();
                }
            });
            test('has all 26 uppercase letters', () => {
                for (const c of ALL_UPPERCASE) {
                    expect(maps[style]).toHaveProperty(c);
                    expect(maps[style][c]).toBeTruthy();
                }
            });
        });
    }

    test('boldSans has digits 0-9', () => {
        for (let d = 0; d <= 9; d++) {
            expect(maps.boldSans).toHaveProperty(String(d));
        }
    });
    test('square has digits 0-9', () => {
        for (let d = 0; d <= 9; d++) {
            expect(maps.square).toHaveProperty(String(d));
        }
    });
});

// ============================================================================
// SUITE 2: NO INTRA-MAP DUPLICATES
// No two keys within the same map should produce the same output character.
// ============================================================================
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

// ============================================================================
// SUITE 3: NO CROSS-MAP COLLISIONS (between distinct styles)
// Different styles must not share output characters.
// boldItalicSans shares digits with boldSans — that is acceptable and excluded.
// ============================================================================
describe('No Cross-Map Collisions', () => {
    const STYLE_PAIRS_TO_CHECK = [
        ['boldSans', 'italicSans'],
        ['boldSans', 'boldSerif'],
        ['italicSans', 'italicSerif'],   // CRITICAL: was identical before fix
        ['italicSans', 'script'],
        ['italicSerif', 'script'],       // CRITICAL: script uppercase used italic chars
        ['fraktur', 'circular'],         // CRITICAL: circular uppercase used bold-fraktur chars
        ['boldSerif', 'boldItalicSerif'],
        ['fraktur', 'script'],
        ['square', 'boldSans'],
        ['circular', 'boldSans']
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
});

// ============================================================================
// SUITE 4: SPECIFIC BUG REGRESSION CHECKS
// Each of these verifies a specific character that was wrong before the fix.
// ============================================================================
describe('Specific Bug Regression Checks', () => {
    // --- Fraktur ---
    test('fraktur R is ℜ (U+211C), not S duplicate 𝔖', () => {
        expect(maps.fraktur['R']).toBe('ℜ');
        expect(maps.fraktur['R']).not.toBe(maps.fraktur['S']);
    });
    test('fraktur Z is ℨ (U+2128), not lowercase z fraktur 𝔷', () => {
        expect(maps.fraktur['Z']).toBe('ℨ');
        expect(maps.fraktur['Z']).not.toBe(maps.fraktur['z']);
    });
    test('fraktur C is ℭ (U+212D)', () => {
        expect(maps.fraktur['C']).toBe('ℭ');
    });
    test('fraktur H is ℌ (U+210C)', () => {
        expect(maps.fraktur['H']).toBe('ℌ');
    });
    test('fraktur I is ℑ (U+2111)', () => {
        expect(maps.fraktur['I']).toBe('ℑ');
    });

    // --- Script uppercase ---
    test('script L is ℒ (U+2112), not lowercase script 𝓁', () => {
        expect(maps.script['L']).toBe('ℒ');
        expect(maps.script['L']).not.toBe(maps.script['l']);
    });
    test('script B is ℬ (U+212C)', () => {
        expect(maps.script['B']).toBe('ℬ');
    });
    test('script E is ℰ (U+2130)', () => {
        expect(maps.script['E']).toBe('ℰ');
    });
    test('script F is ℱ (U+2131)', () => {
        expect(maps.script['F']).toBe('ℱ');
    });
    test('script H is ℋ (U+210B)', () => {
        expect(maps.script['H']).toBe('ℋ');
    });
    test('script I is ℐ (U+2110)', () => {
        expect(maps.script['I']).toBe('ℐ');
    });
    test('script M is ℳ (U+2133)', () => {
        expect(maps.script['M']).toBe('ℳ');
    });
    test('script R is ℛ (U+211B)', () => {
        expect(maps.script['R']).toBe('ℛ');
    });

    // --- Script lowercase ---
    test('script e is ℯ (U+212F, SCRIPT SMALL E), not italic e', () => {
        expect(maps.script['e']).toBe('ℯ');
        expect(maps.script['e']).not.toBe(maps.italicSerif['e']);
    });
    test('script g is ℊ (U+210A, SCRIPT SMALL G), not italic g', () => {
        expect(maps.script['g']).toBe('ℊ');
        expect(maps.script['g']).not.toBe(maps.italicSerif['g']);
    });
    test('script o is ℴ (U+2134, SCRIPT SMALL O), not italic o', () => {
        expect(maps.script['o']).toBe('ℴ');
        expect(maps.script['o']).not.toBe(maps.italicSerif['o']);
    });

    // --- italicSerif ≠ italicSans ---
    test('italicSerif and italicSans use completely different characters', () => {
        for (const c of ALL_ALPHA) {
            expect(maps.italicSerif[c]).not.toBe(maps.italicSans[c]);
        }
    });
    test('italicSerif h is ℎ (U+210E, Planck constant)', () => {
        expect(maps.italicSerif['h']).toBe('ℎ');
    });

    // --- Circular (Double-Struck) uppercase ---
    test('circular C is ℂ (double-struck), not Bold Fraktur 𝕮', () => {
        expect(maps.circular['C']).toBe('ℂ');
        expect(maps.circular['C']).not.toBe('𝕮');
    });
    test('circular H is ℍ (double-struck), not Bold Fraktur 𝕳', () => {
        expect(maps.circular['H']).toBe('ℍ');
    });
    test('circular N is ℕ (double-struck), not Bold Fraktur 𝕹', () => {
        expect(maps.circular['N']).toBe('ℕ');
    });
    test('circular R is ℝ (double-struck), not Bold Fraktur 𝕽', () => {
        expect(maps.circular['R']).toBe('ℝ');
    });
    test('circular Z is ℤ (double-struck)', () => {
        expect(maps.circular['Z']).toBe('ℤ');
    });
});

// ============================================================================
// SUITE 5: REVERSE MAP ROUND-TRIP
// toPlain(maps.X[c]) === c for every format and every letter.
// ============================================================================
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

    test('spaces and punctuation pass through toPlain unchanged', () => {
        for (const c of [' ', '.', '!', '1', '2', '\n']) {
            expect(toPlain(c)).toBe(c);
        }
    });
});

// ============================================================================
// SUITE 6: FORMAT DETECTION
// detectFormats should correctly identify which style a character belongs to.
// ============================================================================
describe('Format Detection', () => {
    test('plain ASCII returns empty Set', () => {
        expect(detectFormats('a').size).toBe(0);
        expect(detectFormats('Z').size).toBe(0);
        expect(detectFormats(' ').size).toBe(0);
    });

    const singleFormatStyles = [
        ['boldSans',        'boldSans'],
        ['italicSans',      'italicSans'],
        ['boldSerif',       'boldSerif'],
        ['boldItalicSerif', 'boldItalicSerif'],
        ['italicSerif',     'italicSerif'],
        ['fraktur',         'fraktur'],
        ['script',          'script'],
        ['circular',        'circular'],
        ['square',          'square']
    ];
    for (const [style, expectedKey] of singleFormatStyles) {
        test(`${style} char detected as {${expectedKey}}`, () => {
            const fmtA = detectFormats(maps[style]['a']);
            expect(fmtA.has(expectedKey)).toBe(true);
            const fmtZ = detectFormats(maps[style]['Z']);
            expect(fmtZ.has(expectedKey)).toBe(true);
        });
    }

    test('boldItalicSans char detected as {boldSans, italicSans}', () => {
        const fmts = detectFormats(maps.boldItalicSans['a']);
        expect(fmts.has('boldSans')).toBe(true);
        expect(fmts.has('italicSans')).toBe(true);
    });
});

// ============================================================================
// SUITE 7: APPLY FORMAT — BASIC APPLICATION
// ============================================================================
describe('Apply Format — Basic', () => {
    test('boldSans applied to plain text produces bold sans chars', () => {
        const result = applyFormatToText('hello', 'boldSans');
        expect(result).toBe('𝗵𝗲𝗹𝗹𝗼');
    });

    test('italicSans applied to plain text produces italic sans chars', () => {
        const result = applyFormatToText('Hello', 'italicSans');
        expect(result).toBe('𝘏𝘦𝘭𝘭𝘰');
    });

    test('boldSerif applied to plain text produces bold serif chars', () => {
        const result = applyFormatToText('Hi', 'boldSerif');
        expect(result).toBe('𝐇𝐢');
    });

    test('fraktur applied to plain text', () => {
        const result = applyFormatToText('Hello', 'fraktur');
        // H (uppercase) → ℌ (fixed from unassigned codepoint); e,l,o (lowercase) → 𝔢,𝔩,𝔬
        expect(result).toBe('ℌ𝔢𝔩𝔩𝔬');
    });

    test('script applied to plain text', () => {
        const result = applyFormatToText('Hello', 'script');
        // H → ℋ (script H), e → ℯ (script e), l → 𝓁, l → 𝓁, o → ℴ
        expect(result).toBe('ℋℯ𝓁𝓁ℴ');
    });

    test('circular applied to plain text', () => {
        const result = applyFormatToText('ABC', 'circular');
        expect(result).toBe('𝔸𝔹ℂ');
    });

    test('square applied to plain text', () => {
        const result = applyFormatToText('Hi', 'square');
        expect(result).toBe('𝙷𝚒');
    });

    test('spaces pass through any format unchanged', () => {
        const result = applyFormatToText('a b', 'boldSans');
        expect(result).toBe('𝗮 𝗯');
    });

    test('numbers pass through formats that lack digit maps', () => {
        const result = applyFormatToText('a1b', 'italicSans');
        expect(result).toBe('𝘢1𝘣');
    });

    test('boldSans formats digits', () => {
        const result = applyFormatToText('123', 'boldSans');
        expect(result).toBe('𝟭𝟮𝟯');
    });
});

// ============================================================================
// SUITE 8: TOGGLE BEHAVIOR
// Applying the same format twice should return the original plain text.
// ============================================================================
describe('Toggle Behavior', () => {
    const toggleStyles = [
        'boldSans', 'italicSans', 'boldSerif', 'boldItalicSerif',
        'italicSerif', 'fraktur', 'script', 'circular', 'square'
    ];

    for (const style of toggleStyles) {
        test(`${style}: apply twice → returns plain text`, () => {
            const formatted = applyFormatToText('Hello', style);
            const toggled = applyFormatToText(formatted, style);
            expect(toggled).toBe('Hello');
        });
    }

    test('toggle works for text with spaces (space-skipping fix)', () => {
        // "Hello World" bold → toggle bold → plain
        const bold = applyFormatToText('Hello World', 'boldSans');
        expect(bold).toBe('𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱');
        const toggled = applyFormatToText(bold, 'boldSans');
        expect(toggled).toBe('Hello World');
    });

    test('toggle works for mixed-case text', () => {
        const formatted = applyFormatToText('FooBar', 'boldSerif');
        const toggled = applyFormatToText(formatted, 'boldSerif');
        expect(toggled).toBe('FooBar');
    });
});

// ============================================================================
// SUITE 9: FORMAT COMPOSITION
// Applying boldSans then italicSans should produce boldItalicSans.
// ============================================================================
describe('Format Composition', () => {
    test('boldSans + italicSans = boldItalicSans', () => {
        const afterBold = applyFormatToText('hi', 'boldSans');
        const afterItalic = applyFormatToText(afterBold, 'italicSans');
        // Applying italic to bold text should produce bold-italic chars
        expect(afterItalic).toBe('𝙝𝙞');
    });

    test('italicSans + boldSans = boldItalicSans (order independent)', () => {
        const afterItalic = applyFormatToText('hi', 'italicSans');
        const afterBold = applyFormatToText(afterItalic, 'boldSans');
        expect(afterBold).toBe('𝙝𝙞');
    });

    test('removing boldSans from boldItalicSans leaves italicSans', () => {
        // Create boldItalicSans via composition (not directly, as boldItalicSans is a composed format)
        const boldItalic = applyFormatToText(applyFormatToText('hi', 'boldSans'), 'italicSans');
        expect(boldItalic).toBe('𝙝𝙞'); // confirm it's boldItalicSans
        const onlyItalic = applyFormatToText(boldItalic, 'boldSans'); // toggle off bold
        expect(onlyItalic).toBe(maps.italicSans['h'] + maps.italicSans['i']);
    });

    test('removing italicSans from boldItalicSans leaves boldSans', () => {
        // Create boldItalicSans via composition
        const boldItalic = applyFormatToText(applyFormatToText('hi', 'boldSans'), 'italicSans');
        expect(boldItalic).toBe('𝙝𝙞'); // confirm it's boldItalicSans
        const onlyBold = applyFormatToText(boldItalic, 'italicSans'); // toggle off italic
        expect(onlyBold).toBe(maps.boldSans['h'] + maps.boldSans['i']);
    });
});

// ============================================================================
// SUITE 10: CLEAR FORMAT
// clearFormatText should convert ANY styled text back to plain ASCII.
// ============================================================================
describe('clearFormat', () => {
    for (const style of STYLE_NAMES) {
        test(`clears ${style} formatting`, () => {
            const formatted = applyFormatToText('Hello', style);
            expect(clearFormatText(formatted)).toBe('Hello');
        });
    }

    test('clears boldItalicSans', () => {
        const formatted = applyFormatToText('Hello', 'boldItalicSans');
        expect(clearFormatText(formatted)).toBe('Hello');
    });

    test('clears underline (combining low line \\u0332)', () => {
        const underlined = 'H\u0332e\u0332l\u0332l\u0332o\u0332';
        expect(clearFormatText(underlined)).toBe('Hello');
    });

    test('leaves plain text unchanged', () => {
        expect(clearFormatText('Hello World!')).toBe('Hello World!');
    });

    test('clears full sentence with multiple formats', () => {
        const bold = applyFormatToText('Hello', 'boldSans');
        const italic = applyFormatToText('World', 'italicSerif');
        const mixed = bold + ' ' + italic;
        expect(clearFormatText(mixed)).toBe('Hello World');
    });
});

// ============================================================================
// SUITE 11: AUTO-EMOJIFY
// ============================================================================
describe('autoEmojifyText', () => {
    test('adds emoji after known buzzword', () => {
        const result = autoEmojifyText('growth is key');
        expect(result).toContain('growth 📈');
    });

    test('adds emoji after "launch"', () => {
        expect(autoEmojifyText('We will launch soon')).toContain('launch 🚀');
    });

    test('case-insensitive for ALL-CAPS word', () => {
        // The regex is case-insensitive at word level via toLowerCase()
        expect(autoEmojifyText('GROWTH matters')).toContain('GROWTH 📈');
    });

    test('unknown words are not changed', () => {
        const result = autoEmojifyText('banana is tasty');
        expect(result).toBe('banana is tasty');
    });

    test('non-buzzword words between emojis are unchanged', () => {
        // "fire" is a buzzword → adds 🔥; "safety" is not a buzzword → unchanged
        const result = autoEmojifyText('fire safety');
        expect(result).toContain('fire 🔥');
        expect(result).toContain('safety');
        expect(result).not.toContain('safety 🔥');
    });
});

// ============================================================================
// SUITE 12: SHORTCODE CONVERSION
// ============================================================================
describe('convertShortcodesText', () => {
    test(':rocket: converts to 🚀', () => {
        expect(convertShortcodesText('Let\'s :rocket: this!')).toBe('Let\'s 🚀 this!');
    });
    test(':fire: converts to 🔥', () => {
        expect(convertShortcodesText(':fire:')).toBe('🔥');
    });
    test(':check: converts to ✅', () => {
        expect(convertShortcodesText(':check:')).toBe('✅');
    });
    test(':brain: converts to 🧠', () => {
        expect(convertShortcodesText(':brain:')).toBe('🧠');
    });
    test('unknown shortcodes are unchanged', () => {
        expect(convertShortcodesText(':unknown:')).toBe(':unknown:');
    });
    test('multiple shortcodes in one string', () => {
        const result = convertShortcodesText(':rocket: to the moon :fire:');
        expect(result).toBe('🚀 to the moon 🔥');
    });
});

// ============================================================================
// SUITE 13: EDGE CASES
// ============================================================================
describe('Edge Cases', () => {
    test('empty string returns empty string for any format', () => {
        expect(applyFormatToText('', 'boldSans')).toBe('');
        expect(clearFormatText('')).toBe('');
        expect(autoEmojifyText('')).toBe('');
    });

    test('numbers-only string is handled by clearFormat', () => {
        expect(clearFormatText('123')).toBe('123');
    });

    test('boldSans numbers round-trip through toPlain', () => {
        for (let d = 0; d <= 9; d++) {
            const formatted = maps.boldSans[String(d)];
            expect(toPlain(formatted)).toBe(String(d));
        }
    });

    test('italic serif h round-trips correctly (ℎ is Planck constant)', () => {
        expect(maps.italicSerif['h']).toBe('ℎ');
        expect(toPlain('ℎ')).toBe('h');
    });

    test('applying format to already-formatted text in different style replaces it', () => {
        const frakturH = applyFormatToText('Hello', 'fraktur');
        const boldH = applyFormatToText(frakturH, 'boldSans');
        // All chars should be boldSans now
        for (const c of 'Hello') {
            expect(boldH).toContain(maps.boldSans[c]);
        }
    });

    test('formatSetToString produces stable sort', () => {
        const set1 = new Set(['italicSans', 'boldSans']);
        const set2 = new Set(['boldSans', 'italicSans']);
        expect(formatSetToString(set1)).toBe(formatSetToString(set2));
    });
});
