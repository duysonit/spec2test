'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { projectsApi, workflowStepsApi, bugsApi, apisApi } from '@/lib/api';
import type { ProjectWithSteps, WorkflowStep, Bug, API } from '@/types';
import { STEP_LABELS, STATUS_LABELS, STATUS_COLORS, StepStatus, StepType, BugStatus, ProjectType } from '@/types';
import ReactMarkdown from 'react-markdown';
import { RequirementMindMap } from '@/components/RequirementMindMap';
import { LoadingScreen, Modal } from '@/components/ui';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import {
  ArrowLeft,
  ClipboardText,
  Target,
  PencilSimpleLine,
  Bug as BugIcon,
  FileText,
  Sparkle,
  ArrowsClockwise,
  PencilSimple,
  FloppyDisk,
  Check,
  CheckCircle,
  LockSimple,
  Plus,
  Trash,
  PlugsConnected,
} from '@phosphor-icons/react';

const STEP_ICONS: Record<string, React.ReactNode> = {
  requirement_analysis: <ClipboardText size={22} weight="fill" />,
  test_strategy: <Target size={22} weight="fill" />,
  test_case_design: <PencilSimpleLine size={22} weight="fill" />,
  bug_report: <BugIcon size={22} weight="fill" />,
};

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
    return <LoadingScreen />;
  }

  if (!project) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[rgb(var(--background))]">
        <div className="text-sm text-slate-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[rgb(var(--background))]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-accent-300"
          >
            <ArrowLeft size={16} weight="bold" />
            Back to projects
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-slate-400">{project.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {project.project_type === ProjectType.API_TESTING ? (
          <APIManagementView project={project} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left Sidebar */}
            <div className="space-y-4 lg:col-span-1">
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-100">Workflow</h2>
                <div className="space-y-1.5">
                  {project.workflow_steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step)}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          selectedStep?.id === step.id
                            ? 'border-accent-500 bg-accent-500/10'
                            : 'border-transparent bg-slate-800/50 hover:bg-slate-800'
                        }`}
                      >
                        <span className="mb-1.5 block text-sm font-medium text-slate-100">
                          {step.step_order}. {STEP_LABELS[step.step_type]}
                        </span>
                        <span className={`pill ${STATUS_COLORS[step.status]}`}>
                          {STATUS_LABELS[step.status]}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Requirement</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {project.requirement_text}
                </div>
                {project.context && (
                  <>
                    <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-100">Context</h3>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {project.context}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main */}
            <div className="space-y-6 lg:col-span-3">
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
                <div className="card p-8 text-center text-sm text-slate-400">
                  Select a workflow step to view details
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- shared step chrome ---------- */

function StepStatusBadge({ status }: { status: StepStatus }) {
  return <span className={`pill ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
}

function StepHeader({
  icon,
  title,
  subtitle,
  status,
  approvedAt,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: StepStatus;
  approvedAt?: string;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-800/40 px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <StepStatusBadge status={status} />
      </div>
      {status === StepStatus.APPROVED && approvedAt && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Check size={14} weight="bold" className="text-emerald-400" />
          Approved on {new Date(approvedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  icon,
  title,
  description,
}: {
  tone: 'locked' | 'approved';
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const styles =
    tone === 'approved'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{description}</p>
      </div>
    </div>
  );
}

const markdownClasses =
  'prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-code:rounded prose-code:bg-accent-500/15 prose-code:px-1 prose-code:py-0.5 prose-code:text-accent-300 prose-pre:bg-slate-950 prose-pre:text-slate-100';

/* ---------- StepDetail ---------- */

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
      await onApprove();
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

  if (isBugReportStep) {
    return <BugReportStepDetail step={step} onApprove={onApprove} />;
  }

  return (
    <div className="card overflow-hidden">
      <StepHeader
        icon={STEP_ICONS[step.step_type] || <FileText size={22} weight="fill" />}
        title={STEP_LABELS[step.step_type]}
        subtitle={`Step ${step.step_order} of 4`}
        status={step.status}
        approvedAt={step.approved_at}
      />

      {/* Action Bar */}
      <div className="border-b border-slate-800 bg-[rgb(var(--surface))] px-6 py-4">
        {isLocked && (
          <Notice
            tone="locked"
            icon={<LockSimple size={18} weight="fill" />}
            title="Step locked"
            description="Complete the previous step to unlock this one."
          />
        )}

        {!isLocked && !isApproved && (
          <div className="flex flex-wrap gap-3">
            {!step.draft_content ? (
              <ShimmerButton onClick={handleGenerateDraft} disabled={generating}>
                <Sparkle size={18} weight="fill" />
                {generating
                  ? isRequirementAnalysis ? 'Building draft...' : 'Generating draft...'
                  : isRequirementAnalysis ? 'Build testcase draft' : 'Generate AI draft'}
              </ShimmerButton>
            ) : !editing ? (
              <>
                <button onClick={handleGenerateDraft} disabled={generating} className="btn-secondary">
                  <ArrowsClockwise size={18} />
                  {generating
                    ? isRequirementAnalysis ? 'Rebuilding...' : 'Regenerating...'
                    : isRequirementAnalysis ? 'Rebuild draft' : 'Regenerate draft'}
                </button>
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  <PencilSimple size={18} />
                  Edit draft
                </button>
                <button onClick={handleApproveClick} disabled={approving} className="btn-primary ml-auto">
                  <Check size={18} weight="bold" />
                  {approving ? 'Approving...' : 'Approve & lock'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveDraft} disabled={saving} className="btn-primary">
                  <FloppyDisk size={18} />
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraftContent(step.draft_content || '');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {isApproved && (
          <Notice
            tone="approved"
            icon={<CheckCircle size={18} weight="fill" />}
            title="Step approved"
            description="This step is locked and the content is now immutable."
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {!step.draft_content && !isApproved ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-500">
              <FileText size={26} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-100">No draft yet</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-400">
              {isRequirementAnalysis
                ? 'Build a testcase draft with AI assistance, or start writing manually.'
                : 'Generate an AI draft, or start writing manually.'}
            </p>
          </div>
        ) : editing ? (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-sm text-slate-400">
              <PencilSimple size={15} />
              <span>Editing mode</span>
            </div>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="field-input h-[600px] font-mono text-xs"
              placeholder="Enter your content here..."
            />
          </div>
        ) : (
          <div className={markdownClasses}>
            <ReactMarkdown>{step.draft_content || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Bug report ---------- */

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
    <div className="card overflow-hidden">
      <StepHeader
        icon={<BugIcon size={22} weight="fill" />}
        title="Bug Report"
        subtitle="Step 4 of 4"
        status={step.status}
        approvedAt={step.approved_at}
      />

      <div className="border-b border-slate-800 bg-[rgb(var(--surface))] px-6 py-4">
        {isLocked && (
          <Notice
            tone="locked"
            icon={<LockSimple size={18} weight="fill" />}
            title="Step locked"
            description="Complete the previous step to unlock this one."
          />
        )}

        {!isLocked && !isApproved && (
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setShowAddBugModal(true)} className="btn-secondary">
              <Plus size={18} weight="bold" />
              Add new bug
            </button>
            {bugs.length > 0 && (
              <button onClick={handleApproveClick} disabled={approving} className="btn-primary">
                <Check size={18} weight="bold" />
                {approving ? 'Approving...' : `Approve ${bugs.length} bug${bugs.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {isApproved && (
          <Notice
            tone="approved"
            icon={<CheckCircle size={18} weight="fill" />}
            title="Step approved"
            description={`${bugs.length} bug${bugs.length > 1 ? 's' : ''} reported and locked.`}
          />
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Loading bugs...</div>
        ) : bugs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-500">
              <BugIcon size={26} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-100">No bugs yet</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-400">
              Add your first bug. The AI will help format it according to standards.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bugs.map((bug) => (
              <BugCard key={bug.id} bug={bug} onUpdate={fetchBugs} isLocked={isApproved} />
            ))}
          </div>
        )}
      </div>

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
    <div className="rounded-lg border border-slate-800 p-4 transition hover:border-accent-500/60">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`pill ${
              bug.status === BugStatus.FORMATTED
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {bug.status === BugStatus.FORMATTED ? 'Formatted' : 'Draft'}
          </span>
          <span className="text-xs text-slate-500">{new Date(bug.created_at).toLocaleString()}</span>
        </div>
        {!isLocked && (
          <div className="flex gap-1">
            {bug.status === BugStatus.DRAFT && (
              <button onClick={handleFormat} disabled={formatting} className="btn-ghost text-accent-600 hover:text-accent-700">
                <Sparkle size={15} weight="fill" />
                {formatting ? 'Formatting...' : 'Format'}
              </button>
            )}
            {bug.formatted_description && !editing && (
              <button onClick={() => setEditing(true)} className="btn-ghost">
                <PencilSimple size={15} />
                Edit
              </button>
            )}
            <button onClick={handleDelete} className="btn-danger-ghost">
              <Trash size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Original description</h4>
        <p className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300">{bug.original_description}</p>
      </div>

      {bug.formatted_description && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">AI-formatted report</h4>
          {editing ? (
            <div>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="field-input font-mono text-xs"
                rows={8}
              />
              <div className="mt-2 flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary">
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedDescription(bug.formatted_description || bug.original_description);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-lg bg-emerald-500/10 p-3 ${markdownClasses} prose-sm`}>
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
    <Modal onClose={onClose} title="Add new bug">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="field-label">Bug description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field-input"
            rows={6}
            placeholder="Describe the bug you found..."
          />
          <p className="mt-1.5 text-xs text-slate-400">
            After saving, you can use AI to format this bug according to standards.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add bug'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- API management ---------- */

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
      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
              <PlugsConnected size={22} weight="fill" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-100">API test case generation</h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Add your APIs and generate comprehensive test cases for each endpoint.
              </p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={18} weight="bold" />
            Add API
          </button>
        </div>

        {(project.requirement_text || project.context) && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            {project.requirement_text && (
              <div className="mb-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Additional requirements</h3>
                <div className="whitespace-pre-wrap rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300">
                  {project.requirement_text}
                </div>
              </div>
            )}
            {project.context && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Context</h3>
                <div className="whitespace-pre-wrap rounded-lg bg-slate-800/60 p-3 text-sm text-slate-300">
                  {project.context}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-slate-400">Loading APIs...</div>
      ) : apis.length === 0 ? (
        <div className="flex flex-col items-center rounded-card border border-dashed border-slate-700 bg-[rgb(var(--surface))] px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <PlugsConnected size={26} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-100">No APIs yet</h3>
          <p className="mt-1.5 max-w-md text-sm text-slate-400">
            Add your first API to start generating test cases. Each API can have its own test suite.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mt-6">
            <Plus size={18} weight="bold" />
            Add your first API
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apis.map((api) => (
            <APICard key={api.id} api={api} onUpdate={fetchApis} />
          ))}
        </div>
      )}

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

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-accent-500/15 text-accent-300',
  POST: 'bg-emerald-500/15 text-emerald-300',
  PUT: 'bg-amber-500/15 text-amber-300',
  PATCH: 'bg-orange-500/15 text-orange-300',
  DELETE: 'bg-rose-500/15 text-rose-300',
};

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
      <div className="card p-6 transition hover:border-accent-300 hover:shadow-card-hover">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-100">{api.name}</h3>
              <span className={`pill ${METHOD_COLORS[api.method] || 'bg-slate-800 text-slate-400'}`}>
                {api.method}
              </span>
              <span className="pill bg-slate-800 text-slate-400">{api.auth_type}</span>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2 font-mono text-sm text-slate-300">
              {api.endpoint_url}
            </div>
          </div>
          <button onClick={handleDelete} className="btn-danger-ghost" title="Delete API">
            <Trash size={16} />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Specification</h4>
          <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-800/60 p-3 font-mono text-xs text-slate-300">
            {api.specification.substring(0, 300)}
            {api.specification.length > 300 && '...'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!api.generated_test_cases ? (
            <ShimmerButton onClick={handleGenerateTestCases} disabled={generating}>
              <Sparkle size={18} weight="fill" />
              {generating ? 'Generating test cases...' : 'Generate test cases'}
            </ShimmerButton>
          ) : (
            <>
              <button onClick={() => setShowTestCases(true)} className="btn-primary">
                <FileText size={18} />
                View test cases
              </button>
              <button onClick={handleGenerateTestCases} disabled={generating} className="btn-secondary">
                <ArrowsClockwise size={18} />
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </>
          )}
        </div>

        {api.generated_test_cases && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5">
            <Check size={16} weight="bold" className="mt-0.5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Test cases generated</p>
              <p className="mt-0.5 text-xs text-emerald-400/80">
                Generated on {new Date(api.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {showTestCases && api.generated_test_cases && (
        <ViewTestCasesModal api={api} onClose={() => setShowTestCases(false)} onUpdate={onUpdate} />
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
    <Modal onClose={onClose} title="Add new API" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label">API name</label>
          <input
            type="text"
            required
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. User Login API"
          />
        </div>

        <div>
          <label className="field-label">Endpoint URL</label>
          <input
            type="text"
            required
            className="field-input font-mono text-sm"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://api.example.com/v1/users/login"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">HTTP method</label>
            <select
              required
              className="field-input"
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
            <label className="field-label">Authentication type</label>
            <select
              required
              className="field-input"
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
          <label className="field-label">API specification</label>
          <textarea
            required
            rows={12}
            className="field-input font-mono text-xs"
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            placeholder="Paste your OpenAPI/Swagger specification or detailed API documentation here..."
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Include request parameters, body schema, response format, and validation rules.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add API'}
          </button>
        </div>
      </form>
    </Modal>
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
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update test cases');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={api.name} size="xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          Last updated: {new Date(api.updated_at).toLocaleString()}
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary">
            <PencilSimple size={16} />
            Edit test cases
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <FloppyDisk size={16} />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditedContent(api.generated_test_cases || '');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="field-input min-h-[500px] font-mono text-xs"
        />
      ) : (
        <div className={markdownClasses}>
          <ReactMarkdown>{api.generated_test_cases || ''}</ReactMarkdown>
        </div>
      )}
    </Modal>
  );
}
