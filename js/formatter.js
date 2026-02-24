/**
 * Social Media Formatter — Core Formatting Logic
 * Works as a browser <script> and as a Node.js require() module.
 *
 * All Unicode character maps are authoritative here.
 * html/index.html and main.py must stay in sync with these maps.
 */

// ---------------------------------------------------------------------------
// 1. UNICODE CHARACTER MAPS
// ---------------------------------------------------------------------------
const maps = {
    boldSans: {
        a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵',
        i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽',
        q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅',
        y: '𝘆', z: '𝘇',
        A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛',
        I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣',
        Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫',
        Y: '𝗬', Z: '𝗭',
        0: '𝟬', 1: '𝟭', 2: '𝟮', 3: '𝟯', 4: '𝟰', 5: '𝟱', 6: '𝟲', 7: '𝟳',
        8: '𝟴', 9: '𝟵'
    },
    italicSans: {
        a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩',
        i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭', m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱',
        q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹',
        y: '𝘺', z: '𝘻',
        A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏',
        I: '𝘐', J: '𝘑', K: '𝘒', L: '𝘓', M: '𝘔', N: '𝘕', O: '𝘖', P: '𝘗',
        Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛', U: '𝘜', V: '𝘝', W: '𝘞', X: '𝘟',
        Y: '𝘠', Z: '𝘡'
    },
    boldItalicSans: {
        a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝',
        i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢', n: '𝙣', o: '𝙤', p: '𝙥',
        q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭',
        y: '𝙮', z: '𝙯',
        A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃',
        I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈', N: '𝙉', O: '𝙊', P: '𝙋',
        Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓',
        Y: '𝙔', Z: '𝙕',
        0: '𝟬', 1: '𝟭', 2: '𝟮', 3: '𝟯', 4: '𝟰', 5: '𝟱', 6: '𝟲', 7: '𝟳',
        8: '𝟴', 9: '𝟵'
    },
    boldSerif: {
        a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡',
        i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩',
        q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱',
        y: '𝐲', z: '𝐳',
        A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇',
        I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏',
        Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗',
        Y: '𝐘', Z: '𝐙'
    },
    boldItalicSerif: {
        a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉',
        i: '𝒊', j: '𝒋', k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑',
        q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕', u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙',
        y: '𝒚', z: '𝒛',
        A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯',
        I: '𝑰', J: '𝑱', K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷',
        Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻', U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿',
        Y: '𝒀', Z: '𝒁'
    },
    // FIX: italicSerif now uses Mathematical Italic (U+1D434–U+1D44D / U+1D44E–U+1D467)
    // Previously identical to italicSans — caused reverse-map collision & wrong detection.
    // Note: h → ℎ (U+210E, Planck constant) because U+1D455 is unassigned.
    italicSerif: {
        a: '𝑎', b: '𝑏', c: '𝑐', d: '𝑑', e: '𝑒', f: '𝑓', g: '𝑔', h: 'ℎ',
        i: '𝑖', j: '𝑗', k: '𝑘', l: '𝑙', m: '𝑚', n: '𝑛', o: '𝑜', p: '𝑝',
        q: '𝑞', r: '𝑟', s: '𝑠', t: '𝑡', u: '𝑢', v: '𝑣', w: '𝑤', x: '𝑥',
        y: '𝑦', z: '𝑧',
        A: '𝐴', B: '𝐵', C: '𝐶', D: '𝐷', E: '𝐸', F: '𝐹', G: '𝐺', H: '𝐻',
        I: '𝐼', J: '𝐽', K: '𝐾', L: '𝐿', M: '𝑀', N: '𝑁', O: '𝑂', P: '𝑃',
        Q: '𝑄', R: '𝑅', S: '𝑆', T: '𝑇', U: '𝑈', V: '𝑉', W: '𝑊', X: '𝑋',
        Y: '𝑌', Z: '𝑍'
    },
    // FIX: Fraktur uppercase — C/H/I/R/Z were wrong (unassigned codepoints or duplicates).
    // FIX: R was duplicated to S's char (𝔖). Fixed: R→ℜ, Z→ℨ, C→ℭ, H→ℌ, I→ℑ.
    fraktur: {
        a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢', f: '𝔣', g: '𝔤', h: '𝔥',
        i: '𝔦', j: '𝔧', k: '𝔨', l: '𝔩', m: '𝔪', n: '𝔫', o: '𝔬', p: '𝔭',
        q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱', u: '𝔲', v: '𝔳', w: '𝔴', x: '𝔵',
        y: '𝔶', z: '𝔷',
        A: '𝔄', B: '𝔅', C: 'ℭ', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊', H: 'ℌ',
        I: 'ℑ', J: '𝔍', K: '𝔎', L: '𝔏', M: '𝔐', N: '𝔑', O: '𝔒', P: '𝔓',
        Q: '𝔔', R: 'ℜ', S: '𝔖', T: '𝔗', U: '𝔘', V: '𝔙', W: '𝔚', X: '𝔛',
        Y: '𝔜', Z: 'ℨ'
    },
    // FIX: Script uppercase — B/E/F/H/I/L/M/R used Mathematical Italic chars instead of Script.
    // FIX: Script lowercase — e/g/o used Italic chars (U+1D452/U+1D454/U+1D45C) instead of
    //      proper script chars: ℯ(U+212F), ℊ(U+210A), ℴ(U+2134).
    script: {
        a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: 'ℯ', f: '𝒻', g: 'ℊ', h: '𝒽',
        i: '𝒾', j: '𝒿', k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: 'ℴ', p: '𝓅',
        q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉', u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍',
        y: '𝓎', z: '𝓏',
        A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢', H: 'ℋ',
        I: 'ℐ', J: '𝒥', K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩', O: '𝒪', P: '𝒫',
        Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯', U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳',
        Y: '𝒴', Z: '𝒵'
    },
    // FIX: Circular (Double-Struck / Blackboard Bold) uppercase — from C onwards was using
    //      Mathematical Bold Fraktur (𝕮-𝖅) instead of Double-Struck. All fixed.
    circular: {
        a: '𝕒', b: '𝕓', c: '𝕔', d: '𝕕', e: '𝕖', f: '𝕗', g: '𝕘', h: '𝕙',
        i: '𝕚', j: '𝕛', k: '𝕜', l: '𝕝', m: '𝕞', n: '𝕟', o: '𝕠', p: '𝕡',
        q: '𝕢', r: '𝕣', s: '𝕤', t: '𝕥', u: '𝕦', v: '𝕧', w: '𝕨', x: '𝕩',
        y: '𝕪', z: '𝕫',
        A: '𝔸', B: '𝔹', C: 'ℂ', D: '𝔻', E: '𝔼', F: '𝔽', G: '𝔾', H: 'ℍ',
        I: '𝕀', J: '𝕁', K: '𝕂', L: '𝕃', M: '𝕄', N: 'ℕ', O: '𝕆', P: 'ℙ',
        Q: 'ℚ', R: 'ℝ', S: '𝕊', T: '𝕋', U: '𝕌', V: '𝕍', W: '𝕎', X: '𝕏',
        Y: '𝕐', Z: 'ℤ'
    },
    square: {
        a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑',
        i: '𝚒', j: '𝚓', k: '𝚔', l: '𝚕', m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙',
        q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝', u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡',
        y: '𝚢', z: '𝚣',
        A: '𝙰', B: '𝙱', C: '𝙲', D: '𝙳', E: '𝙴', F: '𝙵', G: '𝙶', H: '𝙷',
        I: '𝙸', J: '𝙹', K: '𝙺', L: '𝙻', M: '𝙼', N: '𝙽', O: '𝙾', P: '𝙿',
        Q: '𝚀', R: '𝚁', S: '𝚂', T: '𝚃', U: '𝚄', V: '𝚅', W: '𝚆', X: '𝚇',
        Y: '𝚈', Z: '𝚉',
        0: '𝟶', 1: '𝟷', 2: '𝟸', 3: '𝟹', 4: '𝟺', 5: '𝟻', 6: '𝟼', 7: '𝟽',
        8: '𝟾', 9: '𝟿'
    },
    // Identity map — used as the "clear" passthrough.
    sans: {
        a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h',
        i: 'i', j: 'j', k: 'k', l: 'l', m: 'm', n: 'n', o: 'o', p: 'p',
        q: 'q', r: 'r', s: 's', t: 't', u: 'u', v: 'v', w: 'w', x: 'x',
        y: 'y', z: 'z',
        A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H',
        I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N', O: 'O', P: 'P',
        Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X',
        Y: 'Y', Z: 'Z'
    }
};

// ---------------------------------------------------------------------------
// 2. REVERSE MAPS (formatted char → plain char)
// Check bold-italic first, then bold, then italic, then decorative styles.
// ---------------------------------------------------------------------------
function createReverseMaps() {
    const reverse = {};
    const order = [
        'boldItalicSans', 'boldItalicSerif',
        'boldSans', 'boldSerif',
        'italicSans', 'italicSerif',
        'script', 'fraktur', 'circular', 'square', 'sans'
    ];
    for (const type of order) {
        if (!maps[type]) continue;
        reverse[type] = {};
        for (const char in maps[type]) {
            reverse[type][maps[type][char]] = char;
        }
    }
    return reverse;
}
const reverseMaps = createReverseMaps();

// ---------------------------------------------------------------------------
// 3. FORMAT DETECTION
// Returns a Set of format names for a given Unicode character.
// boldItalicSans is decomposed into {boldSans, italicSans} so the composition
// system can toggle individual bold/italic components independently.
// ---------------------------------------------------------------------------
function detectFormats(char) {
    if (reverseMaps.boldItalicSans && reverseMaps.boldItalicSans[char])
        return new Set(['boldSans', 'italicSans']);
    if (reverseMaps.boldItalicSerif && reverseMaps.boldItalicSerif[char])
        return new Set(['boldItalicSerif']);
    if (reverseMaps.boldSans && reverseMaps.boldSans[char])
        return new Set(['boldSans']);
    if (reverseMaps.boldSerif && reverseMaps.boldSerif[char])
        return new Set(['boldSerif']);
    if (reverseMaps.italicSans && reverseMaps.italicSans[char])
        return new Set(['italicSans']);
    if (reverseMaps.italicSerif && reverseMaps.italicSerif[char])
        return new Set(['italicSerif']);
    if (reverseMaps.script && reverseMaps.script[char])
        return new Set(['script']);
    if (reverseMaps.fraktur && reverseMaps.fraktur[char])
        return new Set(['fraktur']);
    if (reverseMaps.circular && reverseMaps.circular[char])
        return new Set(['circular']);
    if (reverseMaps.square && reverseMaps.square[char])
        return new Set(['square']);
    return new Set();
}

// ---------------------------------------------------------------------------
// 4. PLAIN TEXT CONVERSION
// Converts any Unicode-styled character back to its plain ASCII equivalent.
// ---------------------------------------------------------------------------
function toPlain(char) {
    for (const type of ['boldItalicSans', 'boldItalicSerif', 'boldSans', 'boldSerif',
                        'italicSans', 'italicSerif', 'script', 'fraktur',
                        'circular', 'square', 'sans']) {
        if (reverseMaps[type] && reverseMaps[type][char] !== undefined)
            return reverseMaps[type][char];
    }
    return char;
}

// ---------------------------------------------------------------------------
// 5. FORMAT SET HELPER
// ---------------------------------------------------------------------------
function formatSetToString(set) {
    return Array.from(set).sort().join(',');
}

// ---------------------------------------------------------------------------
// 6. APPLY MAPPING (with toggle + composition)
// FIX: allHaveSameState check now skips whitespace/punctuation so that
//      "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱" (bold text with plain space) correctly toggles off.
// ---------------------------------------------------------------------------
function applyFormatToText(text, type) {
    let res = '';
    let allHaveSameState = true;
    let firstCharState = null;

    // Determine state using only alphabetic characters (skip spaces/punctuation).
    const alphaChars = Array.from(text).filter(c => /[a-z]/i.test(toPlain(c)));

    if (alphaChars.length > 0) {
        const firstFormats = detectFormats(alphaChars[0]);
        firstCharState = formatSetToString(firstFormats);

        for (let i = 1; i < alphaChars.length; i++) {
            if (formatSetToString(detectFormats(alphaChars[i])) !== firstCharState) {
                allHaveSameState = false;
                break;
            }
        }
    }

    for (const char of text) {
        const plainChar = toPlain(char);
        const currentFormats = detectFormats(char);
        let newFormats = new Set(currentFormats);

        // Only toggle-check on alpha chars; non-alpha always just gets the format added
        const isAlpha = /[a-z]/i.test(plainChar);
        if (isAlpha && allHaveSameState && currentFormats.has(type)) {
            newFormats.delete(type);    // Toggle OFF
        } else {
            newFormats.add(type);       // Add format
        }

        // Resolve the winning format (priority order: most specific → least specific)
        let result = plainChar;
        if (newFormats.has('boldSans') && newFormats.has('italicSans')) {
            result = maps.boldItalicSans[result] || result;
        } else if (newFormats.has('boldItalicSerif')) {
            result = maps.boldItalicSerif[result] || result;
        } else if (newFormats.has('boldSans')) {
            result = maps.boldSans[result] || result;
        } else if (newFormats.has('boldSerif')) {
            result = maps.boldSerif[result] || result;
        } else if (newFormats.has('italicSans')) {
            result = maps.italicSans[result] || result;
        } else if (newFormats.has('italicSerif')) {
            result = maps.italicSerif[result] || result;
        } else if (newFormats.has('fraktur')) {
            result = maps.fraktur[result] || result;
        } else if (newFormats.has('script')) {
            result = maps.script[result] || result;
        } else if (newFormats.has('circular')) {
            result = maps.circular[result] || result;
        } else if (newFormats.has('square')) {
            result = maps.square[result] || result;
        } else if (newFormats.has('sans')) {
            result = maps.sans[result] || result;
        }
        res += result;
    }
    return res;
}

// ---------------------------------------------------------------------------
// 7. CLEAR FORMAT
// FIX: Previous version only removed combining diacritics, not Unicode math chars.
//      Now calls toPlain() on every character before stripping diacritics.
// ---------------------------------------------------------------------------
function clearFormatText(text) {
    let clean = '';
    for (const char of text) clean += toPlain(char);
    return clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// 8. EMOJI / SHORTCODE DATA
// ---------------------------------------------------------------------------
const buzzwordEmojiMap = {
    growth: '📈', sales: '💰', money: '💵', profit: '💸', team: '🤝',
    developer: '👨‍💻', engineer: '🛠️', cloud: '☁️', hiring: '📢', jobs: '💼',
    work: '🛠️', code: '💻', tech: '🤖', ai: '🧠', data: '📊', idea: '💡',
    goal: '🎯', success: '🏆', win: '🏅', learn: '📚', time: '⏳',
    deadline: '⏰', launch: '🚀', fire: '🔥', hot: '🔥', happy: '😊',
    sad: '😔', question: '❓', email: '📧', call: '📞', contact: '📬',
    link: '🔗', website: '🌐', social_media: '🌍', important: '⚠️',
    alert: '🚨', check: '✅', done: '✅'
};

const shortcodeMap = {
    ':rocket:': '🚀', ':fire:': '🔥', ':check:': '✅', ':smile:': '😊',
    ':chart:': '📈', ':target:': '🎯', ':brain:': '🧠', ':100:': '💯'
};

function autoEmojifyText(text) {
    return text.replace(/\b(\w+)\b/g, (match) => {
        const lower = match.toLowerCase();
        return buzzwordEmojiMap[lower] ? `${match} ${buzzwordEmojiMap[lower]}` : match;
    });
}

function convertShortcodesText(text) {
    let result = text;
    for (const code in shortcodeMap) {
        result = result.split(code).join(shortcodeMap[code]);
    }
    return result;
}

// ---------------------------------------------------------------------------
// 9. UMD EXPORT — works in both browser (global) and Node.js (require)
// ---------------------------------------------------------------------------
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();          // Node.js / CommonJS
    } else {
        const exports = factory();           // Browser — expose as globals
        root.formatterMaps = exports.maps;
        root.formatterReverseMaps = exports.reverseMaps;
        root.detectFormats = exports.detectFormats;
        root.toPlain = exports.toPlain;
        root.formatSetToString = exports.formatSetToString;
        root.applyFormatToText = exports.applyFormatToText;
        root.clearFormatText = exports.clearFormatText;
        root.buzzwordEmojiMap = exports.buzzwordEmojiMap;
        root.shortcodeMap = exports.shortcodeMap;
        root.autoEmojifyText = exports.autoEmojifyText;
        root.convertShortcodesText = exports.convertShortcodesText;
    }
}(typeof window !== 'undefined' ? window : this, function () {
    return {
        maps,
        reverseMaps,
        createReverseMaps,
        detectFormats,
        toPlain,
        formatSetToString,
        applyFormatToText,
        clearFormatText,
        buzzwordEmojiMap,
        shortcodeMap,
        autoEmojifyText,
        convertShortcodesText
    };
}));
