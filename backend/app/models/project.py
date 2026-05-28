from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectType(str, enum.Enum):
    STANDARD = "standard"
    API_TESTING = "api_testing"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)

    # Project type and general fields
    project_type = Column(Enum(ProjectType), default=ProjectType.STANDARD, nullable=False)
    requirement_text = Column(Text, nullable=True)  # Optional for API Testing projects
    context = Column(Text)  # Domain, system, user role information

    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="projects")
    workflow_steps = relationship("WorkflowStep", back_populates="project", cascade="all, delete-orphan")
    apis = relationship("API", back_populates="project", cascade="all, delete-orphan")
