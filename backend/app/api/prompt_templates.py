from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.prompt_template import (
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateResponse,
)
from app.models.prompt_template import PromptTemplate
from app.models.user import User
from app.models.workflow_step import StepType
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("", response_model=List[PromptTemplateResponse])
def list_prompt_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    step_type: StepType = None,
    active_only: bool = True,
):
    """
    List all prompt templates (optionally filtered by step type).
    """
    query = db.query(PromptTemplate)

    if step_type:
        query = query.filter(PromptTemplate.step_type == step_type)

    if active_only:
        query = query.filter(PromptTemplate.is_active == True)

    templates = query.order_by(PromptTemplate.step_type, PromptTemplate.version.desc()).all()
    return templates


@router.get("/{template_id}", response_model=PromptTemplateResponse)
def get_prompt_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific prompt template.
    """
    template = db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    return template


@router.post("", response_model=PromptTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_prompt_template(
    template_data: PromptTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Create a new prompt template (Admin only).
    Automatically increments version number.
    """
    # Get latest version for this step type
    latest = (
        db.query(PromptTemplate)
        .filter(PromptTemplate.step_type == template_data.step_type)
        .order_by(PromptTemplate.version.desc())
        .first()
    )

    new_version = (latest.version + 1) if latest else 1

    # Deactivate previous active template
    if latest and latest.is_active:
        latest.is_active = False

    # Create new template
    template = PromptTemplate(
        step_type=template_data.step_type,
        version=new_version,
        system_prompt=template_data.system_prompt,
        user_prompt_template=template_data.user_prompt_template,
        is_active=True,
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.put("/{template_id}", response_model=PromptTemplateResponse)
def update_prompt_template(
    template_id: int,
    template_data: PromptTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Update a prompt template (Admin only).
    This creates a NEW version (immutability for audit).
    """
    old_template = db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()

    if not old_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    # Deactivate old template
    old_template.is_active = False

    # Create new version
    new_template = PromptTemplate(
        step_type=old_template.step_type,
        version=old_template.version + 1,
        system_prompt=template_data.system_prompt,
        user_prompt_template=template_data.user_prompt_template,
        is_active=True,
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_prompt_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Deactivate a prompt template (Admin only).
    Templates are never truly deleted for audit trail.
    """
    template = db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found",
        )

    template.is_active = False
    db.commit()

    return None
