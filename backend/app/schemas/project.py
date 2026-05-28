from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.project import ProjectStatus, ProjectType


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: ProjectType = ProjectType.STANDARD
    requirement_text: Optional[str] = None  # Optional for API Testing projects
    context: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    project_type: ProjectType
    requirement_text: Optional[str]
    context: Optional[str]
    status: ProjectStatus
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectWithSteps(ProjectResponse):
    workflow_steps: List["WorkflowStepResponse"]

    class Config:
        from_attributes = True


# Import here to avoid circular dependency
from app.schemas.workflow_step import WorkflowStepResponse
ProjectWithSteps.model_rebuild()
