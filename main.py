from pathlib import Path

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
    body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: #191919; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
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
    
    .footer { padding: 16px 32px; background: #fff; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .btn-primary { background: var(--primary); color: white; border: none; padding: 12px 28px; border-radius: 30px; font-weight: 600; cursor: pointer; white-space: nowrap; }
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
    .emoji-modal-header { display: flex; justify-content: space-between; align-items: center; margin: 0 0 16px 0; }
    .emoji-modal-header h2 { margin: 0; color: var(--primary); font-size: 1.2rem; }
    .emoji-close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; padding: 0; line-height: 1; }
    .emoji-close-btn:hover { color: #000; }
    @media (max-width: 600px) {
        body { padding: 0; align-items: stretch; }
        .app-container { border-radius: 0; min-height: 100vh; max-width: 100%; border: none; }
        .toolbar-group { padding: 10px; gap: 5px; justify-content: center; }
        .label { display: none; }
        textarea { padding: 16px; font-size: 1rem; height: 280px; }
        .footer { padding: 12px 16px; flex-direction: column; align-items: stretch; gap: 10px; }
        .btn-primary { width: 100%; text-align: center; padding: 14px 20px; border-radius: 12px; }
    }
""")


# --- 2. JAVASCRIPT LOGIC ---
formatter_core = Script(Path(__file__).with_name("js").joinpath("formatter.js").read_text(encoding="utf-8"))

client_logic = Script(r"""
    const editor = document.getElementById('editor');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');

    function getSelection() {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        return { start, end, text: editor.value.substring(start, end) };
    }

    function replaceSelection(newText) {
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + newText + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + newText.length;
        editor.focus();
        updateStats();
    }

    function applyFormat(type) {
        const sel = getSelection();
        if (!sel.text) return;

        if (type === 'underline') {
            let underlined = '';
            for (const char of sel.text) underlined += char + '\u0332';
            replaceSelection(underlined);
            return;
        }

        replaceSelection(applyFormatToText(sel.text, type));
    }

    function clearFormat() {
        const sel = getSelection();
        if (!sel.text) return;
        replaceSelection(clearFormatText(sel.text));
    }

    function insertChar(char) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + char + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + char.length;
        editor.focus();
        updateStats();
    }

    function formatCodeBlock() {
        const sel = getSelection();
        if (!sel.text) return;
        replaceSelection('```\n' + sel.text + '\n```');
        showToast('Code block formatted!');
    }

    function formatInlineCode() {
        const sel = getSelection();
        if (!sel.text) return;
        replaceSelection('`' + sel.text + '`');
        showToast('Inline code formatted!');
    }

    function autoEmojify() {
        editor.value = autoEmojifyText(editor.value);
        updateStats();
        showToast('Magic emojis applied!');
    }

    function convertShortcodes() {
        editor.value = convertShortcodesText(editor.value);
        updateStats();
        showToast('Shortcodes converted!');
    }

    function showEmojiPicker() {
        const modal = document.getElementById('emojiModal');
        if (modal) modal.classList.add('visible');
    }

    function closeEmojiPicker() {
        const modal = document.getElementById('emojiModal');
        if (modal) modal.classList.remove('visible');
    }

    function insertEmoji(emoji) {
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + emoji + ' ' + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + emoji.length + 1;
        editor.focus();
        closeEmojiPicker();
        updateStats();
    }

    function copyText() {
        if (!editor.value) return;
        navigator.clipboard.writeText(editor.value).then(() => {
            showToast('Copied to clipboard!');
        }).catch(() => {
            editor.select();
            document.execCommand('copy');
            showToast('Copied!');
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 2500);
    }

    function updateStats() {
        const value = editor.value;
        charCount.innerText = value.length + ' chars';
        if (wordCount) {
            const words = value.trim().split(/\s+/).filter(Boolean).length;
            wordCount.innerText = words + ' words';
        }
    }

    editor.addEventListener('input', updateStats);
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('emojiModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) closeEmojiPicker();
            });
        }
        updateStats();
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
            ToolButton("Clear", "clearFormat()", "Clear All Styles"),
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
            ToolButton("✅ Check", "insertChar('✅ ')", "Check"),
            ToolButton("🔥 Fire", "insertChar('🔥 ')", "Fire"),
            ToolButton("🚀 Rocket", "insertChar('🚀 ')", "Rocket"),
            ToolButton("🔄 :code:", "convertShortcodes()", "Convert shortcodes to emoji"),
            cls="toolbar-group",
            style="background: #fafafa;"
        )
    )

def AppFooter():
    return Div(
        Div(
            Span("0 chars", id="charCount"),
            Span("0 words", id="wordCount"),
            cls="stats",
            style="color: #666; font-size: 0.85rem; display: flex; gap: 15px;"
        ),
        Button("Copy", onclick="copyText()", cls="btn-primary"),
        cls="footer"
    )

def EmojiPicker():
    # Popular emojis
    emojis = ["🚀", "🔥", "💡", "🎯", "📈", "💰", "🤝", "✅", "⚡", "👍", "💯", "🌟", "😊", "🎉", "📚", "💻", "🛠️", "⏰", "📞", "📧"]
    emoji_buttons = [Button(emoji, onclick=f"insertEmoji('{emoji}')", cls="emoji-btn", type="button") for emoji in emojis]
    
    return Div(
        Div(
            Div(
                H2("Popular Emojis"),
                Button("✕", onclick="closeEmojiPicker()", cls="emoji-close-btn", type="button", aria_label="Close"),
                cls="emoji-modal-header"
            ),
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
        formatter_core,
        client_logic 
    )

# ONLY run the server if running this file directly (Localhost)
# Vercel will ignore this block and just look for the 'app' variable above
if __name__ == '__main__':
    serve()
