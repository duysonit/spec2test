from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.api import APICreate, APIUpdate, APIResponse
from app.models.api import API
from app.models.project import Project, ProjectType
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.models.workflow_step import StepType
from app.api.deps import get_current_user
from app.services.ai_service import AIService

router = APIRouter()


@router.get("/projects/{project_id}/apis", response_model=List[APIResponse])
def list_apis(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all APIs for a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check project ownership
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )

    return project.apis


@router.post("/projects/{project_id}/apis", response_model=APIResponse)
def create_api(
    project_id: int,
    api_data: APICreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new API for a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check project ownership
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )

    # Verify this is an API Testing project
    if project.project_type != ProjectType.API_TESTING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="APIs can only be added to API Testing projects",
        )

    # Create API
    api = API(
        project_id=project_id,
        name=api_data.name,
        endpoint_url=api_data.endpoint_url,
        method=api_data.method,
        auth_type=api_data.auth_type,
        specification=api_data.specification,
    )
    db.add(api)
    db.commit()
    db.refresh(api)

    return api


@router.post("/apis/{api_id}/generate-test-cases", response_model=APIResponse)
def generate_test_cases(
    api_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate test cases for a specific API.
    """
    api = db.query(API).filter(API.id == api_id).first()
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == api.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this API",
        )

    # Get API testing prompt template (version 2)
    prompt_template = db.query(PromptTemplate).filter(
        PromptTemplate.step_type == StepType.TEST_CASE_DESIGN,
        PromptTemplate.version == 2,
    ).first()

    if not prompt_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API testing prompt template not found",
        )

    # Build user prompt with API details
    user_prompt = prompt_template.user_prompt_template.format(
        api_endpoint_url=api.endpoint_url,
        api_method=api.method,
        api_auth_type=api.auth_type,
        api_specification=api.specification,
        requirement_text=project.requirement_text or "No additional requirements",
        context=project.context or "No additional context provided",
    )

    # Generate AI completion
    ai_result = AIService.generate_completion(
        system_prompt=prompt_template.system_prompt,
        user_prompt=user_prompt,
        context_prompt=None,
    )

    if ai_result["success"] != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {ai_result['error_message']}",
        )

    # Update API with generated test cases
    api.generated_test_cases = ai_result["response"]
    db.commit()
    db.refresh(api)

    return api


@router.put("/apis/{api_id}", response_model=APIResponse)
def update_api(
    api_id: int,
    api_data: APIUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an API.
    """
    api = db.query(API).filter(API.id == api_id).first()
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == api.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this API",
        )

    # Update fields
    if api_data.name is not None:
        api.name = api_data.name
    if api_data.endpoint_url is not None:
        api.endpoint_url = api_data.endpoint_url
    if api_data.method is not None:
        api.method = api_data.method
    if api_data.auth_type is not None:
        api.auth_type = api_data.auth_type
    if api_data.specification is not None:
        api.specification = api_data.specification
    if api_data.generated_test_cases is not None:
        api.generated_test_cases = api_data.generated_test_cases

    db.commit()
    db.refresh(api)

    return api


@router.delete("/apis/{api_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api(
    api_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an API.
    """
    api = db.query(API).filter(API.id == api_id).first()
    if not api:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API not found",
        )

    # Check project ownership
    project = db.query(Project).filter(Project.id == api.project_id).first()
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this API",
        )

    db.delete(api)
    db.commit()

    return None
