from pathlib import Path

from fasthtml.common import FileResponse, fast_app, serve
from starlette.responses import HTMLResponse, PlainTextResponse


ROOT_DIR = Path(__file__).resolve().parent
INDEX_HTML = ROOT_DIR / "html" / "index.html"
JS_DIR = ROOT_DIR / "js"
JS_FILES = {
    "formatter.js": JS_DIR / "formatter.js",
    "app.js": JS_DIR / "app.js",
}

app, rt = fast_app(key_fname="/tmp/post-formatter.sesskey")


def render_index_html():
    html = INDEX_HTML.read_text(encoding="utf-8")
    formatter_js = JS_FILES["formatter.js"].read_text(encoding="utf-8")
    app_js = JS_FILES["app.js"].read_text(encoding="utf-8")
    return (
        html
        .replace('<script src="../js/formatter.js"></script>', f"<script>\n{formatter_js}\n</script>")
        .replace('<script src="../js/app.js"></script>', f"<script>\n{app_js}\n</script>")
    )


@rt("/")
def index():
    return HTMLResponse(render_index_html())


@rt("/html/index.html")
def html_index():
    return HTMLResponse(render_index_html())


@rt("/js/{filename}")
def js_asset(filename: str):
    js_file = JS_FILES.get(filename)
    if js_file is None:
        return PlainTextResponse("Not found", status_code=404)
    return FileResponse(str(js_file), media_type="application/javascript")


if __name__ == "__main__":
    serve()
