from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class StepType(str, enum.Enum):
    REQUIREMENT_ANALYSIS = "requirement_analysis"
    TEST_STRATEGY = "test_strategy"
    TEST_CASE_DESIGN = "test_case_design"
    BUG_REPORT = "bug_report"


class StepStatus(str, enum.Enum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    APPROVED = "approved"


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    step_type = Column(Enum(StepType), nullable=False)
    step_order = Column(Integer, nullable=False)  # 1, 2, 3, 4
    status = Column(Enum(StepStatus), default=StepStatus.LOCKED)
    draft_content = Column(Text)  # Current draft being worked on
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="workflow_steps")
    artifacts = relationship("Artifact", back_populates="workflow_step", cascade="all, delete-orphan")
    ai_execution_logs = relationship("AIExecutionLog", back_populates="workflow_step", cascade="all, delete-orphan")
    bugs = relationship("Bug", back_populates="workflow_step", cascade="all, delete-orphan")
