from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.bug import BugCreate, BugUpdate, BugResponse, BugFormatRequest
from app.models.bug import Bug, BugStatus
from app.models.workflow_step import WorkflowStep, StepType
from app.models.project import Project
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.api.deps import get_current_user
from app.services.ai_service import AIService

router = APIRouter()


@router.get("/workflow-steps/{step_id}/bugs", response_model=List[BugResponse])
def list_bugs(
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all bugs for a workflow step.
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

    return step.bugs


@router.post("/workflow-steps/{step_id}/bugs", response_model=BugResponse)
def create_bug(
    step_id: int,
    bug_data: BugCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new bug for a workflow step.
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

    # Verify this is the bug report step
    if step.step_type != StepType.BUG_REPORT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bugs can only be added to the Bug Report step",
        )

    # Create bug
    bug = Bug(
        workflow_step_id=step_id,
        original_description=bug_data.original_description,
        status=BugStatus.DRAFT,
    )
    db.add(bug)
    db.commit()
    db.refresh(bug)

    return bug


@router.post("/bugs/{bug_id}/format", response_model=BugResponse)
def format_bug(
    bug_id: int,
    request: BugFormatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI-formatted bug description.
    """
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found",
        )

    # Check project ownership
    step = db.query(WorkflowStep).filter(WorkflowStep.id == bug.workflow_step_id).first()
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this bug",
        )

    # Get active prompt template for bug report
    prompt_template = db.query(PromptTemplate).filter(
        PromptTemplate.step_type == StepType.BUG_REPORT,
        PromptTemplate.is_active == True,
    ).first()

    if not prompt_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active prompt template found for Bug Report",
        )

    # Build user prompt with bug description
    user_prompt = f"Format the following bug description:\n\n{bug.original_description}"

    # Generate AI completion
    ai_result = AIService.generate_completion(
        system_prompt=prompt_template.system_prompt,
        user_prompt=user_prompt,
        context_prompt=None,
    )

    # Log execution
    AIService.log_execution(
        db=db,
        workflow_step_id=bug.workflow_step_id,
        user_id=current_user.id,
        system_prompt=prompt_template.system_prompt,
        user_prompt=user_prompt,
        context_prompt=None,
        ai_result=ai_result,
        prompt_template_id=prompt_template.id,
    )

    if ai_result["success"] != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {ai_result['error_message']}",
        )

    # Update bug with formatted description
    bug.formatted_description = ai_result["response"]
    bug.status = BugStatus.FORMATTED
    db.commit()
    db.refresh(bug)

    return bug


@router.put("/bugs/{bug_id}", response_model=BugResponse)
def update_bug(
    bug_id: int,
    bug_data: BugUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a bug.
    """
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found",
        )

    # Check project ownership
    step = db.query(WorkflowStep).filter(WorkflowStep.id == bug.workflow_step_id).first()
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this bug",
        )

    # Update fields
    if bug_data.original_description is not None:
        bug.original_description = bug_data.original_description
    if bug_data.formatted_description is not None:
        bug.formatted_description = bug_data.formatted_description
        bug.status = BugStatus.FORMATTED

    db.commit()
    db.refresh(bug)

    return bug


@router.delete("/bugs/{bug_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bug(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a bug.
    """
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found",
        )

    # Check project ownership
    step = db.query(WorkflowStep).filter(WorkflowStep.id == bug.workflow_step_id).first()
    project = db.query(Project).filter(Project.id == step.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this bug",
        )

    db.delete(bug)
    db.commit()

    return None
