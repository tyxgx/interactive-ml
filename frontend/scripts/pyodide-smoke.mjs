// Runs the shipped public/py backend inside real Pyodide (the same runtime the browser
// uses) and exercises the whole pipeline. Guards against a backend change that works
// on the server but breaks in the browser.
//   node scripts/pyodide-smoke.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(here, "../public/py");
const pyodideDir = path.resolve(here, "../node_modules/pyodide");
const CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
const PACKAGES = [
  "numpy", "pandas", "scikit-learn", "scipy", "joblib", "threadpoolctl",
  "fastapi", "starlette", "pydantic", "anyio",
];

const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);
const fail = (m) => {
  console.error(`FAIL: ${m}`);
  process.exit(1);
};

// The npm package ships only the core; fetch the wheels for our packages (and their
// dependencies) next to it once, then Pyodide loads them from disk.
const lock = JSON.parse(fs.readFileSync(path.join(pyodideDir, "pyodide-lock.json"), "utf8")).packages;
const norm = (n) => n.toLowerCase().replace(/_/g, "-");
const needed = new Set();
const add = (name) => {
  const key = Object.keys(lock).find((k) => norm(k) === norm(name));
  if (!key || needed.has(key)) return;
  needed.add(key);
  (lock[key].depends || []).forEach(add);
};
PACKAGES.forEach(add);
for (const key of needed) {
  const file = lock[key].file_name;
  const dest = path.join(pyodideDir, file);
  if (fs.existsSync(dest)) continue;
  const res = await fetch(CDN + file);
  if (!res.ok) fail(`could not download ${file}: ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}
log(`packages ready (${needed.size})`);

const py = await loadPyodide();
await py.loadPackage(PACKAGES);
log("pyodide + libraries loaded");

const manifest = JSON.parse(fs.readFileSync(path.join(pub, "manifest.json"), "utf8"));
const site = py.runPython("import site; site.getsitepackages()[0]");
for (const wheel of manifest.wheels) {
  py.unpackArchive(new Uint8Array(fs.readFileSync(path.join(pub, "wheels", wheel))), "wheel", { extractDir: site });
}
for (const f of manifest.files) {
  const dir = path.posix.dirname(f);
  if (dir !== ".") py.FS.mkdirTree(`/app/${dir}`);
  else py.FS.mkdirTree("/app");
  py.FS.writeFile(`/app/${f}`, new Uint8Array(fs.readFileSync(path.join(pub, "backend", f))));
}
py.runPython('import sys, os\nsys.path.insert(0, "/app")\nos.chdir("/app")');
const runner = py.pyimport("pyodide_runner");
await runner.prepare();
log("backend imported");

async function call(method, url, body) {
  let status = 0;
  const chunks = [];
  const emit = (m) => {
    const o = m.toJs({ dict_converter: Object.fromEntries });
    m.destroy();
    if (o.type === "http.response.start") status = o.status;
    else if (o.type === "http.response.body") chunks.push(Buffer.from(o.body));
  };
  const [pathname, query = ""] = url.split("?");
  await runner.handle(
    method, pathname, query,
    [["content-type", "application/json"]],
    body ? new TextEncoder().encode(JSON.stringify(body)) : new Uint8Array(0),
    emit
  );
  return { status, text: Buffer.concat(chunks).toString() };
}
const json = async (method, url, body) => {
  const r = await call(method, url, body);
  if (r.status !== 200) fail(`${method} ${url} -> ${r.status} ${r.text.slice(0, 200)}`);
  return JSON.parse(r.text);
};
const stage = async (sid, name, body) => {
  const r = await json("POST", `/pipeline/${sid}/${name}`, body);
  if (r.status !== "done") fail(`${name} -> ${r.status}: ${JSON.stringify(r.summary).slice(0, 200)}`);
  return r.summary;
};

const datasets = await json("GET", "/datasets");
if (datasets.length !== 5) fail(`expected 5 datasets, got ${datasets.length}`);

for (const [dataset, algo, extras] of [
  ["iris", "random_forest", ["learning-curve", "roc", "importance"]],
  ["california_housing", "linear_regression", ["residuals"]],
]) {
  const start = await json("POST", "/pipeline/start", { dataset, target_column: "target" });
  if (start.status !== "done") fail(`start ${dataset}`);
  const sid = start.session_id;
  for (const s of ["split", "preprocess"]) await stage(sid, s);
  await stage(sid, "train", { algorithm: algo });
  await stage(sid, "predict");
  await stage(sid, "evaluate");
  for (const e of extras) await stage(sid, e);
  log(`${dataset}: full pipeline + ${extras.join(", ")} ok`);
}

const start = await json("POST", "/pipeline/start", { dataset: "iris", target_column: "target" });
await stage(start.session_id, "split");
await stage(start.session_id, "preprocess");
const streamed = await call("POST", `/pipeline/${start.session_id}/compare/stream`);
const events = streamed.text.trim().split("\n").map((l) => JSON.parse(l));
if (events[0].type !== "start" || events.at(-1).type !== "done") fail("compare/stream framing");
if (events.filter((e) => e.type === "result").length !== 6) fail("compare/stream results");
log("compare/stream ok");

log("PASS");
