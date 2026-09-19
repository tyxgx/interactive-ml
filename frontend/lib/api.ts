// The backend runs in the browser (Pyodide, in a Web Worker) by default, so there is
// no server to wake up and no network round trip. Set NEXT_PUBLIC_ENGINE=server to use
// a hosted FastAPI server (NEXT_PUBLIC_API_URL) instead.
//
// API_BASE is still used for the AI assistant: it needs a secret API key, which can
// only live on a server.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const USE_SERVER = process.env.NEXT_PUBLIC_ENGINE === "server";

export type EngineStage = "idle" | "runtime" | "libraries" | "backend" | "ready" | "error";

type Pending = {
  resolve: (r: Response) => void;
  reject: (e: Error) => void;
  controller?: ReadableStreamDefaultController<Uint8Array>;
};

let worker: Worker | null = null;
let stage: EngineStage = USE_SERVER ? "ready" : "idle";
let engineError: string | null = null;
const listeners = new Set<() => void>();
const pending = new Map<number, Pending>();
let nextId = 1;

function setStage(next: EngineStage, error: string | null = null) {
  stage = next;
  engineError = error;
  if (error && typeof window !== "undefined") {
    console.error("[engine]", error);
    (window as unknown as { __engineError?: string }).__engineError = error;
  }
  listeners.forEach((l) => l());
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker("/py-worker.js", { type: "module" });
  setStage("runtime");

  worker.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg.type === "status") {
      if (msg.timings) console.info("[engine] import timings (s)", msg.timings);
      setStage(msg.stage as EngineStage, msg.message ?? null);
      return;
    }
    const entry = pending.get(msg.id);
    if (!entry) return;
    if (msg.type === "head") {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          entry.controller = controller;
        },
      });
      entry.resolve(new Response(stream, { status: msg.status, headers: msg.headers }));
    } else if (msg.type === "chunk") {
      entry.controller?.enqueue(msg.chunk);
    } else if (msg.type === "end") {
      entry.controller?.close();
      pending.delete(msg.id);
    } else if (msg.type === "error") {
      const error = new Error(msg.message);
      if (entry.controller) entry.controller.error(error);
      else entry.reject(error);
      pending.delete(msg.id);
    }
  };

  worker.onerror = (event) => {
    setStage("error", event.message || "The in-browser engine crashed");
    pending.forEach((p) => p.reject(new Error("The in-browser engine crashed")));
    pending.clear();
  };
  return worker;
}

/** Start loading the engine in the background (safe to call many times). */
export function startEngine() {
  if (!USE_SERVER && typeof window !== "undefined") ensureWorker();
}

export const engineStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getStage: () => stage,
  getError: () => engineError,
  // Server-side rendering has nothing loaded, and must match the first client render.
  getServerStage: (): EngineStage => "idle",
};

async function encodeBody(body: BodyInit | null | undefined) {
  if (body == null) return { bytes: new Uint8Array(0), contentType: null as string | null };
  if (typeof body === "string") {
    return { bytes: new TextEncoder().encode(body), contentType: null };
  }
  // FormData (file upload): let the browser build the multipart body and boundary.
  const req = new Request("http://engine.local/", { method: "POST", body });
  return {
    bytes: new Uint8Array(await req.arrayBuffer()),
    contentType: req.headers.get("content-type"),
  };
}

async function workerFetch(path: string, init: RequestInit): Promise<Response> {
  const w = ensureWorker();
  const [pathname, query = ""] = path.split("?");
  const headers = new Headers(init.headers);
  const { bytes, contentType } = await encodeBody(init.body);
  if (contentType) headers.set("content-type", contentType);

  const id = nextId++;
  return new Promise<Response>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage(
      {
        type: "request",
        id,
        method: (init.method ?? "GET").toUpperCase(),
        path: pathname,
        query,
        headers: [...headers.entries()],
        body: bytes,
      },
      [bytes.buffer]
    );
  });
}

type StaticDatasets = {
  list: unknown[];
  info: Record<string, unknown> & Record<string, { schema: { target?: string } }>;
};
let staticDatasets: Promise<StaticDatasets | null> | null = null;

function loadStaticDatasets(): Promise<StaticDatasets | null> {
  if (!staticDatasets) {
    staticDatasets = fetch("/py/datasets.json")
      .then((r) => (r.ok ? (r.json() as Promise<StaticDatasets>) : null))
      .catch(() => null);
  }
  return staticDatasets;
}

const json = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

/** The dataset picker and previews are static, so they work before the engine boots. */
async function tryStatic(path: string, init: RequestInit): Promise<Response | null> {
  if ((init.method ?? "GET").toUpperCase() !== "GET") return null;
  const [pathname, query = ""] = path.split("?");
  if (pathname !== "/datasets" && !pathname.startsWith("/dataset/")) return null;

  const data = await loadStaticDatasets();
  if (!data) return null;
  if (pathname === "/datasets") return json(data.list);

  const name = decodeURIComponent(pathname.slice("/dataset/".length));
  const target = new URLSearchParams(query).get("target_column") ?? "target";
  const entry = (data.list as { name: string; default_target: string }[]).find((d) => d.name === name);
  // Only the default target is precomputed; any other target column goes to the engine.
  if (entry && entry.default_target === target) return json(data.info[name]);
  return null;
}

/** Same signature as fetch, but the path is relative to the API root, e.g. "/datasets". */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  // If the in-browser engine could not start (old browser, blocked CDN), use the server.
  if (USE_SERVER || stage === "error") return fetch(`${API_BASE}${path}`, init);
  const cached = await tryStatic(path, init);
  return cached ?? workerFetch(path, init);
}

/** Always goes to the hosted server (used for the AI assistant, which needs a secret key). */
export function remoteFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, init);
}
