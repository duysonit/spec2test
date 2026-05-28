"""Vietnamese prompt templates for workflow AI generation."""

from app.models.workflow_step import StepType

VI_LANGUAGE_RULE = (
    "\n\nQUAN TRỌNG: Toàn bộ nội dung phản hồi phải viết bằng tiếng Việt. "
    "Thuật ngữ chuyên ngành QA/IT có thể kèm tiếng Anh trong ngoặc khi cần."
)

PROMPTS_VI: dict[StepType, dict[str, str]] = {
    StepType.REQUIREMENT_ANALYSIS: {
        "system_prompt": """Bạn là chuyên gia QA chuyên phân tích yêu cầu (requirement analysis).
Nhiệm vụ của bạn là phân tích requirement, cấu trúc hóa thông tin để lập kế hoạch kiểm thử và soạn nháp testcase.
Hãy kỹ lưỡng, chỉ ra chỗ mơ hồ và nêu câu hỏi cần làm rõ với BA/PM khi cần.""",
        "user_prompt_template": """Phân tích requirement sau và soạn bản nháp phân tích / testcase:

**Requirement:**
{requirement_text}

**Ngữ cảnh (Context):**
{context}

Trình bày đầy đủ các mục sau:
1. **Yêu cầu chức năng (Functional Requirements)**: Liệt kê tất cả yêu cầu chức năng
2. **Yêu cầu phi chức năng (Non-Functional Requirements)**: Hiệu năng, bảo mật, khả dụng, v.v.
3. **Giả định (Assumptions)**: Các giả định đang được đưa ra
4. **Câu hỏi mở (Open Questions)**: Nội dung cần làm rõ
5. **Sơ đồ Mind Map trực quan**: Sơ đồ Mermaid dạng `mindmap` tóm tắt luồng feature (feature ở giữa, các nhánh là bước chính). Nhãn trên sơ đồ dùng tiếng Việt.

Định dạng rõ ràng từng mục, dùng bullet. Mind map đặt trong khối code ```mermaid.""",
    },
    StepType.TEST_STRATEGY: {
        "system_prompt": """Bạn là chuyên gia QA chuyên chiến lược kiểm thử (test strategy).
Nhiệm vụ: xác định phạm vi, cách tiếp cận kiểm thử và vùng rủi ro dựa trên phân tích yêu cầu đã duyệt.
Tập trung vào chiến lược thực tế, hiệu quả.""",
        "user_prompt_template": """Dựa trên phân tích yêu cầu đã duyệt, lập chiến lược kiểm thử.

**Requirement:**
{requirement_text}

**Ngữ cảnh (Context):**
{context}

Trình bày:
1. **Phạm vi kiểm thử (Test Scope)**: Kiểm thử gì / không kiểm thử gì
2. **Loại kiểm thử (Test Types)**: Unit, tích hợp, E2E, hiệu năng, bảo mật, v.v.
3. **Cách tiếp cận (Test Approach)**: Thực hiện kiểm thử như thế nào
4. **Vùng rủi ro (Risk Areas)**: Khu vực rủi ro cao
5. **Môi trường kiểm thử (Test Environment)**: Môi trường cần thiết

Định dạng rõ ràng từng mục.""",
    },
    StepType.TEST_CASE_DESIGN: {
        "system_prompt": """Bạn là chuyên gia QA chuyên thiết kế testcase.
Nhiệm vụ: tạo testcase chi tiết, có thể thực thi, bao phủ positive, negative và edge case.
Mỗi testcase phải rõ ràng, cụ thể và có thể xác minh được.""",
        "user_prompt_template": """Thiết kế bộ testcase đầy đủ cho requirement sau.

**Requirement:**
{requirement_text}

**Ngữ cảnh (Context):**
{context}

Với mỗi testcase, cung cấp:
1. **Mã testcase (Test Case ID)**: TC-XXX
2. **Tiêu đề (Title)**: Mô tả ngắn
3. **Điều kiện tiên quyết (Pre-conditions)**
4. **Các bước thực hiện (Test Steps)**: Đánh số
5. **Dữ liệu kiểm thử (Test Data)**
6. **Kết quả mong đợi (Expected Result)**
7. **Độ ưu tiên (Priority)**: Cao/Trung bình/Thấp
8. **Loại (Type)**: Positive/Negative/Edge Case

Tạo ít nhất:
- 3 testcase positive
- 2 testcase negative
- 2 testcase edge case

Trình bày từng testcase rõ ràng.""",
    },
    StepType.BUG_REPORT: {
        "system_prompt": """Bạn là chuyên gia QA chuyên báo cáo lỗi (bug report).
Nhiệm vụ: tạo mẫu báo cáo lỗi chuẩn hóa dựa trên testcase.
Báo cáo phải rõ ràng, tái hiện được và dễ xử lý.""",
        "user_prompt_template": """Tạo mẫu báo cáo lỗi cho tính năng này.

**Requirement:**
{requirement_text}

**Ngữ cảnh (Context):**
{context}

Mẫu gồm các mục:
1. **Tiêu đề lỗi (Bug Title)**
2. **Môi trường (Environment)**: Trình duyệt, OS, phiên bản
3. **Điều kiện tiên quyết (Pre-conditions)**
4. **Các bước tái hiện (Steps to Reproduce)**
5. **Kết quả thực tế (Actual Result)**
6. **Kết quả mong đợi (Expected Result)**
7. **Mức độ nghiêm trọng (Severity)**: Hướng dẫn Critical/Cao/Trung bình/Thấp
8. **Đính kèm (Attachments)**: Ảnh chụp, log, v.v.

Kèm một ví dụ báo cáo lỗi dựa trên một testcase.""",
    },
}

STEP_CONTEXT_LABELS_VI: dict[StepType, str] = {
    StepType.REQUIREMENT_ANALYSIS: "Phân tích yêu cầu",
    StepType.TEST_STRATEGY: "Chiến lược kiểm thử",
    StepType.TEST_CASE_DESIGN: "Thiết kế testcase",
    StepType.BUG_REPORT: "Báo cáo lỗi",
}
