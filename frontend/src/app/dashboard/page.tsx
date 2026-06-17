'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import { ProjectType } from '@/types';
import { format } from 'date-fns';
import { AppShell, LoadingScreen, EmptyState } from '@/components/ui';
import { MagicCard } from '@/components/magicui/magic-card';
import { BlurFade } from '@/components/magicui/blur-fade';
import {
  Plus,
  Trash,
  ClipboardText,
  PlugsConnected,
  FolderOpen,
  SquaresFour,
  GearSix,
  MagnifyingGlass,
  GridFour,
  ListBullets,
  ArrowRight,
} from '@phosphor-icons/react';

type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');
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

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesType = typeFilter === 'all' || p.project_type === typeFilter;
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [projects, query, typeFilter]);

  if (loading) {
    return <LoadingScreen />;
  }

  const nav = [
    {
      label: 'Projects',
      icon: <SquaresFour size={18} weight="fill" />,
      active: true,
      onClick: () => router.push('/dashboard'),
    },
    ...(user?.is_admin
      ? [
          {
            label: 'Admin',
            icon: <GearSix size={18} />,
            onClick: () => router.push('/admin'),
          },
        ]
      : []),
  ];

  const topbar = (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-300">All Projects</span>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="h-9 w-56 rounded border-2 border-slate-600 bg-[rgb(var(--surface-2))] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-accent-500 focus:outline-none"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded border border-slate-700 bg-[rgb(var(--surface-2))] p-0.5">
          <button
            onClick={() => setView('grid')}
            aria-label="Grid view"
            className={`rounded p-1.5 transition-colors ${
              view === 'grid' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <GridFour size={16} weight={view === 'grid' ? 'fill' : 'regular'} />
          </button>
          <button
            onClick={() => setView('list')}
            aria-label="List view"
            className={`rounded p-1.5 transition-colors ${
              view === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ListBullets size={16} weight={view === 'list' ? 'bold' : 'regular'} />
          </button>
        </div>

        <button onClick={() => router.push('/projects/new')} className="btn-primary h-9 px-3">
          <Plus size={16} weight="bold" />
          Add New
        </button>
      </div>
    </div>
  );

  return (
    <AppShell
      user={user}
      nav={nav}
      onLogout={handleLogout}
      onHome={() => router.push('/dashboard')}
      topbar={topbar}
    >
      <div className="mx-auto max-w-6xl">
        {/* Mobile search + add */}
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="h-9 w-full rounded border-2 border-slate-600 bg-[rgb(var(--surface-2))] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <button onClick={() => router.push('/projects/new')} className="btn-primary h-9 px-3">
            <Plus size={16} weight="bold" />
            New
          </button>
        </div>

        {/* Filter chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <FilterChip label="All" count={projects.length} active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          <FilterChip
            label="Standard QC"
            count={projects.filter((p) => p.project_type === ProjectType.STANDARD).length}
            active={typeFilter === ProjectType.STANDARD}
            onClick={() => setTypeFilter(ProjectType.STANDARD)}
          />
          <FilterChip
            label="API Testing"
            count={projects.filter((p) => p.project_type === ProjectType.API_TESTING).length}
            active={typeFilter === ProjectType.API_TESTING}
            onClick={() => setTypeFilter(ProjectType.API_TESTING)}
          />
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} className="text-slate-500" />}
            title="No projects yet"
            description="Create your first project to start generating test strategies and cases."
            action={
              <button onClick={() => router.push('/projects/new')} className="btn-primary">
                <Plus size={18} weight="bold" />
                Create project
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass size={26} className="text-slate-500" />}
            title="No matches"
            description="No projects match your search or filter. Try a different keyword."
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project, i) => (
              <BlurFade key={project.id} delay={i * 0.05} inViewMargin="0px">
                <ProjectCard
                  project={project}
                  onDelete={handleDeleteProject}
                  onNavigate={() => router.push(`/projects/${project.id}`)}
                />
              </BlurFade>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-slate-800 bg-[rgb(var(--surface))]">
            {filtered.map((project, i) => (
              <ProjectRow
                key={project.id}
                project={project}
                last={i === filtered.length - 1}
                onDelete={handleDeleteProject}
                onNavigate={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-accent-500 bg-accent-500/10 text-accent-300'
          : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-accent-500/20 text-accent-200' : 'bg-slate-800 text-slate-400'}`}>
        {count}
      </span>
    </button>
  );
}

function TypeMeta({ project }: { project: Project }) {
  const isApi = project.project_type === ProjectType.API_TESTING;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-300 ring-1 ring-inset ring-accent-500/20">
      {isApi ? <PlugsConnected size={20} weight="fill" /> : <ClipboardText size={20} weight="fill" />}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`pill capitalize ${
        status === 'active'
          ? 'bg-emerald-500/15 text-emerald-300'
          : status === 'completed'
          ? 'bg-accent-500/15 text-accent-300'
          : 'bg-slate-800 text-slate-400'
      }`}
    >
      {status}
    </span>
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
  const isApi = project.project_type === ProjectType.API_TESTING;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id, project.name);
  };

  return (
    <MagicCard
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate()}
      className="flex h-full cursor-pointer flex-col rounded-card border border-slate-800 bg-[rgb(var(--surface))] p-5 shadow-card transition hover:border-accent-500/60 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]"
    >
      <button
        onClick={handleDeleteClick}
        className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
        title="Delete project"
      >
        <Trash size={16} />
      </button>

      <div className="flex items-center gap-3">
        <TypeMeta project={project} />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {isApi ? 'API Testing' : 'Standard QC'}
        </span>
      </div>

      <h3 className="mt-4 pr-6 text-base font-semibold text-slate-100">{project.name}</h3>
      {project.description ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">{project.description}</p>
      ) : (
        <p className="mt-1.5 text-sm italic text-slate-600">No description</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
        <StatusPill status={project.status} />
        <span className="text-slate-500">{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
      </div>

      <span className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-1 text-xs font-medium text-accent-300 opacity-0 transition-all duration-200 group-hover:opacity-100">
        Open <ArrowRight size={13} weight="bold" />
      </span>
    </MagicCard>
  );
}

function ProjectRow({
  project,
  last,
  onDelete,
  onNavigate,
}: {
  project: Project;
  last: boolean;
  onDelete: (id: number, name: string) => void;
  onNavigate: () => void;
}) {
  const isApi = project.project_type === ProjectType.API_TESTING;
  return (
    <div
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate()}
      className={`group flex cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-800/40 focus:outline-none ${
        last ? '' : 'border-b border-slate-800'
      }`}
    >
      <TypeMeta project={project} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-100">{project.name}</h3>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{isApi ? 'API Testing' : 'Standard QC'}</span>
        </div>
        {project.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{project.description}</p>
        )}
      </div>
      <StatusPill status={project.status} />
      <span className="hidden w-28 text-right text-xs text-slate-500 sm:block">
        {format(new Date(project.created_at), 'MMM d, yyyy')}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(project.id, project.name);
        }}
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/15 hover:text-rose-300"
        title="Delete project"
      >
        <Trash size={16} />
      </button>
    </div>
  );
}
