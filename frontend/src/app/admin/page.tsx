'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { promptTemplatesApi } from '@/lib/api';
import type { PromptTemplate } from '@/types';
import { STEP_LABELS, StepType } from '@/types';
import { AppShell, LoadingScreen, Modal } from '@/components/ui';
import { Plus, Eye, PencilSimple, SquaresFour, GearSix } from '@phosphor-icons/react';

export default function AdminPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (!user.is_admin) {
      router.push('/dashboard');
      return;
    }
    fetchTemplates();
  }, [user, router]);

  const fetchTemplates = async () => {
    try {
      const response = await promptTemplatesApi.list(undefined, false);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const nav = [
    {
      label: 'Projects',
      icon: <SquaresFour size={18} weight="fill" />,
      onClick: () => router.push('/dashboard'),
    },
    {
      label: 'Admin',
      icon: <GearSix size={18} weight="fill" />,
      active: true,
      onClick: () => router.push('/admin'),
    },
  ];

  return (
    <AppShell
      user={user}
      nav={nav}
      onLogout={handleLogout}
      onHome={() => router.push('/dashboard')}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Prompt templates</h2>
            <p className="mt-1 text-sm text-slate-400">
              Version-controlled prompts for each workflow step
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} weight="bold" />
            New template
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-card border border-slate-800 bg-[rgb(var(--surface))] shadow-card">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                {['Step type', 'Version', 'Status', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {templates.map((template) => (
                <tr key={template.id} className="transition hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-100">
                    {STEP_LABELS[template.step_type]}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    v{template.version}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`pill ${
                        template.is_active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    {new Date(template.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowModal(true);
                      }}
                      className="btn-ghost"
                    >
                      {template.is_active ? (
                        <>
                          <PencilSimple size={16} />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          View
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowModal(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </AppShell>
  );
}

function TemplateModal({
  template,
  onClose,
  onSuccess,
}: {
  template: PromptTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stepType, setStepType] = useState<StepType>(
    template?.step_type || StepType.REQUIREMENT_ANALYSIS
  );
  const [systemPrompt, setSystemPrompt] = useState(template?.system_prompt || '');
  const [userPromptTemplate, setUserPromptTemplate] = useState(
    template?.user_prompt_template || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (template) {
        await promptTemplatesApi.update(template.id, {
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
        });
      } else {
        await promptTemplatesApi.create({
          step_type: stepType,
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const isViewOnly = Boolean(template && !template.is_active);
  const title = isViewOnly ? 'View template' : template ? 'Update template' : 'Create template';

  return (
    <Modal onClose={onClose} title={title} size="lg">
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label">Step type</label>
          <select
            required
            disabled={!!template}
            className="field-input disabled:opacity-60"
            value={stepType}
            onChange={(e) => setStepType(e.target.value as StepType)}
          >
            {Object.entries(STEP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">System prompt</label>
          <textarea
            required
            disabled={isViewOnly}
            rows={6}
            className="field-input font-mono text-xs disabled:opacity-60"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">User prompt template</label>
          <p className="mb-2 text-xs text-slate-400">
            Use placeholders: {'{requirement_text}'}, {'{context}'}
          </p>
          <textarea
            required
            disabled={isViewOnly}
            rows={10}
            className="field-input font-mono text-xs disabled:opacity-60"
            value={userPromptTemplate}
            onChange={(e) => setUserPromptTemplate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : template ? 'Create new version' : 'Create template'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
