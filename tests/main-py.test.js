'use strict';

const fs = require('fs');
const path = require('path');

describe('main.py entrypoint', () => {
    test('serves the browser app entrypoint and keeps the session key outside the repo', () => {
        const mainPy = fs.readFileSync(
            path.join(__dirname, '../main.py'),
            'utf8'
        );

        expect(mainPy).toContain('INDEX_HTML = ROOT_DIR / "html" / "index.html"');
        expect(mainPy).toContain('app, rt = fast_app(key_fname="/tmp/post-formatter.sesskey")');
        expect(mainPy).toContain('def render_index_html():');
        expect(mainPy).toContain('return HTMLResponse(render_index_html())');
        expect(mainPy).toContain('<script src="../js/formatter.js"></script>');
        expect(mainPy).toContain('<script src="../js/app.js"></script>');
        expect(mainPy).toContain('@rt("/js/{filename}")');
        expect(mainPy).toContain('"formatter.js": JS_DIR / "formatter.js"');
        expect(mainPy).toContain('"app.js": JS_DIR / "app.js"');
        expect(mainPy).toContain('media_type="application/javascript"');
    });
});
