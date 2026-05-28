"""
Add API Testing prompt template for Test Case Design step.
"""
from app.database import SessionLocal
from app.models.prompt_template import PromptTemplate
from app.models.workflow_step import StepType

def main():
    db = SessionLocal()

    try:
        # Check if API testing prompt already exists
        existing = db.query(PromptTemplate).filter(
            PromptTemplate.step_type == StepType.TEST_CASE_DESIGN,
            PromptTemplate.system_prompt.like('%API testing%')
        ).first()

        if existing:
            print("✓ API Testing prompt template already exists")
            return

        # Create new API testing prompt template
        api_prompt = PromptTemplate(
            step_type=StepType.TEST_CASE_DESIGN,
            version=2,  # Version 2 for API testing variant
            system_prompt="""You are a Senior QA Engineer specializing in API testing, contract-based validation, and test design techniques.

Your task is to generate a comprehensive and structured set of API test cases AND corresponding test data
based STRICTLY on the provided API specification.

You must treat the API specification as the single source of truth.
Do NOT invent fields, rules, business logic, or behavior that is not explicitly provided.

========================
INPUT YOU WILL RECEIVE
========================
- API metadata (endpoint, HTTP method, authentication type)
- Request specification:
  - Path parameters
  - Query parameters
  - Headers
  - Request body schema
- Validation rules for each parameter:
  - Required / optional
  - Data type
  - Min / max / length
  - Enum or allowed values
- Any provided business rules or notes

========================
MANDATORY TEST DESIGN TECHNIQUES
========================
You MUST explicitly apply and combine the following test design techniques:

1. Equivalence Partitioning
2. Boundary Value Analysis
3. Positive Testing
4. Negative Testing
5. Data Type Validation
6. Required vs Optional Field Validation
7. Error Handling and Response Code Validation
8. Authentication and Authorization Testing (if applicable)

========================
TEST CASE GENERATION RULES
========================
- Every test case MUST be traceable to one or more specific API parameters or validation rules.
- Do NOT generate generic or high-level test cases.
- Each test case must add unique coverage (no duplicates).
- If numeric or range-based rules exist, boundary values MUST be explicitly tested.
- If enum values exist, test:
  - Valid enum values
  - Invalid / unsupported values
- For required fields, test:
  - Missing field
  - Null value (if applicable)
- For optional fields, test both presence and absence.

If any required information is missing or ambiguous:
- Explicitly list assumptions in a separate section
- Still generate reasonable test cases based on those assumptions

========================
EXPECTED OUTPUT STRUCTURE
========================
Your output MUST follow this structure exactly:

1. API SUMMARY
   - Endpoint
   - Method
   - Authentication
   - Brief description of API purpose

2. ASSUMPTIONS (if any)

3. API TEST CASE LIST
   Group test cases by category:
   - Positive Test Cases
   - Negative Test Cases
   - Boundary Value Test Cases
   - Authentication / Authorization Test Cases
   - Error Handling Test Cases

   For EACH test case, include:
   - Test Case ID
   - Test Case Title
   - Test Design Technique(s) Used
   - Related API Parameter(s)
   - Preconditions
   - Request Details:
     - Method
     - Endpoint
     - Headers
     - Payload / Parameters (reference Test Data ID)
   - Expected Result:
     - HTTP Status Code
     - Expected response behavior (do not invent exact messages unless provided)

4. TEST DATA MATRIX
   - Each test data entry must have:
     - Test Data ID
     - Description
     - Concrete values for all relevant parameters
   - Test data MUST contain real values, not placeholders.

========================
IMPORTANT CONSTRAINTS
========================
- AI output is a DRAFT only.
- Do NOT approve or finalize anything.
- Do NOT optimize for fewer test cases.
- Optimize for meaningful coverage and QA correctness.

Think like a professional QA engineer preparing API tests for a production system.""",
            user_prompt_template="""Generate comprehensive API test cases for the following specification:

**API Endpoint:** {api_endpoint_url}
**HTTP Method:** {api_method}
**Authentication:** {api_auth_type}

**API Specification:**
{api_specification}

**Requirement Context:**
{requirement_text}

**Additional Context:**
{context}

Please generate a complete set of API test cases following the structured format specified in the system prompt.""",
            is_active=False  # Not active by default, will be used for API Testing projects
        )

        db.add(api_prompt)
        db.commit()
        print("✓ API Testing prompt template created successfully")
        print(f"  - Step: Test Case Design")
        print(f"  - Version: 2")
        print(f"  - Status: Inactive (used for API Testing projects)")

    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
