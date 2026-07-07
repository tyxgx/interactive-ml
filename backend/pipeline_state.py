import uuid
from collections import OrderedDict

MAX_SESSIONS = 50

SESSIONS: "OrderedDict[str, dict]" = OrderedDict()


def create_session() -> str:
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "dataset": None,
        "target_column": None,
        "schema": None,
        "X": None,
        "y": None,
        "preprocessed_data": None,
        "preprocessor": None,
        "split": None,
        "model": None,
        "algorithm": None,
        "predictions": None,
        "evaluation": None,
    }
    SESSIONS.move_to_end(session_id)
    if len(SESSIONS) > MAX_SESSIONS:
        SESSIONS.popitem(last=False)
    return session_id


def get_session(session_id: str) -> dict | None:
    return SESSIONS.get(session_id)


def require_keys(session: dict, keys: list[str]) -> str | None:
    for key in keys:
        if session.get(key) is None:
            return key
    return None
