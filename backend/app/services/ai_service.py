from openai import OpenAI
from typing import Optional
import time
from app.core.config import settings
from sqlalchemy.orm import Session
from app.models.ai_execution_log import AIExecutionLog
from app.models.workflow_step import WorkflowStep


class AIService:
    _client = None

    @classmethod
    def get_client(cls):
        """Lazy initialization of OpenAI client."""
        if cls._client is None:
            cls._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return cls._client
    @staticmethod
    def generate_completion(
        system_prompt: str,
        user_prompt: str,
        context_prompt: Optional[str] = None,
    ) -> dict:
        """
        Generate AI completion using OpenAI.

        Returns:
            dict with keys: response, execution_time_ms, token_usage, success, error_message
        """
        start_time = time.time()

        try:
            messages = [
                {"role": "system", "content": system_prompt},
            ]

            if context_prompt:
                messages.append({"role": "system", "content": f"Context from previous steps:\n{context_prompt}"})

            messages.append({"role": "user", "content": user_prompt})

            client = AIService.get_client()
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
            )

            execution_time_ms = (time.time() - start_time) * 1000
            ai_response = response.choices[0].message.content

            return {
                "response": ai_response,
                "execution_time_ms": execution_time_ms,
                "token_usage": response.usage.total_tokens,
                "success": "success",
                "error_message": None,
            }

        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            return {
                "response": "",
                "execution_time_ms": execution_time_ms,
                "token_usage": 0,
                "success": "error",
                "error_message": str(e),
            }

    @staticmethod
    def log_execution(
        db: Session,
        workflow_step_id: int,
        user_id: int,
        system_prompt: str,
        user_prompt: str,
        context_prompt: Optional[str],
        ai_result: dict,
        prompt_template_id: Optional[int] = None,
    ) -> AIExecutionLog:
        """
        Log AI execution to database for audit trail.
        """
        log = AIExecutionLog(
            workflow_step_id=workflow_step_id,
            user_id=user_id,
            prompt_template_id=prompt_template_id,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context_prompt=context_prompt,
            ai_response=ai_result["response"],
            model=settings.OPENAI_MODEL,
            execution_time_ms=ai_result["execution_time_ms"],
            token_usage=ai_result["token_usage"],
            success=ai_result["success"],
            error_message=ai_result["error_message"],
        )

        db.add(log)
        db.commit()
        db.refresh(log)
        return log
