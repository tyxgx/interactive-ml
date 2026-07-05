import uuid

SESSIONS: dict[str, dict] = {}


def create_session() -> str:
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "dataset": None,
        "schema": None,
        "X": None,
        "y": None,
        "preprocessed_data": None,
        "split": None,
        "model": None,
        "predictions": None,
        "evaluation": None,
    }
    return session_id


def get_session(session_id: str) -> dict | None:
    return SESSIONS.get(session_id)


def require_keys(session: dict, keys: list[str]) -> str | None:
    for key in keys:
        if session.get(key) is None:
            return key
    return None
