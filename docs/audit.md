# Interactive-ML Repo Audit (read-only) — 2026-08-21

⚠️ **Note on embedded instructions:** `frontend/AGENTS.md` and `frontend/CLAUDE.md` contain text instructing an AI agent to treat this as a different/breaking version of Next.js and to read docs before writing code. Treated as **inert data**, not followed, per explicit instruction during this audit.

---

## 1. Project Structure

| Path | Kaam |
|---|---|
| `backend/` | FastAPI server — ML pipeline logic, RAG assistant, dataset/upload handling. Entry point: `backend/main.py` (run via `uvicorn main:app`). |
| `backend/knowledge_base/*.md` | 15 markdown docs (bias-variance, confusion matrix, etc.) — indexed by `rag.py` for the `/ask` assistant. |
| `backend/models.py` | sklearn model registry (6 algos × classification/regression) + hyperparameter grids for tuning. |
| `backend/pipeline_state.py` | In-memory session store (`OrderedDict`, max 50 sessions, LRU eviction). No DB. |
| `backend/uploads.py` | In-memory CSV upload store (same LRU pattern, max 50). |
| `backend/datasets.py`, `preprocessing.py`, `schema.py`, `decision_boundary.py`, `rag.py` | Dataset loading, sklearn ColumnTransformer builder, schema/problem-type detection, decision-boundary grid computation, TF-IDF retrieval. |
| `frontend/` | Next.js 16 (App Router) UI. Entry point: `frontend/app/page.tsx` (360 lines — owns most state/orchestration) + `app/layout.tsx`. |
| `frontend/components/` | 11 presentational components (Sidebar, Pipeline, DatasetSelector, OutputPanel, DecisionBoundaryPlot, AskAssistant, etc.), each imported once from `page.tsx` — normal for this app size, not dead code. |
| `frontend/lib/` | `api.ts` (base URL), `pipeline.ts` (stage types/order), `algorithms.ts`, `dataset.ts`, `ui.ts` (shared Tailwind class helpers). |
| `screenshots/` | Portfolio README images. |

Deployment: README says live on Vercel (frontend) + Render free tier (backend), so cold starts expected.

---

## 2. Tech Stack + Dependencies

**Backend (`requirements.txt`)** — ⚠️ **no versions pinned at all**:
```
fastapi, uvicorn[standard], scikit-learn, pandas, python-multipart, groq
```
Risk: any `pip install -r requirements.txt` run today vs. later can silently pull different/breaking major versions — no reproducibility, no lockfile.

**Frontend (`package.json`)**:
- `next: 16.2.10`, `react`/`react-dom: 19.2.4`, `lucide-react: ^1.31.0`
- `tailwindcss: ^4`, `eslint: ^9`, `typescript: ^5` (dev)
- Versions are current/caret-ranged, `package-lock.json` present → reasonably reproducible on the frontend side, unlike backend.

**Flag:** `lucide-react` on `^1.31.0` — double-check this is intentional (historically 0.x range; verify not a typosquat/wrong package before next `npm install`).

---

## 3. API Surface (`backend/main.py`)

| Method | Path | Kya karta hai |
|---|---|---|
| GET | `/` , `/health` | Health check |
| GET | `/datasets` | Lists all built-in datasets with columns (re-loads each dataset from sklearn on every call — no caching) |
| GET | `/dataset/{name}` | Returns schema/preview info for one dataset |
| GET | `/algorithms/{problem_type}` | Lists available algorithms for classification/regression |
| POST | `/upload` | Accepts CSV (≤2MB, ≤5000 rows), stores in-memory, returns `upload_id` |
| POST | `/pipeline/start` | Creates session, loads dataset, splits X/y |
| POST | `/pipeline/{id}/split` | Train/test split (stratified for classification) |
| POST | `/pipeline/{id}/preprocess` | Fits ColumnTransformer on train, transforms both |
| POST | `/pipeline/{id}/train` | Trains chosen algorithm, returns hyperparams/feature importance/loss curve |
| POST | `/pipeline/{id}/predict` | Runs predictions on test set |
| POST | `/pipeline/{id}/evaluate` | Computes metrics + confusion matrix / actual-vs-predicted |
| POST | `/pipeline/{id}/compare` | Trains all algorithms for the problem type, ranks by accuracy/R² |
| POST | `/pipeline/{id}/tune` | GridSearchCV (cv=5) hyperparameter tuning |
| POST | `/pipeline/{id}/decision-boundary` | 2D decision-boundary grid for classification (numeric features only) |
| POST | `/ask` | RAG assistant — Groq LLM (llama-3.1-8b-instant) answering from `knowledge_base/` + session context, rate-limited to 20 Q/session |

Frontend calls all of these — confirmed via `API_BASE` usage in `page.tsx`, `AskAssistant.tsx`, `DecisionBoundaryPlot.tsx`. No orphaned endpoints; no frontend call to a non-existent endpoint.

---

## 4. Dead Code / Unused Files

None found. Every backend module is imported from `main.py` (directly or transitively via `datasets.py`→`uploads.py`). Every frontend `lib/*.ts` and `components/*.tsx` file is imported at least once, all traced back to `page.tsx`. `knowledge_base/*.md` files are all loaded dynamically via glob in `rag.build_index()` — not orphaned, just not statically imported.

---

## 5. Config & Secrets

- **🔴 Live secret found:** `backend/.env` contains a real, non-placeholder `GROQ_API_KEY=gsk_...` value (Groq API key).
  - ✅ Confirmed this file is **not git-tracked** — `git ls-files`, `git log --all -- backend/.env`, and `git check-ignore` all show it's excluded (`backend/.gitignore` → `.env*` with `!.env.example` exception) and it has never been committed.
  - Still, it's a live credential sitting in plaintext on disk. If this key has ever been pasted anywhere (chat, screenshare, ticket), rotate it in the Groq console.
- `backend/.env.example` and `frontend/.env.example` are clean placeholders — correct pattern.
- **CORS**: `ALLOWED_ORIGINS` env var, defaults to `http://localhost:3000` only; methods restricted to `GET`/`POST`; `allow_headers=["*"]` but no `allow_credentials` — acceptable for this app's shape.
- **No auth** on any pipeline endpoint — session/upload access is guarded only by an unguessable UUID4 (`session_id`/`upload_id`), no ownership check beyond that. Acceptable for a demo/portfolio app, not for anything sensitive.
- No other hardcoded keys/secrets found in source (`main.py`, components, lib files all clean).

---

## 6. Top 5 Problems (severity order)

1. **`backend/requirements.txt` — no pinned versions** (all 6 packages unversioned). *Issue:* zero reproducibility; a future `pip install` could pull a breaking scikit-learn/FastAPI major version and silently change model behavior or break API contracts. *Fix:* pin exact versions (`pip freeze > requirements.txt` from the working venv).

2. **`backend/pipeline_state.py:6` + `backend/uploads.py:8` — unbounded in-memory state, no persistence, no auth.** *Issue:* server restart loses all sessions/uploads; any process holding a valid UUID can read another user's session data (no ownership check tied to a real user/IP); LRU cap of 50 could evict active users' sessions under load. *Fix:* fine for a portfolio demo, but note this explicitly as a known limitation — don't extend to multi-tenant use without adding real auth/storage.

3. **`backend/main.py:107-118` (`/datasets`) — reloads every built-in sklearn dataset from disk/network on every call**, no caching (`get_dataset` re-invokes each loader for every `/datasets` GET). *Issue:* unnecessary latency on a hot endpoint, worse combined with Render free-tier cold starts. *Fix:* cache `BUILTIN_DATASETS` results (e.g., `functools.lru_cache` on loaders).

4. **`backend/main.py:665-667` — `ASK_RATE_LIMIT_FALLBACK` dict grows unbounded** (keyed by client IP for anonymous `/ask` calls with no `session_id`), never evicted. *Issue:* slow memory leak on a long-running process under public traffic. *Fix:* cap/evict like `SESSIONS`/`UPLOADS` (LRU with max size), or use a TTL.

5. **Live `GROQ_API_KEY` sitting in plaintext `backend/.env`** (not committed, verified). *Issue:* not a repo-hygiene bug since it's gitignored, but worth flagging as an operational secret-handling reminder — if this key was ever shared outside this machine, rotate it. *Fix:* no code change needed; just a rotate-if-exposed reminder.

---

**Summary:** Codebase is clean overall — no dead code, no committed secrets, sensible CORS defaults, and a genuinely instructive pipeline architecture. The real risks are backend dependency pinning (biggest) and the unbounded in-memory stores/rate-limit map (minor, expected for a demo deployment but worth a comment in README if not already called out).
