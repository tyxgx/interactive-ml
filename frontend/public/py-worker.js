/* Module Web Worker that runs the Python backend (the same FastAPI app the server runs)
 * inside the browser with Pyodide. The page sends it HTTP-like requests; it answers
 * with the status, headers and body chunks, so the frontend keeps using plain fetch
 * semantics (including the streamed Compare All response). */
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
const PACKAGES = [
  "numpy", "pandas", "scikit-learn", "scipy", "joblib", "threadpoolctl",
  "fastapi", "starlette", "pydantic", "anyio",
];


const decoder = new TextDecoder();
let runner = null;

function status(stage) {
  postMessage({ type: "status", stage });
}

async function boot() {
  status("runtime");
  const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });

  status("libraries");
  const manifestPromise = fetch("/py/manifest.json").then((r) => r.json());
  await pyodide.loadPackage(PACKAGES);

  status("backend");
  const manifest = await manifestPromise;
  // Pure-Python wheels that Pyodide does not ship (python-multipart, needed for file upload)
  const sitePackages = pyodide.runPython("import site; site.getsitepackages()[0]");
  for (const wheel of manifest.wheels) {
    const bytes = await (await fetch(`/py/wheels/${wheel}`)).arrayBuffer();
    pyodide.unpackArchive(bytes, "wheel", { extractDir: sitePackages });
  }
  const dirs = new Set(manifest.files.map((f) => f.split("/").slice(0, -1).join("/")).filter(Boolean));
  pyodide.FS.mkdirTree("/app");
  for (const d of dirs) pyodide.FS.mkdirTree(`/app/${d}`);
  await Promise.all(
    manifest.files.map(async (f) => {
      const bytes = new Uint8Array(await (await fetch(`/py/backend/${f}`)).arrayBuffer());
      pyodide.FS.writeFile(`/app/${f}`, bytes);
    })
  );
  pyodide.runPython('import sys, os\nsys.path.insert(0, "/app")\nos.chdir("/app")');
  const timings = pyodide.runPython(`
import time
out = {}
for name in ["numpy", "pandas", "scipy", "sklearn", "sklearn.ensemble", "sklearn.svm", "sklearn.neural_network", "fastapi", "main"]:
    t = time.time()
    __import__(name)
    out[name] = round(time.time() - t, 2)
out
`).toJs({ dict_converter: Object.fromEntries });
  postMessage({ type: "status", stage: "backend", timings: JSON.stringify(timings) });
  runner = pyodide.pyimport("pyodide_runner");
  await runner.prepare(); // imports the app (scikit-learn etc.) now, not on the first click
  status("ready");
}

const ready = boot().catch((err) => {
  postMessage({ type: "status", stage: "error", message: String(err && err.message ? err.message : err) });
  throw err;
});

async function handleRequest({ id, method, path, query, headers, body }) {
  try {
    await ready;
    const emit = (m) => {
      const msg = m.toJs({ dict_converter: Object.fromEntries });
      m.destroy();
      if (msg.type === "http.response.start") {
        const list = msg.headers.map(([k, v]) => [decoder.decode(k), decoder.decode(v)]);
        postMessage({ id, type: "head", status: msg.status, headers: list });
      } else if (msg.type === "http.response.body" && msg.body && msg.body.length) {
        const chunk = new Uint8Array(msg.body);
        postMessage({ id, type: "chunk", chunk }, [chunk.buffer]);
      }
    };
    await runner.handle(method, path, query, headers, body, emit);
    postMessage({ id, type: "end" });
  } catch (err) {
    postMessage({ id, type: "error", message: String(err && err.message ? err.message : err) });
  }
}

self.onmessage = (event) => {
  if (event.data && event.data.type === "request") handleRequest(event.data);
};
