'use strict';

const fs = require('fs');
const path = require('path');

describe('html/index.html asset wiring', () => {
    test('embeds the formatter and app scripts so Vercel does not need separate JS asset requests', () => {
        const html = fs.readFileSync(
            path.join(__dirname, '../html/index.html'),
            'utf8'
        );

        expect(html).toContain('<script data-inline-source="js/formatter.js">');
        expect(html).toContain('<script data-inline-source="js/app.js">');
        expect(html).toContain('function applyFormatToText(text, type)');
        expect(html).toContain("document.addEventListener('DOMContentLoaded'");
        expect(html).not.toContain('<script src="../js/formatter.js"></script>');
        expect(html).not.toContain('<script src="../js/app.js"></script>');
        expect(html).not.toContain('<script src="/js/formatter.js"></script>');
        expect(html).not.toContain('<script src="/js/app.js"></script>');
    });
});
