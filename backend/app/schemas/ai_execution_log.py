from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AIExecutionLogResponse(BaseModel):
    id: int
    workflow_step_id: int
    user_id: int
    prompt_template_id: Optional[int]
    system_prompt: str
    user_prompt: str
    context_prompt: Optional[str]
    ai_response: str
    model: str
    execution_time_ms: Optional[float]
    token_usage: Optional[int]
    success: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
