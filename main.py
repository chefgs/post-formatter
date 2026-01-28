from fasthtml.common import *

# --- 1. CSS STYLING ---
# We inject the CSS directly into the head
app_css = Style("""
    :root {
        --primary: #0a66c2;
        --bg: #f8f9fa;
        --surface: #ffffff;
        --border: #e0e0e0;
    }
    body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: #191919; display: flex; justify-content: center; min-height: 100vh; padding: 20px; }
    .app-container { background: var(--surface); width: 100%; max-width: 750px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; }
    
    .header { padding: 24px 32px; border-bottom: 1px solid var(--border); background: #fff; }
    .header h1 { margin: 0; color: var(--primary); font-size: 1.4rem; font-weight: 700; }
    
    .toolbar-group { padding: 12px 24px; border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: #fff; }
    .label { font-size: 0.75rem; font-weight: 600; color: #999; text-transform: uppercase; margin-right: 8px; }
    
    button.tool-btn { background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 8px 14px; cursor: pointer; transition: 0.2s; color: #444; }
    button.tool-btn:hover { background: #eef3f8; border-color: var(--primary); color: var(--primary); }
    
    .editor-wrapper { background: #fafafa; position: relative; }
    
    /* UPDATED TEXTAREA CSS */
    textarea { 
        width: 100%; 
        height: 320px; 
        border: none; 
        padding: 32px; 
        font-size: 1.05rem; 
        line-height: 1.6; 
        outline: none; 
        background: transparent; 
        font-family: inherit;
        
        /* Key changes for wrapping and scrolling */
        resize: none;            /* Stops user from dragging size */
        white-space: pre-wrap;   /* Wraps text to next line */
        word-wrap: break-word;   /* Breaks very long words/URLs */
        overflow-y: auto;        /* Adds vertical scrollbar */
        overflow-x: hidden;      /* Hides horizontal scrollbar */
    }
    
    .footer { padding: 16px 32px; background: #fff; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .btn-primary { background: var(--primary); color: white; border: none; padding: 12px 28px; border-radius: 30px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #004182; }
    
    .toast { position: fixed; bottom: 40px; left: 50%; transform: translate(-50%, 20px); background: #333; color: white; padding: 12px 24px; border-radius: 50px; opacity: 0; transition: all 0.3s ease; pointer-events: none; }
    .toast.visible { opacity: 1; transform: translate(-50%, 0); }
    
    /* EMOJI PICKER MODAL */
    .emoji-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }
    .emoji-modal.visible { display: flex; }
    .emoji-modal-content { background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; max-height: 70vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    .emoji-modal-content h2 { margin: 0 0 16px 0; color: var(--primary); font-size: 1.2rem; }
    .emoji-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .emoji-btn { background: #f0f0f0; border: 1px solid var(--border); border-radius: 8px; padding: 8px; cursor: pointer; font-size: 1.8rem; transition: all 0.2s; }
    .emoji-btn:hover { background: #eef3f8; border-color: var(--primary); transform: scale(1.1); }
    .emoji-close-btn { float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
    .emoji-close-btn:hover { color: #000; }
""")


# --- 2. JAVASCRIPT LOGIC ---
# This logic runs in the browser to handle selection and Unicode mapping
client_logic = Script("""
    const maps = {
        boldSans: {
            a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
            A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭'
        },
        italicSans: {
            a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭', m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹', y: '𝘺', z: '𝘻',
            A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏', I: '𝘐', J: '𝘑', K: '𝘒', L: '𝘓', M: '𝘔', N: '𝘕', O: '𝘖', P: '𝘗', Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛', U: '𝘜', V: '𝘝', W: '𝘞', X: '𝘟', Y: '𝘠', Z: '𝘡'
        },
        boldItalicSans: {
            a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢', n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙮', z: '𝙯',
            A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈', N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕'
        },
        boldSerif: {
            a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
            A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙'
        },
        boldItalicSerif: {
            a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋', k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕', u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
            A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱', K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻', U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁'
        },
        italicSerif: {
            a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭', m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹', y: '𝘺', z: '𝘻',
            A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏', I: '𝘐', J: '𝘑', K: '𝘒', L: '𝘓', M: '𝘔', N: '𝘕', O: '𝘖', P: '𝘗', Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛', U: '𝘜', V: '𝘝', W: '𝘞', X: '𝘟', Y: '𝘠', Z: '𝘡'
        },
        fraktur: {
            a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢', f: '𝔣', g: '𝔤', h: '𝔥', i: '𝔦', j: '𝔧', k: '𝔨', l: '𝔩', m: '𝔪', n: '𝔫', o: '𝔬', p: '𝔭', q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱', u: '𝔲', v: '𝔳', w: '𝔴', x: '𝔵', y: '𝔶', z: '𝔷',
            A: '𝔄', B: '𝔅', C: '𝔆', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊', H: '𝔋', I: '𝔌', J: '𝔍', K: '𝔎', L: '𝔏', M: '𝔐', N: '𝔑', O: '𝔒', P: '𝔓', Q: '𝔔', R: '𝔖', S: '𝔖', T: '𝔗', U: '𝔘', V: '𝔙', W: '𝔚', X: '𝔛', Y: '𝔜', Z: '𝔷'
        },
        script: {
            a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: '𝑒', f: '𝒻', g: '𝑔', h: '𝒽', i: '𝒾', j: '𝒿', k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: '𝑜', p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉', u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎', z: '𝓏',
            A: '𝒜', B: '𝐵', C: '𝒞', D: '𝒟', E: '𝐸', F: '𝐹', G: '𝒢', H: '𝐻', I: '𝐼', J: '𝒥', K: '𝒦', L: '𝓁', M: '𝑀', N: '𝒩', O: '𝒪', P: '𝒫', Q: '𝒬', R: '𝑅', S: '𝒮', T: '𝒯', U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵'
        },
        circular: {
            a: '𝕒', b: '𝕓', c: '𝕔', d: '𝕕', e: '𝕖', f: '𝕗', g: '𝕘', h: '𝕙', i: '𝕚', j: '𝕛', k: '𝕜', l: '𝕝', m: '𝕞', n: '𝕟', o: '𝕠', p: '𝕡', q: '𝕢', r: '𝕣', s: '𝕤', t: '𝕥', u: '𝕦', v: '𝕧', w: '𝕨', x: '𝕩', y: '𝕪', z: '𝕫',
            A: '𝔸', B: '𝔹', C: '𝕮', D: '𝔻', E: '𝔼', F: '𝔽', G: '𝔾', H: '𝕳', I: '𝕴', J: '𝕵', K: '𝕶', L: '𝕷', M: '𝕸', N: '𝕹', O: '𝕺', P: '𝕻', Q: '𝕼', R: '𝕽', S: '𝕾', T: '𝕿', U: '𝖀', V: '𝖁', W: '𝖂', X: '𝖃', Y: '𝖄', Z: '𝖅'
        },
        square: {
            a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑', i: '𝚒', j: '𝚓', k: '𝚔', l: '𝚕', m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙', q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝', u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡', y: '𝚢', z: '𝚣',
            A: '𝙰', B: '𝙱', C: '𝙲', D: '𝙳', E: '𝙴', F: '𝙵', G: '𝙶', H: '𝙷', I: '𝙸', J: '𝙹', K: '𝙺', L: '𝙻', M: '𝙼', N: '𝙽', O: '𝙾', P: '𝙿', Q: '𝚀', R: '𝚁', S: '𝚂', T: '𝚃', U: '𝚄', V: '𝚅', W: '𝚆', X: '𝚇', Y: '𝚈', Z: '𝚉'
        },
        sans: {
            a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h', i: 'i', j: 'j', k: 'k', l: 'l', m: 'm', n: 'n', o: 'o', p: 'p', q: 'q', r: 'r', s: 's', t: 't', u: 'u', v: 'v', w: 'w', x: 'x', y: 'y', z: 'z',
            A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N', O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z'
        }
    };
    
    const buzzwords = { "growth": "📈", "team": "🤝", "hiring": "📢", "jobs": "💼", "work": "🛠️", "tech": "🤖", "data": "📊", "idea": "💡", "win": "🏅" };

    const popularEmojis = ["🚀", "🔥", "💡", "🎯", "📈", "💰", "🤝", "✅", "⚡", "👍", "💯", "🌟", "😊", "🎉", "📚", "💻", "🛠️", "⏰", "📞", "📧"];

    function getEditor() { return document.getElementById('editor'); }

    function applyFormat(type) {
        const editor = getEditor();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value.substring(start, end);
        if(!text) return;

        let res = '';
        if(type === 'underline') {
            for(let char of text) res += char + '\\u0332';
        } else {
            const map = maps[type];
            for(let char of text) res += map[char] || char;
        }
        
        editor.value = editor.value.substring(0, start) + res + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + res.length;
        editor.focus();
        updateStats();
    }

    function insertChar(char) {
        const editor = getEditor();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + char + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + char.length;
        editor.focus();
        updateStats();
    }

    function formatCodeBlock() {
        const editor = getEditor();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value.substring(start, end);
        
        if (!text) return;
        
        // Wrap in triple backticks for code block
        const formatted = "```\\n" + text + "\\n```";
        editor.value = editor.value.substring(0, start) + formatted + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + formatted.length;
        editor.focus();
        showToast("Code block formatted! 💻");
        updateStats();
    }

    function formatInlineCode() {
        const editor = getEditor();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value.substring(start, end);
        
        if (!text) return;
        
        // Wrap in backticks for inline code
        const formatted = "`" + text + "`";
        editor.value = editor.value.substring(0, start) + formatted + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + formatted.length;
        editor.focus();
        showToast("Inline code formatted! 📝");
        updateStats();
    }

    function autoEmojify() {
        const editor = getEditor();
        editor.value = editor.value.replace(/\b(\w+)\b/g, (match) => {
            const lower = match.toLowerCase();
            return buzzwords[lower] ? `${match} ${buzzwords[lower]}` : match;
        });
        showToast("Magic Emojis Applied! ✨");
        updateStats();
    }

    function showEmojiPicker() {
        const modal = document.getElementById('emojiModal');
        if (!modal) return;
        modal.classList.add('visible');
    }

    function closeEmojiPicker() {
        const modal = document.getElementById('emojiModal');
        if (!modal) return;
        modal.classList.remove('visible');
    }

    function insertEmoji(emoji) {
        const editor = getEditor();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + emoji + ' ' + editor.value.substring(start);
        editor.selectionStart = editor.selectionEnd = start + emoji.length + 1;
        editor.focus();
        closeEmojiPicker();
        updateStats();
    }
    
    function copyText() {
        const editor = getEditor();
        if(!editor.value) return;
        navigator.clipboard.writeText(editor.value).then(() => showToast("Copied to clipboard!"));
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 2500);
    }
    
    function updateStats() {
        const val = getEditor().value;
        document.getElementById('charCount').innerText = val.length + " chars";
    }

    // Close modal when clicking outside
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('emojiModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeEmojiPicker();
                }
            });
        }
    });
""")

# --- 3. FASTHTML COMPONENTS ---

def Header():
    return Div(
        H1("Social Media Formatter ✨"),
        P("Convert GenAI text into elegant, formatted posts.", style="color: #666; font-size: 0.9rem; margin-top: 5px;"),
        cls="header"
    )

def ToolButton(label, onclick, title):
    # Using cls='tool-btn' to hook into our CSS
    return Button(label, onclick=onclick, title=title, cls="tool-btn", type="button")

def Toolbar():
    return Div(
        # Style Group
        Div(
            Span("Styles", cls="label"),
            ToolButton(B("B"), "applyFormat('boldSans')", "Bold Sans"),
            ToolButton(I("I"), "applyFormat('italicSans')", "Italic Sans"),
            ToolButton("B𝐬", "applyFormat('boldSerif')", "Bold Serif"),
            ToolButton("B𝐈", "applyFormat('boldItalicSerif')", "Bold Italic Serif"),
            ToolButton("I𝐬", "applyFormat('italicSerif')", "Italic Serif"),
            ToolButton("Sans", "applyFormat('sans')", "Sans"),
            ToolButton("𝔉𝔯𝔞𝔯", "applyFormat('fraktur')", "Fraktur"),
            ToolButton("𝒮𝒸𝓇", "applyFormat('script')", "Script"),
            ToolButton("𝔸𝔹ℂ", "applyFormat('circular')", "Circular"),
            ToolButton("𝚂𝚀", "applyFormat('square')", "Square"),
            ToolButton(U("U"), "applyFormat('underline')", "Underline"),
            cls="toolbar-group"
        ),
        # Code Group
        Div(
            Span("Code", cls="label"),
            ToolButton("{ } Inline", "formatInlineCode()", "Inline Code"),
            ToolButton("{ } Block", "formatCodeBlock()", "Code Block"),
            cls="toolbar-group"
        ),
        # Magic Group
        Div(
            Span("Magic", cls="label"),
            ToolButton("✨ Auto-Emojify", "autoEmojify()", "Add Emojis"),
            ToolButton("➕ More Emoji", "showEmojiPicker()", "Popular Emojis"),
            ToolButton("• Bullet", "insertChar('• ')", "Bullet Point"),
            ToolButton("🚀 Rocket", "insertChar('🚀 ')", "Rocket"),
            cls="toolbar-group",
            style="background: #fafafa;"
        )
    )

def AppFooter():
    return Div(
        Div(Span("0 chars", id="charCount"), cls="stats", style="color: #666; font-size: 0.85rem;"),
        Button("Copy", onclick="copyText()", cls="btn-primary"),
        cls="footer"
    )

def EmojiPicker():
    # Popular emojis
    emojis = ["🚀", "🔥", "💡", "🎯", "📈", "💰", "🤝", "✅", "⚡", "👍", "💯", "🌟", "😊", "🎉", "📚", "💻", "🛠️", "⏰", "📞", "📧"]
    emoji_buttons = [Button(emoji, onclick=f"insertEmoji('{emoji}')", cls="emoji-btn", type="button") for emoji in emojis]
    
    return Div(
        Div(
            Button("✕", onclick="closeEmojiPicker()", cls="emoji-close-btn", type="button"),
            H2("Popular Emojis", style="margin: 0 0 16px 0; color: var(--primary);"),
            Div(*emoji_buttons, cls="emoji-grid"),
            cls="emoji-modal-content"
        ),
        id="emojiModal",
        cls="emoji-modal"
    )

app, rt = fast_app(hdrs=[app_css])

@rt("/")
def get():
    return Titled("Social Media Formatter",
        Div(
            Header(),
            Toolbar(),
            Div(
                Textarea(
                    id="editor", 
                    placeholder="Paste your text here... Select text and click 'B' to bold.",
                    oninput="updateStats()"
                ),
                cls="editor-wrapper"
            ),
            AppFooter(),
            cls="app-container"
        ),
        Div(id="toast", cls="toast"),
        EmojiPicker(),
        client_logic 
    )

# ONLY run the server if running this file directly (Localhost)
# Vercel will ignore this block and just look for the 'app' variable above
if __name__ == '__main__':
    serve()
