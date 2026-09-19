"""Runs the FastAPI app inside Pyodide (Python in the browser) without a web server.

The frontend sends {method, path, body} to a Web Worker, which calls `handle` below.
Nothing here is imported by the normal server.
"""

import sys


def _patch_threads() -> None:
    """Pyodide has no threads. Make Starlette/FastAPI run sync endpoints inline."""
    import anyio.to_thread

    async def run_inline(func, *args, **kwargs):
        return func(*args, **kwargs)

    async def iterate_inline(iterator):
        for item in iterator:
            yield item

    async def run_sync(func, *args, abandon_on_cancel=False, cancellable=None, limiter=None):
        return func(*args)

    anyio.to_thread.run_sync = run_sync
    for name, module in list(sys.modules.items()):
        if not name.startswith(("fastapi", "starlette")):
            continue
        if hasattr(module, "run_in_threadpool"):
            module.run_in_threadpool = run_inline
        if hasattr(module, "iterate_in_threadpool"):
            module.iterate_in_threadpool = iterate_inline


def load_app():
    import main  # noqa: WPS433  (imported late so patching sees fastapi/starlette loaded)

    _patch_threads()
    return main.app


_app = None


async def prepare():
    """Import the app and warm it up so the first real request is fast."""
    global _app
    if _app is None:
        _app = load_app()


def _py(value):
    """JS values arrive as proxies (and JS null as JsNull); convert to plain Python."""
    if type(value).__name__ in ("JsNull", "JsUndefined"):
        return None
    if hasattr(value, "to_py"):
        return value.to_py()
    return value


async def handle(method, path, query, headers, body, emit):
    """Run one request through the ASGI app. `emit(message_dict)` gets each ASGI message."""
    global _app
    if _app is None:
        _app = load_app()

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": query.encode(),
        "root_path": "",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (_py(headers) or [])],
        "client": ("127.0.0.1", 0),
        "server": ("localhost", 80),
    }
    raw = _py(body)
    body_bytes = bytes(raw) if raw is not None else b""
    delivered = False

    async def receive():
        nonlocal delivered
        if not delivered:
            delivered = True
            return {"type": "http.request", "body": body_bytes, "more_body": False}
        return {"type": "http.disconnect"}

    async def send(message):
        emit(message)

    await _app(scope, receive, send)
