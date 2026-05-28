from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BugBase(BaseModel):
    original_description: str


class BugCreate(BugBase):
    pass


class BugUpdate(BaseModel):
    original_description: Optional[str] = None
    formatted_description: Optional[str] = None


class BugResponse(BugBase):
    id: int
    workflow_step_id: int
    formatted_description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BugFormatRequest(BaseModel):
    pass  # No additional fields needed, just trigger formatting
