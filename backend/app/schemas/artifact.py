from pydantic import BaseModel
from datetime import datetime


class ArtifactResponse(BaseModel):
    id: int
    workflow_step_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
