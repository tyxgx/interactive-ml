// Copies the Python backend into public/py so the browser (Pyodide) can run the exact
// same code the server runs. The output is committed so a frontend-only build works.
//   npm run sync:backend
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, "../../backend");
const out = path.resolve(here, "../public/py");

if (!fs.existsSync(backend)) {
  console.log("sync-backend: ../backend not found, using the committed public/py");
  process.exit(0);
}

const SKIP_PY = new Set(["deploy_hf_space.py", "conftest.py", "export_static_datasets.py"]);
const files = [];

fs.rmSync(path.join(out, "backend"), { recursive: true, force: true });
const copy = (rel) => {
  const dest = path.join(out, "backend", rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(backend, rel), dest);
  files.push(rel);
};

for (const f of fs.readdirSync(backend).sort()) {
  if (f.endsWith(".py") && !SKIP_PY.has(f)) copy(f);
}
for (const dir of ["knowledge_base", "data"]) {
  for (const f of fs.readdirSync(path.join(backend, dir)).sort()) copy(`${dir}/${f}`);
}

const wheels = fs.existsSync(path.join(out, "wheels"))
  ? fs.readdirSync(path.join(out, "wheels")).filter((f) => f.endsWith(".whl")).sort()
  : [];
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ files, wheels }, null, 2) + "\n");
console.log(`sync-backend: ${files.length} files, ${wheels.length} wheel(s) -> public/py`);

// Static dataset list + previews, so the picker works before the Python engine has booted.
const python = fs.existsSync(path.join(backend, "venv/bin/python"))
  ? path.join(backend, "venv/bin/python")
  : "python3";
const exported = spawnSync(
  python,
  ["export_static_datasets.py", path.join(out, "datasets.json")],
  { cwd: backend, stdio: "inherit" }
);
if (exported.status !== 0) {
  console.warn("sync-backend: could not regenerate datasets.json, keeping the committed copy");
}
