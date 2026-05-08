(() => {
    const {
        applyFormatToText,
        clearFormatText,
        autoEmojifyText,
        convertShortcodesText,
        suggestEmojisForText,
        formatPostForAudience,
        generateHashtags,
        popularEmojiList,
        audienceProfiles
    } = window;

    function byId(id) {
        return document.getElementById(id);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const editor = byId('editor');
        const audienceSelect = byId('audienceSelect');
        const charCount = byId('charCount');
        const wordCount = byId('wordCount');
        const audienceMeta = byId('audienceMeta');
        const audienceCounter = byId('audienceCounter');
        const emojiSuggestions = byId('emojiSuggestions');
        const emojiCatalog = byId('emojiCatalog');
        const hashtagPreview = byId('hashtagPreview');
        const toast = byId('toast');

        function currentProfile() {
            return audienceProfiles[audienceSelect.value] || audienceProfiles.linkedin;
        }

        function showToast(message) {
            toast.textContent = message;
            toast.classList.add('visible');
            clearTimeout(showToast.timeoutId);
            showToast.timeoutId = setTimeout(() => toast.classList.remove('visible'), 2200);
        }

        function getSelection() {
            return {
                start: editor.selectionStart,
                end: editor.selectionEnd,
                text: editor.value.substring(editor.selectionStart, editor.selectionEnd)
            };
        }

        function replaceRange(start, end, nextText) {
            editor.value = `${editor.value.slice(0, start)}${nextText}${editor.value.slice(end)}`;
            editor.selectionStart = editor.selectionEnd = start + nextText.length;
            editor.focus();
            updateUI();
        }

        function replaceSelection(nextText) {
            const selection = getSelection();
            replaceRange(selection.start, selection.end, nextText);
        }

        function transformSelection(transformer, emptyMessage, successMessage) {
            const selection = getSelection();
            if (!selection.text) {
                showToast(emptyMessage);
                return;
            }
            replaceSelection(transformer(selection.text));
            if (successMessage) showToast(successMessage);
        }

        function applyStyle(type) {
            transformSelection(
                (text) => applyFormatToText(text, type),
                'Select text to apply formatting.',
                'Selection formatted.'
            );
        }

        function underlineText(text) {
            return Array.from(text).map((char) => `${char}\u0332`).join('');
        }

        function applyUnderline() {
            transformSelection(underlineText, 'Select text to underline.', 'Underline applied.');
        }

        function clearFormatting() {
            const selection = getSelection();
            if (selection.text) {
                replaceSelection(clearFormatText(selection.text));
                showToast('Removed formatting from the selection.');
                return;
            }

            if (!editor.value.trim()) {
                showToast('Nothing to unformat yet.');
                return;
            }

            editor.value = clearFormatText(editor.value);
            updateUI();
            showToast('Removed formatting from the full post.');
        }

        function transformWholePost(transformer, emptyMessage, successMessage) {
            if (!editor.value.trim()) {
                showToast(emptyMessage);
                return;
            }
            const start = editor.selectionStart;
            const nextText = transformer(editor.value);
            editor.value = nextText;
            editor.selectionStart = editor.selectionEnd = Math.min(start, nextText.length);
            editor.focus();
            updateUI();
            if (successMessage) showToast(successMessage);
        }

        function insertAtCursor(text) {
            const selection = getSelection();
            replaceRange(selection.start, selection.end, text);
        }

        function copyText() {
            if (!editor.value.trim()) {
                showToast('Write something before copying.');
                return;
            }
            navigator.clipboard.writeText(editor.value)
                .then(() => showToast('Copied to clipboard.'))
                .catch(() => {
                    editor.select();
                    document.execCommand('copy');
                    showToast('Copied to clipboard.');
                });
        }

        function renderEmojiSuggestions() {
            const suggestions = suggestEmojisForText(editor.value, 6, audienceSelect.value);
            emojiSuggestions.innerHTML = '';
            suggestions.forEach((emoji) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'chip-button';
                button.textContent = emoji;
                button.addEventListener('click', () => {
                    insertAtCursor(`${emoji} `);
                    showToast('Emoji added.');
                });
                emojiSuggestions.appendChild(button);
            });
        }

        function renderEmojiCatalog() {
            emojiCatalog.innerHTML = '';
            popularEmojiList
                .filter((item) => item.audiences.includes(audienceSelect.value))
                .forEach((item) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'catalog-item';
                    button.innerHTML = `<span class="catalog-emoji">${item.emoji}</span><span>${item.label}</span>`;
                    button.addEventListener('click', () => {
                        insertAtCursor(`${item.emoji} `);
                        showToast(`${item.label} emoji inserted.`);
                    });
                    emojiCatalog.appendChild(button);
                });
        }

        function renderHashtagPreview() {
            const hashtags = generateHashtags(editor.value, audienceSelect.value);
            hashtagPreview.textContent = hashtags.length ? hashtags.join(' ') : 'Hashtag suggestions appear as you write.';
        }

        function renderAudienceMeta() {
            const profile = currentProfile();
            audienceMeta.textContent = `${profile.label}: ${profile.tone}. Suggested CTA: ${profile.cta}`;
        }

        function updateStats() {
            const text = editor.value;
            const chars = text.length;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const profile = currentProfile();
            const remaining = profile.charLimit - chars;

            charCount.textContent = `${chars} chars`;
            wordCount.textContent = `${words} words`;
            audienceCounter.textContent = `${remaining >= 0 ? remaining : 0} / ${profile.charLimit} remaining`;
            audienceCounter.className = remaining < 0 ? 'metric metric-danger' : 'metric';
        }

        function updateUI() {
            updateStats();
            renderAudienceMeta();
            renderEmojiSuggestions();
            renderEmojiCatalog();
            renderHashtagPreview();
        }

        document.querySelectorAll('[data-style]').forEach((button) => {
            button.addEventListener('click', () => applyStyle(button.dataset.style));
        });

        byId('underlineBtn').addEventListener('click', applyUnderline);
        byId('clearFormattingBtn').addEventListener('click', clearFormatting);
        byId('autoEmojiBtn').addEventListener('click', () => {
            transformWholePost(autoEmojifyText, 'Write something before auto-adding emojis.', 'Keyword emojis added.');
        });
        byId('shortcodeBtn').addEventListener('click', () => {
            transformWholePost(convertShortcodesText, 'Write something before converting shortcodes.', 'Shortcodes converted.');
        });
        byId('optimizeBtn').addEventListener('click', () => {
            const profile = currentProfile();
            transformWholePost(
                (text) => formatPostForAudience(text, audienceSelect.value),
                'Write something before optimizing the post.',
                `${profile.label} post style applied.`
            );
        });
        byId('copyBtn').addEventListener('click', copyText);

        ['• ', '✅ ', '🔥 ', '🚀 ', '👉 '].forEach((item, index) => {
            const button = byId(`insertQuick${index}`);
            button.addEventListener('click', () => {
                insertAtCursor(item);
                showToast('Quick insert added.');
            });
        });

        editor.addEventListener('input', updateUI);
        audienceSelect.addEventListener('change', updateUI);

        updateUI();
    });
})();
