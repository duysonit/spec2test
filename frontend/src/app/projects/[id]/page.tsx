'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { projectsApi, workflowStepsApi, bugsApi, apisApi } from '@/lib/api';
import type { ProjectWithSteps, WorkflowStep, Bug, API } from '@/types';
import { STEP_LABELS, STATUS_LABELS, STATUS_COLORS, StepStatus, StepType, BugStatus, ProjectType } from '@/types';
import ReactMarkdown from 'react-markdown';
import { RequirementMindMap } from '@/components/RequirementMindMap';

export default function ProjectDetailPage() {
  const [project, setProject] = useState<ProjectWithSteps | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchProject();
  }, [user, router, projectId]);

  const fetchProject = async () => {
    try {
      const response = await projectsApi.get(projectId);
      setProject(response.data);
      if (response.data.workflow_steps.length > 0) {
        setSelectedStep(response.data.workflow_steps[0]);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStep = async (stepId: number) => {
    try {
      const response = await workflowStepsApi.get(stepId);
      setSelectedStep(response.data);
      // Update in project steps list
      if (project) {
        const updatedSteps = project.workflow_steps.map((s) =>
          s.id === stepId ? response.data : s
        );
        setProject({ ...project, workflow_steps: updatedSteps });
      }
    } catch (error) {
      console.error('Failed to refresh step:', error);
    }
  };

  const refreshEntireProject = async () => {
    try {
      const response = await projectsApi.get(projectId);
      setProject(response.data);
      // Update selected step if it exists
      if (selectedStep) {
        const updatedSelectedStep = response.data.workflow_steps.find(
          (s: WorkflowStep) => s.id === selectedStep.id
        );
        if (updatedSelectedStep) {
          setSelectedStep(updatedSelectedStep);
        }
      }
    } catch (error) {
      console.error('Failed to refresh project:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Projects
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {project.project_type === ProjectType.API_TESTING ? (
          <APIManagementView project={project} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Workflow Steps */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Workflow</h2>
                <div className="space-y-2">
                  {project.workflow_steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          selectedStep?.id === step.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {step.step_order}. {STEP_LABELS[step.step_type]}
                          </span>
                        </div>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            STATUS_COLORS[step.status]
                          }`}
                        >
                          {STATUS_LABELS[step.status]}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Requirement Info */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Requirement</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {project.requirement_text}
                </div>
                {project.context && (
                  <>
                    <h3 className="font-semibold text-gray-900 mt-4 mb-2">Context</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {project.context}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main Content - Step Detail */}
            <div className="lg:col-span-3 space-y-6">
              {selectedStep?.step_type === StepType.REQUIREMENT_ANALYSIS && (
                <RequirementMindMap
                  requirementText={project.requirement_text}
                  featureTitle={project.name}
                />
              )}
              {selectedStep ? (
                <StepDetail
                  step={selectedStep}
                  onRefresh={() => refreshStep(selectedStep.id)}
                  onApprove={refreshEntireProject}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Select a workflow step to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StepDetail({
  step,
  onRefresh,
  onApprove,
}: {
  step: WorkflowStep;
  onRefresh: () => void;
  onApprove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(step.draft_content || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    setDraftContent(step.draft_content || '');
    setEditing(false);
  }, [step.id, step.draft_content]);

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      await workflowStepsApi.generateDraft(step.id);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await workflowStepsApi.updateDraft(step.id, draftContent);
      setEditing(false);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveClick = async () => {
    if (!confirm('Are you sure you want to approve this step? This action cannot be undone and will unlock the next step.')) {
      return;
    }

    setApproving(true);
    try {
      await workflowStepsApi.approve(step.id);
      await onApprove(); // Refresh entire project to update all steps
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to approve step');
    } finally {
      setApproving(false);
    }
  };

  const isLocked = step.status === StepStatus.LOCKED;
  const isApproved = step.status === StepStatus.APPROVED;
  const isBugReportStep = step.step_type === StepType.BUG_REPORT;
  const isRequirementAnalysis = step.step_type === StepType.REQUIREMENT_ANALYSIS;

  // Get step icon
  const getStepIcon = () => {
    switch (step.step_type) {
      case 'requirement_analysis':
        return '📋';
      case 'test_strategy':
        return '🎯';
      case 'test_case_design':
        return '📝';
      case 'bug_report':
        return '🐛';
      default:
        return '📄';
    }
  };

  // If this is a bug report step, render bug list UI
  if (isBugReportStep) {
    return <BugReportStepDetail step={step} onApprove={onApprove} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Step Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getStepIcon()}</span>
            <div>
              <h2 className="text-2xl font-bold">
                {STEP_LABELS[step.step_type]}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Step {step.step_order} of 4
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
            step.status === StepStatus.APPROVED
              ? 'bg-green-500 text-white'
              : step.status === StepStatus.UNLOCKED
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-400 text-white'
          }`}>
            {STATUS_LABELS[step.status]}
          </span>
        </div>

        {isApproved && step.approved_at && (
          <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 text-sm">
            ✓ Approved on {new Date(step.approved_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        {isLocked && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold text-yellow-900">Step Locked</p>
              <p className="text-sm text-yellow-800 mt-1">
                Complete the previous step to unlock this one
              </p>
            </div>
          </div>
        )}

        {!isLocked && !isApproved && (
          <div className="flex flex-wrap gap-3">
            {!step.draft_content ? (
              <button
                onClick={handleGenerateDraft}
                disabled={generating}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md font-semibold"
              >
                <span className="text-xl">✨</span>
                {generating
                  ? isRequirementAnalysis
                    ? 'Building Testcase Draft...'
                    : 'Generating AI Draft...'
                  : isRequirementAnalysis
                    ? 'Build Testcase Draft'
                    : 'Generate AI Draft'}
              </button>
            ) : (
              <>
                {!editing ? (
                  <>
                    <button
                      onClick={handleGenerateDraft}
                      disabled={generating}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md font-semibold"
                      title="Generate a new AI draft (will replace current draft)"
                    >
                      <span className="text-xl">🔄</span>
                      {generating
                        ? isRequirementAnalysis
                          ? 'Rebuilding...'
                          : 'Regenerating...'
                        : isRequirementAnalysis
                          ? 'Rebuild Testcase Draft'
                          : 'Regenerate AI Draft'}
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition shadow-md font-semibold"
                    >
                      <span className="text-xl">✏️</span>
                      Edit Draft
                    </button>
                    <button
                      onClick={handleApproveClick}
                      disabled={approving}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md font-semibold ml-auto"
                    >
                      <span className="text-xl">✓</span>
                      {approving ? 'Approving...' : 'Approve & Lock'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition shadow-md font-semibold"
                    >
                      <span className="text-xl">💾</span>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setDraftContent(step.draft_content || '');
                      }}
                      className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {isApproved && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-900">Step Approved</p>
              <p className="text-sm text-green-800 mt-1">
                This step is locked and the content is now immutable
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="p-6">
        {!step.draft_content && !isApproved ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <span className="text-6xl opacity-50">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Draft Yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {isRequirementAnalysis
                ? 'Click "Build Testcase Draft" to use AI assistance, or start writing manually'
                : 'Click "Generate AI Draft" to use AI assistance, or start writing manually'}
            </p>
          </div>
        ) : editing ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              <span>✏️</span>
              <span>Editing mode - Make your changes below</span>
            </div>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="w-full h-[600px] px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
              placeholder="Enter your content here..."
            />
          </div>
        ) : (
          <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
            <ReactMarkdown>{step.draft_content || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function BugReportStepDetail({
  step,
  onApprove,
}: {
  step: WorkflowStep;
  onApprove: () => void;
}) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBugModal, setShowAddBugModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchBugs();
  }, [step.id]);

  const fetchBugs = async () => {
    try {
      const response = await bugsApi.list(step.id);
      setBugs(response.data);
    } catch (error) {
      console.error('Failed to fetch bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = async () => {
    if (bugs.length === 0) {
      alert('Please add at least one bug before approving.');
      return;
    }

    if (!confirm('Are you sure you want to approve this step? This action cannot be undone and will unlock the next step.')) {
      return;
    }

    setApproving(true);
    try {
      await workflowStepsApi.approve(step.id);
      await onApprove();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to approve step');
    } finally {
      setApproving(false);
    }
  };

  const isLocked = step.status === StepStatus.LOCKED;
  const isApproved = step.status === StepStatus.APPROVED;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Step Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🐛</span>
            <div>
              <h2 className="text-2xl font-bold">Bug Report</h2>
              <p className="text-orange-100 text-sm mt-1">Step 4 of 4</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
            step.status === StepStatus.APPROVED
              ? 'bg-green-500 text-white'
              : step.status === StepStatus.UNLOCKED
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-400 text-white'
          }`}>
            {STATUS_LABELS[step.status]}
          </span>
        </div>

        {isApproved && step.approved_at && (
          <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 text-sm">
            ✓ Approved on {new Date(step.approved_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        {isLocked && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold text-yellow-900">Step Locked</p>
              <p className="text-sm text-yellow-800 mt-1">
                Complete the previous step to unlock this one
              </p>
            </div>
          </div>
        )}

        {!isLocked && !isApproved && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddBugModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition shadow-md font-semibold"
            >
              <span className="text-xl">+</span>
              Add New Bug
            </button>
            {bugs.length > 0 && (
              <button
                onClick={handleApproveClick}
                disabled={approving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md font-semibold"
              >
                <span className="text-xl">✓</span>
                {approving ? 'Approving...' : `Approve ${bugs.length} Bug${bugs.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {isApproved && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-900">Step Approved</p>
              <p className="text-sm text-green-800 mt-1">
                {bugs.length} bug{bugs.length > 1 ? 's' : ''} reported and locked
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bug List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading bugs...</div>
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <span className="text-6xl opacity-50">🐛</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Bugs Yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Click "Add New Bug" to report your first bug. The AI will help format it according to standards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bugs.map((bug) => (
              <BugCard
                key={bug.id}
                bug={bug}
                onUpdate={fetchBugs}
                isLocked={isApproved}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Bug Modal */}
      {showAddBugModal && (
        <AddBugModal
          stepId={step.id}
          onClose={() => setShowAddBugModal(false)}
          onSuccess={() => {
            setShowAddBugModal(false);
            fetchBugs();
          }}
        />
      )}
    </div>
  );
}

function BugCard({
  bug,
  onUpdate,
  isLocked,
}: {
  bug: Bug;
  onUpdate: () => void;
  isLocked: boolean;
}) {
  const [formatting, setFormatting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(bug.formatted_description || bug.original_description);

  const handleFormat = async () => {
    setFormatting(true);
    try {
      await bugsApi.format(bug.id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to format bug');
    } finally {
      setFormatting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await bugsApi.update(bug.id, { formatted_description: editedDescription });
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update bug');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bug?')) {
      return;
    }

    try {
      await bugsApi.delete(bug.id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete bug');
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            bug.status === BugStatus.FORMATTED
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {bug.status === BugStatus.FORMATTED ? '✓ Formatted' : 'Draft'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(bug.created_at).toLocaleString()}
          </span>
        </div>
        {!isLocked && (
          <div className="flex gap-2">
            {bug.status === BugStatus.DRAFT && (
              <button
                onClick={handleFormat}
                disabled={formatting}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                {formatting ? '✨ Formatting...' : '✨ Format with AI'}
              </button>
            )}
            {bug.formatted_description && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-600 mb-1">Original Description:</h4>
        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{bug.original_description}</p>
      </div>

      {bug.formatted_description && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-1">AI-Formatted Report:</h4>
          {editing ? (
            <div>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={8}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedDescription(bug.formatted_description || bug.original_description);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm bg-green-50 p-3 rounded prose prose-sm max-w-none">
              <ReactMarkdown>{bug.formatted_description}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddBugModal({
  stepId,
  onClose,
  onSuccess,
}: {
  stepId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await bugsApi.create(stepId, { original_description: description });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create bug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Add New Bug</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bug Description *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={6}
              placeholder="Describe the bug you found..."
            />
            <p className="text-xs text-gray-500 mt-1">
              After saving, you can use AI to format this bug according to standards.
            </p>
          </div>
          <div className="flex justify-end gap-3">
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
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Adding...' : 'Add Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function APIManagementView({ project }: { project: ProjectWithSteps }) {
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchApis();
  }, [project.id]);

  const fetchApis = async () => {
    try {
      const response = await apisApi.list(project.id);
      setApis(response.data);
    } catch (error) {
      console.error('Failed to fetch APIs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">🔌</span>
              API Test Case Generation
            </h2>
            <p className="text-gray-600 mt-1">
              Add your APIs and generate comprehensive test cases for each endpoint
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md font-semibold"
          >
            <span className="text-xl">+</span>
            Add API
          </button>
        </div>

        {/* Project Info */}
        {(project.requirement_text || project.context) && (
          <div className="border-t pt-4 mt-4">
            {project.requirement_text && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Additional Requirements:</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {project.requirement_text}
                </div>
              </div>
            )}
            {project.context && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Context:</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {project.context}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">Loading APIs...</div>
        </div>
      ) : apis.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
            <span className="text-6xl opacity-50">🔌</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No APIs Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add your first API to start generating test cases. Each API can have its own test suite.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Add Your First API
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apis.map((api) => (
            <APICard key={api.id} api={api} onUpdate={fetchApis} />
          ))}
        </div>
      )}

      {/* Add API Modal */}
      {showAddModal && (
        <AddAPIModal
          projectId={project.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchApis();
          }}
        />
      )}
    </div>
  );
}

function APICard({ api, onUpdate }: { api: API; onUpdate: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);

  const handleGenerateTestCases = async () => {
    setGenerating(true);
    try {
      await apisApi.generateTestCases(api.id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to generate test cases');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the API "${api.name}"?`)) {
      return;
    }

    try {
      await apisApi.delete(api.id);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete API');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-300 transition">
        <div className="p-6">
          {/* API Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{api.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                  api.method === 'POST' ? 'bg-green-100 text-green-700' :
                  api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                  api.method === 'PATCH' ? 'bg-orange-100 text-orange-700' :
                  api.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {api.method}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  {api.auth_type}
                </span>
              </div>
              <div className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded">
                {api.endpoint_url}
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 ml-4"
              title="Delete API"
            >
              🗑️
            </button>
          </div>

          {/* Specification Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Specification:</h4>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded font-mono max-h-32 overflow-y-auto">
              {api.specification.substring(0, 300)}
              {api.specification.length > 300 && '...'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!api.generated_test_cases ? (
              <button
                onClick={handleGenerateTestCases}
                disabled={generating}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md font-semibold"
              >
                <span className="text-xl">✨</span>
                {generating ? 'Generating Test Cases...' : 'Generate Test Cases'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowTestCases(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md font-semibold"
                >
                  <span className="text-xl">📄</span>
                  View Test Cases
                </button>
                <button
                  onClick={handleGenerateTestCases}
                  disabled={generating}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition shadow-md font-semibold"
                >
                  <span className="text-xl">🔄</span>
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </>
            )}
          </div>

          {/* Test Case Status */}
          {api.generated_test_cases && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg p-3 flex items-start gap-2">
              <span className="text-xl">✓</span>
              <div>
                <p className="text-sm font-semibold text-green-900">Test Cases Generated</p>
                <p className="text-xs text-green-800 mt-1">
                  Generated on {new Date(api.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Test Cases Modal */}
      {showTestCases && api.generated_test_cases && (
        <ViewTestCasesModal
          api={api}
          onClose={() => setShowTestCases(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

function AddAPIModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [authType, setAuthType] = useState('None');
  const [specification, setSpecification] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apisApi.create(projectId, {
        name,
        endpoint_url: endpointUrl,
        method,
        auth_type: authType,
        specification,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New API</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., User Login API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://api.example.com/v1/users/login"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTTP Method *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authentication Type *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
              >
                <option value="None">None</option>
                <option value="Bearer Token">Bearer Token</option>
                <option value="Basic Auth">Basic Auth</option>
                <option value="API Key">API Key</option>
                <option value="OAuth 2.0">OAuth 2.0</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Specification *
            </label>
            <textarea
              required
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="Paste your OpenAPI/Swagger specification or detailed API documentation here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Include request parameters, body schema, response format, and validation rules.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Adding...' : 'Add API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewTestCasesModal({
  api,
  onClose,
  onUpdate,
}: {
  api: API;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(api.generated_test_cases || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apisApi.update(api.id, { generated_test_cases: editedContent });
      setEditing(false);
      onUpdate();
      alert('Test cases updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update test cases');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{api.name}</h2>
              <p className="text-green-100 text-sm">Generated Test Cases</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {new Date(api.updated_at).toLocaleString()}
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
            >
              <span>✏️</span>
              Edit Test Cases
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold text-sm"
              >
                <span>💾</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedContent(api.generated_test_cases || '');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[500px] px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          ) : (
            <div className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown>{api.generated_test_cases || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
