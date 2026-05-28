from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from datetime import datetime
from app.models.workflow_step import WorkflowStep, StepType, StepStatus
from app.models.artifact import Artifact
from app.models.project import Project
from app.models.prompt_template import PromptTemplate
from app.services.ai_service import AIService
from app.core.prompts_vi import STEP_CONTEXT_LABELS_VI, VI_LANGUAGE_RULE


class WorkflowService:
    STEP_ORDER = {
        StepType.REQUIREMENT_ANALYSIS: 1,
        StepType.TEST_STRATEGY: 2,
        StepType.TEST_CASE_DESIGN: 3,
        StepType.BUG_REPORT: 4,
    }

    @staticmethod
    def initialize_workflow(db: Session, project_id: int) -> list[WorkflowStep]:
        """
        Initialize all 4 workflow steps for a new project.
        Step 1 is unlocked, others are locked.
        """
        steps = []
        for step_type, order in WorkflowService.STEP_ORDER.items():
            step = WorkflowStep(
                project_id=project_id,
                step_type=step_type,
                step_order=order,
                status=StepStatus.UNLOCKED if order == 1 else StepStatus.LOCKED,
            )
            db.add(step)
            steps.append(step)

        db.commit()
        for step in steps:
            db.refresh(step)

        return steps

    @staticmethod
    def can_approve_step(db: Session, step: WorkflowStep) -> bool:
        """
        Check if a step can be approved.
        Requirements:
        - Step must be unlocked
        - Step must have draft content
        """
        if step.status != StepStatus.UNLOCKED:
            return False
        if not step.draft_content or step.draft_content.strip() == "":
            return False
        return True

    @staticmethod
    def approve_step(db: Session, step: WorkflowStep) -> Artifact:
        """
        Approve a workflow step.
        1. Create immutable artifact from draft
        2. Mark step as approved
        3. Unlock next step
        """
        if not WorkflowService.can_approve_step(db, step):
            raise HTTPException(status_code=400, detail="Step cannot be approved")

        # Create artifact (immutable)
        artifact = Artifact(
            workflow_step_id=step.id,
            content=step.draft_content,
        )
        db.add(artifact)

        # Mark step as approved
        step.status = StepStatus.APPROVED
        step.approved_at = datetime.utcnow()

        # Unlock next step
        if step.step_order < 4:
            next_step = db.query(WorkflowStep).filter(
                WorkflowStep.project_id == step.project_id,
                WorkflowStep.step_order == step.step_order + 1,
            ).first()
            if next_step:
                next_step.status = StepStatus.UNLOCKED

        db.commit()
        db.refresh(artifact)
        db.refresh(step)

        return artifact

    @staticmethod
    def generate_ai_draft(
        db: Session,
        step: WorkflowStep,
        user_id: int,
    ) -> str:
        """
        Generate AI draft for a workflow step.
        Uses prompt template and context from previous approved steps.
        """
        if step.status != StepStatus.UNLOCKED:
            raise HTTPException(status_code=400, detail="Step is locked")

        # Get project
        project = db.query(Project).filter(Project.id == step.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Determine which prompt template to use
        # For API Testing projects on Test Case Design step, use API-specific prompt
        from app.models.project import ProjectType
        is_api_project = project.project_type == ProjectType.API_TESTING
        is_test_case_step = step.step_type == StepType.TEST_CASE_DESIGN

        if is_api_project and is_test_case_step:
            # Use API-specific prompt template (version 2)
            prompt_template = db.query(PromptTemplate).filter(
                PromptTemplate.step_type == StepType.TEST_CASE_DESIGN,
                PromptTemplate.version == 2,
            ).first()
        else:
            # Use active prompt template for this step type
            prompt_template = db.query(PromptTemplate).filter(
                PromptTemplate.step_type == step.step_type,
                PromptTemplate.is_active == True,
            ).first()

        if not prompt_template:
            raise HTTPException(
                status_code=404,
                detail=f"No prompt template found for {step.step_type}",
            )

        # Build context from previous approved steps
        context_prompt = WorkflowService._build_context_prompt(db, step)

        # Build user prompt with project data
        if is_api_project and is_test_case_step:
            # Format API-specific prompt
            user_prompt = prompt_template.user_prompt_template.format(
                api_endpoint_url=project.api_endpoint_url or "Not specified",
                api_method=project.api_method or "Not specified",
                api_auth_type=project.api_auth_type or "None",
                api_specification=project.api_specification or "Not provided",
                requirement_text=project.requirement_text,
                context=project.context or "Không có ngữ cảnh bổ sung",
            )
        else:
            # Format standard prompt
            user_prompt = prompt_template.user_prompt_template.format(
                requirement_text=project.requirement_text,
                context=project.context or "Không có ngữ cảnh bổ sung",
            )

        # Generate AI completion (Vietnamese output)
        system_prompt = prompt_template.system_prompt
        if VI_LANGUAGE_RULE.strip() not in system_prompt:
            system_prompt = system_prompt + VI_LANGUAGE_RULE

        ai_result = AIService.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context_prompt=context_prompt,
        )

        # Log execution
        AIService.log_execution(
            db=db,
            workflow_step_id=step.id,
            user_id=user_id,
            system_prompt=prompt_template.system_prompt,
            user_prompt=user_prompt,
            context_prompt=context_prompt,
            ai_result=ai_result,
            prompt_template_id=prompt_template.id,
        )

        if ai_result["success"] != "success":
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {ai_result['error_message']}",
            )

        # Update step draft
        step.draft_content = ai_result["response"]
        db.commit()
        db.refresh(step)

        return ai_result["response"]

    @staticmethod
    def _build_context_prompt(db: Session, current_step: WorkflowStep) -> Optional[str]:
        """
        Build context from all previous approved steps.
        """
        previous_steps = db.query(WorkflowStep).filter(
            WorkflowStep.project_id == current_step.project_id,
            WorkflowStep.step_order < current_step.step_order,
            WorkflowStep.status == StepStatus.APPROVED,
        ).order_by(WorkflowStep.step_order).all()

        if not previous_steps:
            return None

        context_parts = []
        for step in previous_steps:
            # Get the approved artifact
            artifact = db.query(Artifact).filter(
                Artifact.workflow_step_id == step.id,
            ).first()

            if artifact:
                label = STEP_CONTEXT_LABELS_VI.get(
                    step.step_type,
                    step.step_type.value.replace("_", " ").title(),
                )
                context_parts.append(f"## {label}\n{artifact.content}")

        return "\n\n".join(context_parts) if context_parts else None
