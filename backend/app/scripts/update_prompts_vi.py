"""
Cập nhật prompt template đang active sang tiếng Việt.
Chạy: python -m app.scripts.update_prompts_vi
"""
from app.database import SessionLocal
from app.models.prompt_template import PromptTemplate
from app.core.prompts_vi import PROMPTS_VI, VI_LANGUAGE_RULE


def main():
    db = SessionLocal()
    try:
        updated = 0
        for step_type, prompts in PROMPTS_VI.items():
            template = (
                db.query(PromptTemplate)
                .filter(
                    PromptTemplate.step_type == step_type,
                    PromptTemplate.is_active == True,
                )
                .order_by(PromptTemplate.version.desc())
                .first()
            )
            if not template:
                print(f"⚠ Không tìm thấy template active cho {step_type.value}")
                continue

            template.system_prompt = prompts["system_prompt"] + VI_LANGUAGE_RULE
            template.user_prompt_template = prompts["user_prompt_template"]
            updated += 1
            print(f"✓ Đã cập nhật prompt tiếng Việt: {step_type.value}")

        db.commit()
        print(f"\n✓ Hoàn tất — {updated} template đã cập nhật.")
        print("Gợi ý: Bấm Rebuild Testcase Draft để sinh lại nội dung tiếng Việt.")
    except Exception as e:
        db.rollback()
        print(f"✗ Lỗi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
