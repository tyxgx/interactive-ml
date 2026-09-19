import io

import main


def _csv(rows: int) -> bytes:
    lines = ["a,b,label"] + [f"{i},{i * 2},{i % 2}" for i in range(rows)]
    return "\n".join(lines).encode()


def test_upload_accepts_small_csv(client):
    r = client.post("/upload", files={"file": ("d.csv", io.BytesIO(_csv(40)), "text/csv")})
    assert r.status_code == 200


def test_upload_rejects_non_csv(client):
    r = client.post("/upload", files={"file": ("d.txt", io.BytesIO(b"x"), "text/plain")})
    assert r.status_code == 400


def test_upload_rejects_too_many_rows(client):
    r = client.post(
        "/upload", files={"file": ("d.csv", io.BytesIO(_csv(main.MAX_UPLOAD_ROWS + 1)), "text/csv")}
    )
    assert r.status_code == 400


def test_ask_without_key_reports_not_configured(client, monkeypatch):
    monkeypatch.setattr(main, "GROQ_API_KEY", None)
    assert client.post("/ask", json={"question": "hi"}).json() == {
        "error": "RAG assistant not configured"
    }


class _FakeGroq:
    """Fails with model_not_found for the first model, then succeeds."""

    calls: list[str] = []

    def __init__(self, api_key):
        self.chat = self
        self.completions = self

    def create(self, model, **_):
        _FakeGroq.calls.append(model)
        if len(_FakeGroq.calls) == 1:
            raise RuntimeError("model_not_found")
        message = type("M", (), {"content": "an answer"})
        choice = type("C", (), {"message": message})
        return type("R", (), {"choices": [choice]})


def test_ask_falls_back_when_model_is_retired(client, monkeypatch):
    _FakeGroq.calls = []
    monkeypatch.setattr(main, "GROQ_API_KEY", "test-key")
    monkeypatch.setattr(main, "Groq", _FakeGroq)
    r = client.post("/ask", json={"question": "What is overfitting?", "session_id": None}).json()
    assert r["answer"] == "an answer"
    assert len(_FakeGroq.calls) == 2


def test_session_context_endpoint(client):
    from conftest import run_pipeline

    sid, _ = run_pipeline(client, "iris")
    assert client.get(f"/pipeline/{sid}/context").json() == {"context": None}
    client.post(f"/pipeline/{sid}/train", json={"algorithm": "knn"})
    assert "knn" in client.get(f"/pipeline/{sid}/context").json()["context"]
    assert client.get("/pipeline/nope/context").json() == {"context": None}


def test_ask_uses_client_supplied_session_context(client, monkeypatch):
    captured = {}

    class Capture(_FakeGroq):
        def create(self, model, messages, **_):
            captured["system"] = messages[0]["content"]
            message = type("M", (), {"content": "ok"})
            choice = type("C", (), {"message": message})
            return type("R", (), {"choices": [choice]})

    monkeypatch.setattr(main, "GROQ_API_KEY", "test-key")
    monkeypatch.setattr(main, "Groq", Capture)
    r = client.post(
        "/ask", json={"question": "why?", "session_context": "The user's current model is 'svm'."}
    ).json()
    assert r["answer"] == "ok"
    assert "current model is 'svm'" in captured["system"]
