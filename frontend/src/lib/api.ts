import axios from 'axios';
import type {
  User,
  AuthResponse,
  Project,
  ProjectWithSteps,
  WorkflowStep,
  Artifact,
  AIExecutionLog,
  PromptTemplate,
  Bug,
  API,
  ProjectType,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    api.post<User>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  me: () => api.get<User>('/api/auth/me'),
};

// Projects API
export const projectsApi = {
  list: () => api.get<Project[]>('/api/projects'),

  get: (id: number) => api.get<ProjectWithSteps>(`/api/projects/${id}`),

  create: (data: {
    name: string;
    description?: string;
    project_type?: ProjectType;
    requirement_text?: string;
    context?: string;
  }) => api.post<ProjectWithSteps>('/api/projects', data),

  update: (id: number, data: { name?: string; description?: string; status?: string }) =>
    api.put<Project>(`/api/projects/${id}`, data),

  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

// Workflow Steps API
export const workflowStepsApi = {
  get: (id: number) => api.get<WorkflowStep>(`/api/workflow-steps/${id}`),

  generateDraft: (id: number) =>
    api.post<WorkflowStep>(`/api/workflow-steps/${id}/generate-draft`, {}),

  updateDraft: (id: number, content: string) =>
    api.put<WorkflowStep>(`/api/workflow-steps/${id}/draft`, { draft_content: content }),

  approve: (id: number) =>
    api.post<Artifact>(`/api/workflow-steps/${id}/approve`, {}),

  getLogs: (id: number) =>
    api.get<AIExecutionLog[]>(`/api/workflow-steps/${id}/logs`),
};

// Prompt Templates API
export const promptTemplatesApi = {
  list: (stepType?: string, activeOnly: boolean = true) =>
    api.get<PromptTemplate[]>('/api/prompt-templates', {
      params: { step_type: stepType, active_only: activeOnly },
    }),

  get: (id: number) => api.get<PromptTemplate>(`/api/prompt-templates/${id}`),

  create: (data: {
    step_type: string;
    system_prompt: string;
    user_prompt_template: string;
  }) => api.post<PromptTemplate>('/api/prompt-templates', data),

  update: (id: number, data: { system_prompt: string; user_prompt_template: string }) =>
    api.put<PromptTemplate>(`/api/prompt-templates/${id}`, data),

  delete: (id: number) => api.delete(`/api/prompt-templates/${id}`),
};

// Bugs API
export const bugsApi = {
  list: (stepId: number) => api.get<Bug[]>(`/api/workflow-steps/${stepId}/bugs`),

  create: (stepId: number, data: { original_description: string }) =>
    api.post<Bug>(`/api/workflow-steps/${stepId}/bugs`, data),

  format: (bugId: number) => api.post<Bug>(`/api/bugs/${bugId}/format`, {}),

  update: (bugId: number, data: { original_description?: string; formatted_description?: string }) =>
    api.put<Bug>(`/api/bugs/${bugId}`, data),

  delete: (bugId: number) => api.delete(`/api/bugs/${bugId}`),
};

// APIs for API Testing Projects
export const apisApi = {
  list: (projectId: number) => api.get<API[]>(`/api/projects/${projectId}/apis`),

  create: (
    projectId: number,
    data: {
      name: string;
      endpoint_url: string;
      method: string;
      auth_type: string;
      specification: string;
    }
  ) => api.post<API>(`/api/projects/${projectId}/apis`, data),

  generateTestCases: (apiId: number) => api.post<API>(`/api/apis/${apiId}/generate-test-cases`, {}),

  update: (
    apiId: number,
    data: {
      name?: string;
      endpoint_url?: string;
      method?: string;
      auth_type?: string;
      specification?: string;
      generated_test_cases?: string;
    }
  ) => api.put<API>(`/api/apis/${apiId}`, data),

  delete: (apiId: number) => api.delete(`/api/apis/${apiId}`),
};

export const filesApi = {
  extractText: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ text: string }>('/api/files/extract-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
