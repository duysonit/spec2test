'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { projectsApi } from '@/lib/api';
import { ProjectType } from '@/types';
import { RequirementTextFileImport } from '@/components/RequirementTextFileImport';
import { LoadingScreen } from '@/components/ui';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { ClipboardText, PlugsConnected, CheckCircle, ArrowLeft } from '@phosphor-icons/react';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.STANDARD);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirementText, setRequirementText] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  if (!user) return <LoadingScreen />;

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
      const res = await projectsApi.create({
        name,
        description: description || undefined,
        project_type: projectType,
        requirement_text: requirementText || undefined,
        context: context || undefined,
      });
      const id = res.data?.id;
      router.push(id ? `/projects/${id}` : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--background))]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[rgb(var(--background))]/80 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn-ghost"
        >
          <ArrowLeft size={16} weight="bold" />
          Back
        </button>
        <span className="text-sm font-medium text-slate-300">New Project</span>
        <div className="w-16" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Let&apos;s build something new
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Pick a workflow, describe what you&apos;re testing, and let AI draft the rest.
        </p>

        {error && (
          <div className="mt-6 rounded border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Project type */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Project type</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TypeOption
                active={projectType === ProjectType.STANDARD}
                onClick={() => setProjectType(ProjectType.STANDARD)}
                icon={<ClipboardText size={22} weight="fill" />}
                title="Standard QC"
                subtitle="Requirement → strategy → cases → bugs"
              />
              <TypeOption
                active={projectType === ProjectType.API_TESTING}
                onClick={() => setProjectType(ProjectType.API_TESTING)}
                icon={<PlugsConnected size={22} weight="fill" />}
                title="API Testing"
                subtitle="Generate test cases per endpoint"
              />
            </div>
          </section>

          {/* Basics */}
          <section className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="field-label">Project name</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Checkout flow regression"
                />
              </div>
              <div>
                <label className="field-label">
                  Description <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  className="field-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of what this project covers"
                />
              </div>
            </div>
          </section>

          {/* Requirement / API */}
          <section className="card p-6">
            {projectType === ProjectType.STANDARD ? (
              <div>
                <label className="field-label">Requirement text</label>
                <RequirementTextFileImport onTextImported={mergeImportedRequirement} disabled={loading} />
                <textarea
                  required
                  rows={7}
                  className="field-input mt-2"
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  placeholder="Paste or write the requirement specification..."
                />
              </div>
            ) : (
              <div>
                <label className="field-label">
                  Additional requirements <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <RequirementTextFileImport onTextImported={mergeImportedRequirement} disabled={loading} />
                <textarea
                  rows={5}
                  className="field-input mt-2"
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  placeholder="Business rules or testing notes (optional)..."
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  You can add API endpoints individually after creating the project.
                </p>
              </div>
            )}

            <div className="mt-5">
              <label className="field-label">
                Context <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                rows={3}
                className="field-input"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Domain, system, or user role information..."
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">
              Cancel
            </button>
            <ShimmerButton type="submit" disabled={loading} className="px-5">
              {loading ? 'Creating...' : 'Create project'}
            </ShimmerButton>
          </div>
        </form>
      </main>
    </div>
  );
}

function TypeOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex items-start gap-3 rounded-card border p-4 text-left transition ${
        active
          ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500'
          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-accent-500/20 text-accent-300' : 'bg-slate-800 text-slate-400'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-100">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{subtitle}</span>
      </span>
      {active && (
        <CheckCircle size={18} weight="fill" className="absolute right-3 top-3 text-accent-400" />
      )}
    </button>
  );
}
