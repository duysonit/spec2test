from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.workflow_step import (
    WorkflowStepResponse,
    StepDraftUpdate,
    StepApprove,
    GenerateAIDraft,
)
from app.schemas.artifact import ArtifactResponse
from app.schemas.ai_execution_log import AIExecutionLogResponse
from app.models.workflow_step import WorkflowStep
from app.models.project import Project
from app.models.user import User
from app.api.deps import get_current_user
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.get("/{step_id}", response_model=WorkflowStepResponse)
def get_workflow_step(
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific workflow step.
    """
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow step not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workflow step",
        )

    return step


@router.post("/{step_id}/generate-draft", response_model=WorkflowStepResponse)
def generate_ai_draft(
    step_id: int,
    request: GenerateAIDraft,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI draft for a workflow step.
    """
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow step not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workflow step",
        )

    # Generate AI draft
    WorkflowService.generate_ai_draft(db, step, current_user.id)

    db.refresh(step)
    return step


@router.put("/{step_id}/draft", response_model=WorkflowStepResponse)
def update_draft(
    step_id: int,
    draft_data: StepDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update draft content for a workflow step (manual editing).
    """
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow step not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this workflow step",
        )

    # Check if step is unlocked
    if step.status.value != "unlocked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update draft for locked or approved step",
        )

    # Update draft
    step.draft_content = draft_data.draft_content
    db.commit()
    db.refresh(step)

    return step


@router.post("/{step_id}/approve", response_model=ArtifactResponse)
def approve_step(
    step_id: int,
    request: StepApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve a workflow step.
    Creates immutable artifact and unlocks next step.
    """
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow step not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this workflow step",
        )

    # Approve step (creates artifact, locks step, unlocks next)
    artifact = WorkflowService.approve_step(db, step)

    return artifact


@router.get("/{step_id}/logs", response_model=List[AIExecutionLogResponse])
def get_step_logs(
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all AI execution logs for a workflow step.
    """
    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow step not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workflow step",
        )

    return step.ai_execution_logs
