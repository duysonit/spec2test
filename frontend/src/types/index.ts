export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProjectType {
  STANDARD = 'standard',
  API_TESTING = 'api_testing',
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  project_type: ProjectType;
  requirement_text?: string;
  context?: string;
  status: ProjectStatus;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface API {
  id: number;
  project_id: number;
  name: string;
  endpoint_url: string;
  method: string;
  auth_type: string;
  specification: string;
  generated_test_cases?: string;
  created_at: string;
  updated_at: string;
}

export enum StepType {
  REQUIREMENT_ANALYSIS = 'requirement_analysis',
  TEST_STRATEGY = 'test_strategy',
  TEST_CASE_DESIGN = 'test_case_design',
  BUG_REPORT = 'bug_report',
}

export enum StepStatus {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  APPROVED = 'approved',
}

export interface WorkflowStep {
  id: number;
  project_id: number;
  step_type: StepType;
  step_order: number;
  status: StepStatus;
  draft_content?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

export interface ProjectWithSteps extends Project {
  workflow_steps: WorkflowStep[];
}

export interface Artifact {
  id: number;
  workflow_step_id: number;
  content: string;
  created_at: string;
}

export interface AIExecutionLog {
  id: number;
  workflow_step_id: number;
  user_id: number;
  prompt_template_id?: number;
  system_prompt: string;
  user_prompt: string;
  context_prompt?: string;
  ai_response: string;
  model: string;
  execution_time_ms?: number;
  token_usage?: number;
  success: string;
  error_message?: string;
  created_at: string;
}

export interface PromptTemplate {
  id: number;
  step_type: StepType;
  version: number;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
  created_at: string;
}

export enum BugStatus {
  DRAFT = 'draft',
  FORMATTED = 'formatted',
}

export interface Bug {
  id: number;
  workflow_step_id: number;
  original_description: string;
  formatted_description?: string;
  status: BugStatus;
  created_at: string;
  updated_at: string;
}

export const STEP_LABELS: Record<StepType, string> = {
  [StepType.REQUIREMENT_ANALYSIS]: 'Requirement Analysis',
  [StepType.TEST_STRATEGY]: 'Test Strategy',
  [StepType.TEST_CASE_DESIGN]: 'Test Case Design',
  [StepType.BUG_REPORT]: 'Bug Report',
};

export const STATUS_LABELS: Record<StepStatus, string> = {
  [StepStatus.LOCKED]: 'Locked',
  [StepStatus.UNLOCKED]: 'Unlocked',
  [StepStatus.APPROVED]: 'Approved',
};

export const STATUS_COLORS: Record<StepStatus, string> = {
  [StepStatus.LOCKED]: 'bg-slate-800 text-slate-400',
  [StepStatus.UNLOCKED]: 'bg-accent-500/15 text-accent-300',
  [StepStatus.APPROVED]: 'bg-emerald-500/15 text-emerald-300',
};
