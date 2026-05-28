from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Artifact(Base):
    """
    Immutable approved output of a workflow step.
    Once created, it cannot be modified.
    """
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, index=True)
    workflow_step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=False)
    content = Column(Text, nullable=False)  # The approved content (immutable)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow_step = relationship("WorkflowStep", back_populates="artifacts")
