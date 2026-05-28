from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, projects, workflow_steps, prompt_templates, bugs, apis, files

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Assisted QC Workflow Tool",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(workflow_steps.router, prefix="/api/workflow-steps", tags=["Workflow Steps"])
app.include_router(prompt_templates.router, prefix="/api/prompt-templates", tags=["Prompt Templates"])
app.include_router(bugs.router, prefix="/api", tags=["Bugs"])
app.include_router(apis.router, prefix="/api", tags=["APIs"])
app.include_router(files.router, prefix="/api", tags=["Files"])


@app.get("/")
def root():
    return {
        "message": "Welcome to Spec2Test API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
