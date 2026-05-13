from pathlib import Path

from fasthtml.common import FileResponse, fast_app, serve
from starlette.responses import PlainTextResponse


ROOT_DIR = Path(__file__).resolve().parent
INDEX_HTML = ROOT_DIR / "html" / "index.html"
JS_DIR = ROOT_DIR / "js"
JS_FILES = {
    "formatter.js": JS_DIR / "formatter.js",
    "app.js": JS_DIR / "app.js",
}

app, rt = fast_app(key_fname="/tmp/post-formatter.sesskey")


@rt("/")
def get():
    return FileResponse(str(INDEX_HTML))


@rt("/html/index.html")
def get():
    return FileResponse(str(INDEX_HTML))


@rt("/js/{filename}")
def get(filename: str):
    js_file = JS_FILES.get(filename)
    if js_file is None:
        return PlainTextResponse("Not found", status_code=404)
    return FileResponse(str(js_file), media_type="application/javascript")


if __name__ == "__main__":
    serve()
