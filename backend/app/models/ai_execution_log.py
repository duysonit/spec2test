from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class AIExecutionLog(Base):
    """
    Audit log for all AI calls.
    Tracks what prompts were used, what was generated, and execution details.
    """
    __tablename__ = "ai_execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_template_id = Column(Integer, ForeignKey("prompt_templates.id"), nullable=True)

    # Prompt details
    system_prompt = Column(Text, nullable=False)
    user_prompt = Column(Text, nullable=False)
    context_prompt = Column(Text)  # Previous artifacts used as context

    # AI response
    ai_response = Column(Text, nullable=False)
    model = Column(String, nullable=False)  # e.g., "gpt-4-turbo-preview"

    # Execution metadata
    execution_time_ms = Column(Float)  # Execution time in milliseconds
    token_usage = Column(Integer)  # Total tokens used
    success = Column(String, nullable=False)  # "success" or "error"
    error_message = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow_step = relationship("WorkflowStep", back_populates="ai_execution_logs")
    user = relationship("User", back_populates="ai_execution_logs")
    prompt_template = relationship("PromptTemplate", back_populates="ai_execution_logs")
