from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class API(Base):
    __tablename__ = "apis"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # API Details
    name = Column(String, nullable=False)  # e.g., "Create User API"
    endpoint_url = Column(String, nullable=False)  # e.g., "https://api.example.com/v1/users"
    method = Column(String, nullable=False)  # GET, POST, PUT, DELETE, etc.
    auth_type = Column(String, nullable=False)  # None, Bearer, Basic, API Key, etc.
    specification = Column(Text, nullable=False)  # OpenAPI/Swagger spec or detailed docs

    # Generated test cases (stored as markdown/text)
    generated_test_cases = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="apis")
