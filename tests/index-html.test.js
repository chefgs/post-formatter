'use strict';

const fs = require('fs');
const path = require('path');

describe('html/index.html asset wiring', () => {
    test('loads scripts via relative paths so the UI works when opened directly from disk', () => {
        const html = fs.readFileSync(
            path.join(__dirname, '../html/index.html'),
            'utf8'
        );

        expect(html).toContain('<script src="../js/formatter.js"></script>');
        expect(html).toContain('<script src="../js/app.js"></script>');
        expect(html).not.toContain('<script src="/js/formatter.js"></script>');
        expect(html).not.toContain('<script src="/js/app.js"></script>');
    });
});
