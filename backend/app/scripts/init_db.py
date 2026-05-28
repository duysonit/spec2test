"""
Database initialization script.
Creates tables, default users, and prompt templates.
"""
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import User, Project, WorkflowStep, Artifact, AIExecutionLog, PromptTemplate, Bug
from app.models.workflow_step import StepType
from app.core.security import get_password_hash
from app.services.workflow_service import WorkflowService
from app.core.prompts_vi import PROMPTS_VI, VI_LANGUAGE_RULE


def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def create_default_users(db: Session):
    """Create default admin and test users."""
    print("Creating default users...")

    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@spec2test.com").first()
    if existing_admin:
        print("✓ Admin user already exists")
        return existing_admin

    # Create admin user
    admin = User(
        email="admin@spec2test.com",
        full_name="Admin User",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_admin=True,
    )
    db.add(admin)

    # Create test QC user
    qc_user = User(
        email="qc@spec2test.com",
        full_name="QC Engineer",
        hashed_password=get_password_hash("qc123"),
        is_active=True,
        is_admin=False,
    )
    db.add(qc_user)

    db.commit()
    db.refresh(admin)
    db.refresh(qc_user)

    print("✓ Default users created")
    print(f"  - Admin: admin@spec2test.com / admin123")
    print(f"  - QC User: qc@spec2test.com / qc123")

    return admin


def create_default_prompt_templates(db: Session):
    """Create default prompt templates for all 4 workflow steps."""
    print("Creating default prompt templates...")

    # Check if templates already exist
    existing = db.query(PromptTemplate).first()
    if existing:
        print("✓ Prompt templates already exist")
        return

    for step_type, prompts in PROMPTS_VI.items():
        template = PromptTemplate(
            step_type=step_type,
            version=1,
            system_prompt=prompts["system_prompt"] + VI_LANGUAGE_RULE,
            user_prompt_template=prompts["user_prompt_template"],
            is_active=True,
        )
        db.add(template)

    db.commit()
    print("✓ Default prompt templates created for all 4 steps")


def create_sample_project(db: Session, admin: User):
    """Create a sample project for demonstration."""
    print("Creating sample project...")

    # Check if sample project already exists
    existing = db.query(Project).filter(Project.name == "Sample Login Feature").first()
    if existing:
        print("✓ Sample project already exists")
        return

    project = Project(
        name="Sample Login Feature",
        description="Example project demonstrating the Spec2Test workflow",
        requirement_text="""As a user, I want to log in to the system using my email and password.

Acceptance Criteria:
- User can enter email and password
- System validates credentials
- On success: redirect to dashboard
- On failure: show error message
- After 3 failed attempts: lock account for 15 minutes
- Password must be at least 8 characters""",
        context="Web application, React frontend, Node.js backend, PostgreSQL database",
        owner_id=admin.id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # Initialize workflow steps
    WorkflowService.initialize_workflow(db, project.id)

    print(f"✓ Sample project created (ID: {project.id})")


def main():
    """Main initialization function."""
    print("=" * 50)
    print("Spec2Test Database Initialization")
    print("=" * 50)

    # Create tables
    create_tables()

    # Create database session
    db = SessionLocal()

    try:
        # Create users
        admin = create_default_users(db)

        # Create prompt templates
        create_default_prompt_templates(db)

        # Create sample project
        create_sample_project(db, admin)

        print("=" * 50)
        print("✓ Database initialization completed successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"✗ Error during initialization: {e}")
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
