from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class BugStatus(str, enum.Enum):
    DRAFT = "draft"
    FORMATTED = "formatted"


class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=False)

    # QC's original bug description
    original_description = Column(Text, nullable=False)

    # AI-formatted bug report
    formatted_description = Column(Text, nullable=True)

    status = Column(SQLEnum(BugStatus), default=BugStatus.DRAFT, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workflow_step = relationship("WorkflowStep", back_populates="bugs")
