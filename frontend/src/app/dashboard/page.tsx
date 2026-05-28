'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import { ProjectType } from '@/types';
import { format } from 'date-fns';
import { RequirementTextFileImport } from '@/components/RequirementTextFileImport';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchProjects();
  }, [user, router]);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      await fetchProjects();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete project');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const standardProjects = projects.filter(p => p.project_type === ProjectType.STANDARD);
  const apiTestingProjects = projects.filter(p => p.project_type === ProjectType.API_TESTING);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Spec2Test</h1>
          <div className="flex items-center gap-4">
            {user?.is_admin && (
              <button
                onClick={() => router.push('/admin')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Admin Panel
              </button>
            )}
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <span className="text-6xl">📁</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Projects Yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Standard QC Projects */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📋</span>
                <h3 className="text-2xl font-bold text-gray-900">Standard QC Projects</h3>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {standardProjects.length}
                </span>
              </div>
              {standardProjects.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No standard QC projects yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {standardProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onNavigate={() => router.push(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* API Testing Projects */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🔌</span>
                <h3 className="text-2xl font-bold text-gray-900">API Testing Projects</h3>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {apiTestingProjects.length}
                </span>
              </div>
              {apiTestingProjects.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No API testing projects yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apiTestingProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onNavigate={() => router.push(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  onNavigate,
}: {
  project: Project;
  onDelete: (id: number, name: string) => void;
  onNavigate: () => void;
}) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id, project.name);
  };

  return (
    <div
      onClick={onNavigate}
      className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer p-6 border-2 border-transparent hover:border-blue-300 relative group"
    >
      {/* Delete Button */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
        title="Delete project"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Project Type Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          project.project_type === ProjectType.API_TESTING
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          <span>{project.project_type === ProjectType.API_TESTING ? '🔌' : '📋'}</span>
          {project.project_type === ProjectType.API_TESTING ? 'API Testing' : 'Standard QC'}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2 pr-8">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
        <span className={`px-2 py-1 rounded capitalize ${
          project.status === 'active' ? 'bg-green-100 text-green-700' :
          project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {project.status}
        </span>
        <span>{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
      </div>
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.STANDARD);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirementText, setRequirementText] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mergeImportedRequirement = (text: string) => {
    setRequirementText((prev) =>
      prev.trim() ? `${prev}\n\n--- Imported from file ---\n\n${text}` : text
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await projectsApi.create({
        name,
        description: description || undefined,
        project_type: projectType,
        requirement_text: requirementText || undefined,
        context: context || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProjectType(ProjectType.STANDARD)}
                className={`p-4 border-2 rounded-lg transition ${
                  projectType === ProjectType.STANDARD
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold">Standard QC</div>
                <div className="text-xs text-gray-600 mt-1">Regular testing workflow</div>
              </button>
              <button
                type="button"
                onClick={() => setProjectType(ProjectType.API_TESTING)}
                className={`p-4 border-2 rounded-lg transition ${
                  projectType === ProjectType.API_TESTING
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">🔌</div>
                <div className="font-semibold">API Testing</div>
                <div className="text-xs text-gray-600 mt-1">API test case generation</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {projectType === ProjectType.STANDARD && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirement Text *
              </label>
              <RequirementTextFileImport onTextImported={mergeImportedRequirement} disabled={loading} />
              <textarea
                required={projectType === ProjectType.STANDARD}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                placeholder="Enter the requirement specification..."
              />
            </div>
          )}

          {projectType === ProjectType.API_TESTING && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Requirements
              </label>
              <RequirementTextFileImport onTextImported={mergeImportedRequirement} disabled={loading} />
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                placeholder="Additional testing requirements or business rules (optional)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                After creating the project, you can add API details individually.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Context
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Domain, system, user role information..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
