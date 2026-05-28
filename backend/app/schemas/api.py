from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class APIBase(BaseModel):
    name: str
    endpoint_url: str
    method: str
    auth_type: str
    specification: str


class APICreate(APIBase):
    pass


class APIUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    method: Optional[str] = None
    auth_type: Optional[str] = None
    specification: Optional[str] = None
    generated_test_cases: Optional[str] = None


class APIResponse(APIBase):
    id: int
    project_id: int
    generated_test_cases: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
