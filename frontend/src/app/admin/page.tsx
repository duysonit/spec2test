'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { promptTemplatesApi } from '@/lib/api';
import type { PromptTemplate } from '@/types';
import { STEP_LABELS, StepType } from '@/types';

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600">Prompt Template Management</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Dashboard
            </button>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Prompt Templates</h2>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Template
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {STEP_LABELS[template.step_type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    v{template.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        template.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(template.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    {template.is_active && (
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Template Modal */}
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
    </div>
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
        // Update (creates new version)
        await promptTemplatesApi.update(template.id, {
          system_prompt: systemPrompt,
          user_prompt_template: userPromptTemplate,
        });
      } else {
        // Create new
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {isViewOnly ? 'View Template' : template ? 'Update Template' : 'Create Template'}
        </h2>
        {error && <div className="bg-red-50 text-red-800 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Type *
            </label>
            <select
              required
              disabled={!!template}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt *
            </label>
            <textarea
              required
              disabled={isViewOnly}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:bg-gray-100"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Prompt Template *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use placeholders: {'{requirement_text}'}, {'{context}'}
            </p>
            <textarea
              required
              disabled={isViewOnly}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:bg-gray-100"
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : template ? 'Create New Version' : 'Create Template'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
