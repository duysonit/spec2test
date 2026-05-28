from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.workflow_step import StepType


class PromptTemplate(Base):
    """
    Versioned prompt templates for each workflow step.
    Admins can update prompts, and old versions are kept for audit.
    """
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    step_type = Column(Enum(StepType), nullable=False)
    version = Column(Integer, nullable=False)
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=False)  # Can contain placeholders like {requirement_text}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ai_execution_logs = relationship("AIExecutionLog", back_populates="prompt_template")
