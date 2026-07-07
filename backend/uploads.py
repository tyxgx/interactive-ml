import uuid
from collections import OrderedDict

import pandas as pd

MAX_UPLOADS = 50

UPLOADS: "OrderedDict[str, pd.DataFrame]" = OrderedDict()


def create_upload(df: pd.DataFrame) -> str:
    upload_id = str(uuid.uuid4())
    UPLOADS[upload_id] = df
    UPLOADS.move_to_end(upload_id)
    if len(UPLOADS) > MAX_UPLOADS:
        UPLOADS.popitem(last=False)
    return upload_id


def get_upload(upload_id: str) -> pd.DataFrame | None:
    return UPLOADS.get(upload_id)
