from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.workflow_step import StepType, StepStatus


class WorkflowStepResponse(BaseModel):
    id: int
    project_id: int
    step_type: StepType
    step_order: int
    status: StepStatus
    draft_content: Optional[str]
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True


class StepDraftUpdate(BaseModel):
    draft_content: str


class StepApprove(BaseModel):
    pass  # No body needed, just the action


class GenerateAIDraft(BaseModel):
    pass  # No body needed, will use project context
