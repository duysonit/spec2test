from pydantic import BaseModel
from datetime import datetime
from app.models.workflow_step import StepType


class PromptTemplateCreate(BaseModel):
    step_type: StepType
    system_prompt: str
    user_prompt_template: str


class PromptTemplateUpdate(BaseModel):
    system_prompt: str
    user_prompt_template: str


class PromptTemplateResponse(BaseModel):
    id: int
    step_type: StepType
    version: int
    system_prompt: str
    user_prompt_template: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
