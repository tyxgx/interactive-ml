# Interactive ML

A small full-stack app for exploring the machine learning workflow interactively: pick a built-in dataset (or upload your own CSV), choose a target column and algorithm, then step through the pipeline (load, split, preprocess, train, predict, evaluate) one stage at a time or all at once, and see the resulting metrics.

## Local setup

### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Environment variables (see `backend/.env.example`):

- `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins. Defaults to `http://localhost:3000`.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Environment variables (see `frontend/.env.example`):

- `NEXT_PUBLIC_API_URL` — base URL of the backend API. Defaults to `http://localhost:8000`.

## Deployment notes

- **Frontend → Vercel**: deploy the `frontend/` directory, and set `NEXT_PUBLIC_API_URL` to your deployed backend's URL.
- **Backend → Render/Railway**: deploy the `backend/` directory, set `ALLOWED_ORIGINS` to your deployed frontend's origin, and use the start command:
  ```
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

## Note on `california_housing`

The `california_housing` built-in dataset is fetched over the network on first use (scikit-learn downloads and caches it locally). This requires outbound network access from wherever the backend runs. On macOS, if you hit an SSL certificate verification error fetching it locally, set `SSL_CERT_FILE` to your `certifi` bundle before starting the server, e.g.:

```bash
SSL_CERT_FILE=$(python3 -c "import certifi; print(certifi.where())") uvicorn main:app --reload --port 8000
```
