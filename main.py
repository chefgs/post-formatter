from pathlib import Path

from fasthtml.common import FileResponse, fast_app, serve


ROOT_DIR = Path(__file__).resolve().parent
INDEX_HTML = ROOT_DIR / "html" / "index.html"

app, rt = fast_app(key_fname="/tmp/post-formatter.sesskey")


@rt("/")
def get():
    return FileResponse(str(INDEX_HTML))


if __name__ == "__main__":
    serve()
