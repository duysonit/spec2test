'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getInfographicFlowNodes,
  parseRequirementMindMap,
  type MindMapNode,
  type MindMapNodeType,
} from '@/lib/parseRequirementMindMap';

type Props = {
  requirementText?: string;
  featureTitle?: string;
};

const NODE_STYLE: Record<
  MindMapNodeType,
  { gradient: string; border: string; icon: string; ring: string }
> = {
  root: {
    gradient: 'from-indigo-600 via-violet-600 to-purple-600',
    border: 'border-indigo-400',
    icon: '⭐',
    ring: 'ring-indigo-200',
  },
  section: {
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-300',
    icon: '🎯',
    ring: 'ring-amber-100',
  },
  step: {
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-300',
    icon: '▶',
    ring: 'ring-blue-100',
  },
  detail: {
    gradient: 'from-slate-500 to-slate-600',
    border: 'border-slate-300',
    icon: '•',
    ring: 'ring-slate-100',
  },
};

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center px-1 sm:px-2" aria-hidden>
      <div className="h-0.5 w-6 sm:w-10 bg-gradient-to-r from-indigo-300 to-violet-400 rounded-full" />
      <span className="text-indigo-400 text-lg sm:text-xl font-bold mx-0.5">›</span>
    </div>
  );
}

function InfographicCard({
  node,
  size = 'md',
}: {
  node: MindMapNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const style = NODE_STYLE[node.type];
  const sizeClasses =
    size === 'lg'
      ? 'min-w-[220px] max-w-[280px] p-4'
      : size === 'md'
        ? 'min-w-[180px] max-w-[240px] p-3'
        : 'min-w-[150px] max-w-[200px] p-2.5';

  const textSize =
    size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[11px]';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 bg-white shadow-lg ring-4 ${style.ring} ${style.border} ${sizeClasses}`}
    >
      <div
        className={`absolute -top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${style.gradient} text-white text-sm font-bold shadow-md border-2 border-white`}
      >
        {node.stepCode ? node.stepCode : style.icon}
      </div>
      <p className={`mt-4 font-semibold text-gray-800 leading-snug ${textSize}`}>
        {node.label}
      </p>
      {node.children.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-dashed border-gray-200 pt-2">
          {node.children.map((child) => (
            <li
              key={child.id}
              className={`${textSize} text-gray-600 flex gap-1.5 items-start`}
            >
              <span className="text-indigo-400 shrink-0">›</span>
              <span>{child.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfographicCanvas({
  tree,
  size = 'md',
}: {
  tree: MindMapNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const flowNodes = getInfographicFlowNodes(tree);
  const rootStyle = NODE_STYLE.root;
  const rootSize =
    size === 'lg'
      ? 'text-lg px-8 py-5 min-w-[240px]'
      : size === 'md'
        ? 'text-base px-6 py-4 min-w-[200px]'
        : 'text-sm px-5 py-3 min-w-[160px]';

  return (
    <div className="inline-flex flex-col items-center gap-6 p-4 sm:p-6">
      <div className="flex flex-col items-center">
        <div
          className={`rounded-2xl bg-gradient-to-br ${rootStyle.gradient} text-white font-bold text-center shadow-xl border-2 border-white/30 ${rootSize}`}
        >
          <span className="block text-2xl mb-1" aria-hidden>
            {rootStyle.icon}
          </span>
          <span className="leading-tight">{tree.label}</span>
        </div>
        {flowNodes.length > 0 && (
          <div
            className="w-0.5 h-8 bg-gradient-to-b from-indigo-400 to-violet-300 rounded-full mt-2"
            aria-hidden
          />
        )}
      </div>

      {flowNodes.length > 0 && (
        <div className="flex flex-wrap items-stretch justify-center gap-y-6">
          {flowNodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              {index > 0 && <FlowArrow />}
              <InfographicCard node={node} size={size} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoomableInfographicModal({
  tree,
  onClose,
}: {
  tree: MindMapNode;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const clampScale = (v: number) => Math.min(2.5, Math.max(0.35, v));

  const zoomIn = () => setScale((s) => clampScale(s + 0.15));
  const zoomOut = () => setScale((s) => clampScale(s - 0.15));
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale((s) => clampScale(s + (e.deltaY > 0 ? -0.08 : 0.08)));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPan((p) => ({
      x: p.x + e.clientX - lastPointer.current.x,
      y: p.y + e.clientY - lastPointer.current.y,
    }));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Requirement infographic"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-3 text-white">
        <div>
          <h3 className="text-lg font-semibold">Feature Infographic</h3>
          <p className="text-xs text-slate-300">
            Kéo để di chuyển · Cuộn chuột hoặc nút ± để zoom · Esc để đóng
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
          >
            −
          </button>
          <span className="min-w-[3.5rem] text-center text-sm tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
          >
            Đóng
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center p-12"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-indigo-50/80 to-violet-50 shadow-2xl border border-white/50">
            <InfographicCanvas tree={tree} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RequirementMindMap({ requirementText, featureTitle }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const tree = useMemo(
    () => parseRequirementMindMap(requirementText || '', featureTitle || 'New Feature'),
    [requirementText, featureTitle]
  );

  if (!tree) {
    return (
      <p className="text-sm text-gray-500 italic">
        Thêm các bước requirement (Bước 1, Bước 2, …) để tạo sơ đồ infographic.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 shadow-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-indigo-100 bg-white/60">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              🗺️
            </span>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Visual Infographic</h4>
              <p className="text-xs text-indigo-600/80">Luồng feature — nhấn để phóng to</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
          >
            <span aria-hidden>⛶</span>
            Mở &amp; Zoom
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Click để mở chế độ zoom"
        >
          <div className="relative min-h-[280px] max-h-[420px] overflow-auto bg-gradient-to-br from-slate-50/50 to-indigo-50/30 p-4 cursor-zoom-in">
            <div className="min-w-[640px] mx-auto transition group-hover:scale-[1.01]">
              <InfographicCanvas tree={tree} size="md" />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition">
              <span className="rounded-full bg-slate-900/75 px-3 py-1 text-xs text-white font-medium">
                Click để zoom in / out
              </span>
            </div>
          </div>
        </button>
      </div>

      {modalOpen && (
        <ZoomableInfographicModal tree={tree} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
