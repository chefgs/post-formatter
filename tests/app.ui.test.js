'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const formatter = require('../js/formatter.js');

const APP_SCRIPT = fs.readFileSync(
    path.join(__dirname, '../js/app.js'),
    'utf8'
);
const CATALOG_EMOJI_CLASS = 'catalog-emoji';

class MockClassList {
    constructor(element) {
        this.element = element;
    }

    add(...names) {
        const classes = new Set(this.element.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => classes.add(name));
        this.element.className = Array.from(classes).join(' ');
    }

    remove(...names) {
        const blocked = new Set(names);
        this.element.className = this.element.className
            .split(/\s+/)
            .filter((name) => name && !blocked.has(name))
            .join(' ');
    }

    contains(name) {
        return this.element.className.split(/\s+/).filter(Boolean).includes(name);
    }
}

class MockElement {
    constructor({ id = '', className = '', dataset = {}, value = '' } = {}) {
        this.id = id;
        this.dataset = dataset;
        this.value = value;
        this.type = 'button';
        this.textContent = '';
        this._innerHTML = '';
        this.children = [];
        this.listeners = {};
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.className = className;
        this.classList = new MockClassList(this);
        this.focus = jest.fn();
        this.select = jest.fn(() => {
            this.selectionStart = 0;
            this.selectionEnd = this.value.length;
        });
    }

    addEventListener(type, handler) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(handler);
    }

    dispatchEvent(event) {
        const nextEvent = { ...event, target: this, currentTarget: this };
        (this.listeners[event.type] || []).forEach((handler) => handler.call(this, nextEvent));
    }

    click() {
        this.dispatchEvent({ type: 'click' });
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    set innerHTML(value) {
        this._innerHTML = String(value);
        this.children = [];
    }

    get innerHTML() {
        return this._innerHTML;
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.listeners = {};
        this.styleButtons = [];
        this.execCommand = jest.fn(() => true);
    }

    register(element) {
        if (element.id) this.elements.set(element.id, element);
        return element;
    }

    getElementById(id) {
        return this.elements.get(id);
    }

    querySelectorAll(selector) {
        if (selector === '[data-style]') return this.styleButtons;
        return [];
    }

    createElement() {
        return new MockElement();
    }

    addEventListener(type, handler) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(handler);
    }

    dispatch(type) {
        (this.listeners[type] || []).forEach((handler) => handler({ type, target: this }));
    }
}

function createHarness(initialText = '') {
    const document = new MockDocument();

    const register = (id, options = {}) => document.register(new MockElement({ id, ...options }));

    const editor = register('editor', { value: initialText });
    editor.type = 'textarea';
    editor.selectionStart = 0;
    editor.selectionEnd = 0;

    const audienceSelect = register('audienceSelect', { value: 'linkedin' });
    audienceSelect.type = 'select-one';

    [
        'charCount',
        'wordCount',
        'audienceMeta',
        'audienceCounter',
        'emojiSuggestions',
        'emojiCatalog',
        'hashtagPreview',
        'toast',
        'underlineBtn',
        'clearFormattingBtn',
        'autoEmojiBtn',
        'shortcodeBtn',
        'optimizeBtn',
        'copyBtn',
        'insertQuick0',
        'insertQuick1',
        'insertQuick2',
        'insertQuick3',
        'insertQuick4'
    ].forEach((id) => register(id));

    document.styleButtons = [
        'boldSans',
        'italicSans',
        'boldSerif',
        'boldItalicSerif',
        'italicSerif',
        'fraktur',
        'script',
        'circular',
        'square'
    ].map((style) => register(`style-${style}`, { dataset: { style } }));

    const navigator = {
        clipboard: {
            writeText: jest.fn(() => Promise.resolve())
        }
    };

    const window = {
        ...formatter,
        document,
        navigator
    };

    vm.runInNewContext(APP_SCRIPT, {
        window,
        document,
        navigator,
        console,
        setTimeout,
        clearTimeout
    }, { filename: 'app.js' });

    document.dispatch('DOMContentLoaded');

    return {
        document,
        window,
        navigator,
        editor,
        audienceSelect,
        charCount: document.getElementById('charCount'),
        wordCount: document.getElementById('wordCount'),
        audienceMeta: document.getElementById('audienceMeta'),
        audienceCounter: document.getElementById('audienceCounter'),
        emojiSuggestions: document.getElementById('emojiSuggestions'),
        emojiCatalog: document.getElementById('emojiCatalog'),
        hashtagPreview: document.getElementById('hashtagPreview'),
        toast: document.getElementById('toast'),
        underlineBtn: document.getElementById('underlineBtn'),
        clearFormattingBtn: document.getElementById('clearFormattingBtn'),
        autoEmojiBtn: document.getElementById('autoEmojiBtn'),
        shortcodeBtn: document.getElementById('shortcodeBtn'),
        optimizeBtn: document.getElementById('optimizeBtn'),
        copyBtn: document.getElementById('copyBtn'),
        insertQuick3: document.getElementById('insertQuick3'),
        boldSansBtn: document.getElementById('style-boldSans')
    };
}

async function flushPromises() {
    // The first tick settles clipboard.writeText(); the second settles the chained then/catch in copyText().
    await Promise.resolve();
    await Promise.resolve();
}

function extractCatalogEmoji(markup) {
    const match = new RegExp(`class="[^"]*\\b${CATALOG_EMOJI_CLASS}\\b[^"]*"[^>]*>([^<]+)`).exec(markup);
    return match ? match[1] : null;
}

describe('Browser UI wiring', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('renders the initial audience metadata, counters, suggestions, and catalog', () => {
        const ui = createHarness();

        expect(ui.charCount.textContent).toBe('0 chars');
        expect(ui.wordCount.textContent).toBe('0 words');
        expect(ui.audienceCounter.textContent).toBe('3000 / 3000 remaining');
        expect(ui.audienceMeta.textContent).toContain('LinkedIn');
        expect(ui.audienceMeta.textContent).toContain('What would you add?');
        expect(ui.emojiSuggestions.children.length).toBeGreaterThan(0);
        expect(ui.emojiCatalog.children.length).toBeGreaterThan(0);
        expect(ui.hashtagPreview.textContent).toBe('Hashtag suggestions appear as you write.');
    });

    test('formats a text selection and supports clearing the selection or the whole post', () => {
        const ui = createHarness('Hello world');

        ui.editor.selectionStart = 0;
        ui.editor.selectionEnd = 5;
        ui.boldSansBtn.click();

        expect(ui.editor.value).toBe(`${formatter.applyFormatToText('Hello', 'boldSans')} world`);
        expect(ui.toast.textContent).toBe('Selection formatted.');
        expect(ui.toast.classList.contains('visible')).toBe(true);

        ui.editor.selectionStart = 0;
        ui.editor.selectionEnd = formatter.applyFormatToText('Hello', 'boldSans').length;
        ui.clearFormattingBtn.click();
        expect(ui.editor.value).toBe('Hello world');
        expect(ui.toast.textContent).toBe('Removed formatting from the selection.');

        ui.editor.value = formatter.applyFormatToText('Hello world', 'script');
        ui.editor.selectionStart = 0;
        ui.editor.selectionEnd = 0;
        ui.clearFormattingBtn.click();
        expect(ui.editor.value).toBe('Hello world');
        expect(ui.toast.textContent).toBe('Removed formatting from the full post.');

        jest.advanceTimersByTime(2200);
        expect(ui.toast.classList.contains('visible')).toBe(false);
    });

    test('shows empty-state guidance when formatting or enhancing without content', () => {
        const ui = createHarness('');

        ui.boldSansBtn.click();
        expect(ui.toast.textContent).toBe('Select text to apply formatting.');

        ui.autoEmojiBtn.click();
        expect(ui.toast.textContent).toBe('Write something before auto-adding emojis.');

        ui.clearFormattingBtn.click();
        expect(ui.toast.textContent).toBe('Nothing to unformat yet.');
    });

    test('updates the post, hashtags, audience profile, and remaining counter for whole-post actions', () => {
        const ui = createHarness('Launch growth with the team :rocket:. Share the roadmap.');

        ui.shortcodeBtn.click();
        expect(ui.editor.value).toContain('🚀');
        expect(ui.toast.textContent).toBe('Shortcodes converted.');

        ui.autoEmojiBtn.click();
        expect(ui.editor.value).toContain('Launch 🚀');
        expect(ui.editor.value).toContain('growth 📈');
        expect(ui.hashtagPreview.textContent).toContain('#Launch');

        ui.audienceSelect.value = 'x';
        ui.audienceSelect.dispatchEvent({ type: 'change' });
        expect(ui.audienceMeta.textContent).toContain('X / Twitter');

        ui.optimizeBtn.click();
        expect(ui.editor.value).toContain('Thoughts?');
        expect(ui.editor.value.length).toBeLessThanOrEqual(formatter.audienceProfiles.x.charLimit);
        expect(ui.toast.textContent).toBe('X / Twitter post style applied.');

        ui.editor.value = 'a'.repeat(281);
        ui.editor.dispatchEvent({ type: 'input' });
        expect(ui.audienceCounter.textContent).toBe('0 / 280 remaining');
        expect(ui.audienceCounter.className).toBe('metric metric-danger');
    });

    test('supports quick inserts plus dynamic emoji suggestion and catalog insertion', () => {
        const ui = createHarness('Launch growth');

        ui.editor.selectionStart = ui.editor.selectionEnd = ui.editor.value.length;
        ui.insertQuick3.click();
        expect(ui.editor.value).toBe('Launch growth🚀 ');
        expect(ui.toast.textContent).toBe('Quick insert added.');

        ui.editor.dispatchEvent({ type: 'input' });

        const suggestionButton = ui.emojiSuggestions.children[0];
        suggestionButton.click();
        expect(ui.editor.value).toContain(`${suggestionButton.textContent} `);
        expect(ui.toast.textContent).toBe('Emoji added.');

        const catalogButton = ui.emojiCatalog.children[0];
        const catalogEmoji = extractCatalogEmoji(catalogButton.innerHTML);
        expect(catalogEmoji).not.toBeNull();
        catalogButton.click();
        expect(ui.editor.value).toContain(`${catalogEmoji} `);
        expect(ui.toast.textContent).toContain('emoji inserted.');
    });

    test('copies to the clipboard and falls back to document.execCommand when needed', async () => {
        const successUi = createHarness('Clipboard text');
        successUi.copyBtn.click();
        await flushPromises();

        expect(successUi.navigator.clipboard.writeText).toHaveBeenCalledWith('Clipboard text');
        expect(successUi.toast.textContent).toBe('Copied to clipboard.');

        const fallbackUi = createHarness('Fallback text');
        fallbackUi.navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
        fallbackUi.copyBtn.click();
        await flushPromises();

        expect(fallbackUi.document.execCommand).toHaveBeenCalledWith('copy');
        expect(fallbackUi.editor.select).toHaveBeenCalled();
        expect(fallbackUi.toast.textContent).toBe('Copied to clipboard.');
    });
});
