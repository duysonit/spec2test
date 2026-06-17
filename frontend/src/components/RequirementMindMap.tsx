'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  getInfographicFlowNodes,
  parseRequirementMindMap,
  type MindMapNode,
} from '@/lib/parseRequirementMindMap';
import {
  TreeStructure,
  ArrowsOut,
  X,
  Plus,
  Minus,
  ArrowCounterClockwise,
  GraduationCap,
  Target,
  Lightbulb,
  Brain,
  Warning,
  Sparkle,
  Gear,
  ChartBar,
} from '@phosphor-icons/react';

type Props = {
  requirementText?: string;
  featureTitle?: string;
};

/**
 * Multi-color is intentional here: this is a data infographic (radial mind map),
 * which overrides the app-wide single-accent lock by explicit request.
 * Pastel fills + dark text mirror the reference "Six Thinking Hats" style.
 */
const PALETTE = [
  { fill: '#a5b4fc', line: '#818cf8', text: '#1e1b4b' }, // indigo
  { fill: '#fcd34d', line: '#f59e0b', text: '#451a03' }, // amber
  { fill: '#f9a8d4', line: '#ec4899', text: '#500724' }, // rose
  { fill: '#99f6e4', line: '#14b8a6', text: '#042f2e' }, // teal
  { fill: '#d9f99d', line: '#84cc16', text: '#1a2e05' }, // lime
  { fill: '#cbd5e1', line: '#94a3b8', text: '#0f172a' }, // slate
  { fill: '#c4b5fd', line: '#8b5cf6', text: '#2e1065' }, // violet
  { fill: '#fdba74', line: '#f97316', text: '#431407' }, // orange
];

const ICONS = [
  <Target key="0" size={16} weight="fill" />,
  <Lightbulb key="1" size={16} weight="fill" />,
  <Brain key="2" size={16} weight="fill" />,
  <Sparkle key="3" size={16} weight="fill" />,
  <Warning key="4" size={16} weight="fill" />,
  <ChartBar key="5" size={16} weight="fill" />,
  <Gear key="6" size={16} weight="fill" />,
  <GraduationCap key="7" size={16} weight="fill" />,
];

// Coordinate space (scaled to fit).
const W = 1480;
const H = 920;
const HUB = { x: W / 2, y: H / 2, w: 230, h: 116 };
const MAIN_R = 60;
const COL_X_LEFT = 400;
const COL_X_RIGHT = W - 400;
const LEAF_REACH = 150; // horizontal distance from bubble edge to leaf anchor
const LEAF_GAP = 56;
const MAX_LEAVES = 6;

function stripStepPrefix(label: string): string {
  return label.replace(/^Bước\s+[\d]+[a-zA-Z]?:\s*/i, '');
}

interface PlacedLeaf {
  node: MindMapNode;
  ax: number; // anchor x (end of connector)
  ay: number;
}
interface PlacedMain {
  node: MindMapNode;
  x: number;
  y: number;
  side: 'left' | 'right';
  color: (typeof PALETTE)[number];
  index: number;
  leaves: PlacedLeaf[];
  extra: number;
}

function buildLayout(nodes: MindMapNode[]): PlacedMain[] {
  // Split alternately into left / right columns, then stack vertically.
  const left: MindMapNode[] = [];
  const right: MindMapNode[] = [];
  nodes.forEach((n, i) => (i % 2 === 0 ? right : left).push(n));

  const placeColumn = (arr: MindMapNode[], side: 'left' | 'right'): PlacedMain[] => {
    const x = side === 'left' ? COL_X_LEFT : COL_X_RIGHT;
    const n = arr.length || 1;
    const top = 130;
    const usable = H - top * 2;
    return arr.map((node, k) => {
      const y = top + ((k + 0.5) * usable) / n;
      const globalIndex = nodes.indexOf(node);
      const color = PALETTE[globalIndex % PALETTE.length];
      const shown = node.children.slice(0, MAX_LEAVES);
      const c = shown.length;
      const leaves: PlacedLeaf[] = shown.map((child, j) => {
        const ay = y + (j - (c - 1) / 2) * LEAF_GAP;
        const ax = side === 'left' ? x - MAIN_R - LEAF_REACH : x + MAIN_R + LEAF_REACH;
        return { node: child, ax, ay };
      });
      return {
        node,
        x,
        y,
        side,
        color,
        index: globalIndex,
        leaves,
        extra: Math.max(0, node.children.length - MAX_LEAVES),
      };
    });
  };

  return [...placeColumn(left, 'left'), ...placeColumn(right, 'right')];
}

/** Smooth cubic connector, mostly horizontal (organic branch feel). */
function branch(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function MindMapCanvas({
  tree,
  nodes,
  scale,
  animate = true,
}: {
  tree: MindMapNode;
  nodes: MindMapNode[];
  scale: number;
  animate?: boolean;
}) {
  const layout = useMemo(() => buildLayout(nodes), [nodes]);

  return (
    <div style={{ width: W * scale, height: H * scale }} className="relative shrink-0">
      <div
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="relative"
      >
        {/* Connectors */}
        <svg width={W} height={H} className="absolute inset-0" aria-hidden>
          {layout.map((m, i) => {
            const hubEdgeX = m.side === 'left' ? HUB.x - HUB.w / 2 : HUB.x + HUB.w / 2;
            const bubbleEdgeX = m.side === 'left' ? m.x + MAIN_R : m.x - MAIN_R;
            const leafStartX = m.side === 'left' ? m.x - MAIN_R : m.x + MAIN_R;
            return (
              <g key={i}>
                {/* hub -> main */}
                <path
                  d={branch(hubEdgeX, HUB.y, bubbleEdgeX, m.y)}
                  fill="none"
                  stroke={m.color.line}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {/* main -> leaves */}
                {m.leaves.map((leaf, j) => (
                  <path
                    key={j}
                    d={branch(leafStartX, m.y, leaf.ax, leaf.ay)}
                    fill="none"
                    stroke={m.color.line}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    opacity={0.7}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Central hub */}
        <motion.div
          initial={animate ? { opacity: 0, scale: 0.8 } : false}
          animate={animate ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute flex flex-col items-center justify-center rounded-3xl text-center shadow-xl"
          style={{
            width: HUB.w,
            height: HUB.h,
            left: HUB.x,
            top: HUB.y,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #5eead4, #2dd4bf)',
            boxShadow: '0 0 50px -8px rgba(45,212,191,0.5)',
          }}
        >
          <TreeStructure size={22} weight="fill" className="text-teal-950/80" />
          <span className="mt-1 line-clamp-2 px-5 text-base font-extrabold uppercase leading-tight tracking-wide text-teal-950">
            {tree.label}
          </span>
        </motion.div>

        {/* Leaves (text labels) */}
        {layout.map((m) =>
          m.leaves.map((leaf, j) => {
            const boxW = 200;
            const style: React.CSSProperties =
              m.side === 'left'
                ? { right: W - leaf.ax, top: leaf.ay, transform: 'translateY(-50%)', width: boxW, textAlign: 'right' }
                : { left: leaf.ax, top: leaf.ay, transform: 'translateY(-50%)', width: boxW, textAlign: 'left' };
            return (
              <motion.div
                key={`${m.index}-leaf-${j}`}
                initial={animate ? { opacity: 0 } : false}
                animate={animate ? { opacity: 1 } : undefined}
                transition={{ duration: 0.3, delay: animate ? 0.3 + m.index * 0.05 + j * 0.04 : 0 }}
                className="absolute text-xs font-medium leading-snug text-slate-300"
                style={style}
              >
                {leaf.node.label}
              </motion.div>
            );
          })
        )}

        {/* Main bubbles */}
        {layout.map((m) => (
          <motion.div
            key={`main-${m.index}`}
            initial={animate ? { opacity: 0, scale: 0.6 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.4, delay: animate ? 0.12 + m.index * 0.07 : 0, ease: 'easeOut' }}
            title={m.node.label}
            className="absolute flex flex-col items-center justify-center rounded-full text-center shadow-lg"
            style={{
              width: MAIN_R * 2,
              height: MAIN_R * 2,
              left: m.x,
              top: m.y,
              transform: 'translate(-50%, -50%)',
              background: m.color.fill,
              boxShadow: `0 0 36px -8px ${m.color.line}`,
            }}
          >
            <span
              className="line-clamp-3 px-3 text-[11px] font-bold uppercase leading-tight tracking-wide"
              style={{ color: m.color.text }}
            >
              {m.node.stepCode ? `Bước ${m.node.stepCode}` : stripStepPrefix(m.node.label)}
            </span>
            {/* icon badge */}
            <span
              className="absolute -bottom-3 flex h-7 w-7 items-center justify-center rounded-full border-2 text-slate-700 shadow"
              style={{ background: '#fff', borderColor: m.color.fill }}
            >
              {ICONS[m.index % ICONS.length]}
            </span>
            {m.extra > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow"
                style={{ background: m.color.line }}
              >
                +{m.extra}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ZoomableModal({
  tree,
  nodes,
  onClose,
}: {
  tree: MindMapNode;
  nodes: MindMapNode[];
  onClose: () => void;
}) {
  const [scale, setScale] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const clampScale = (v: number) => Math.min(2.5, Math.max(0.3, v));
  const zoomIn = () => setScale((s) => clampScale(s + 0.12));
  const zoomOut = () => setScale((s) => clampScale(s - 0.12));
  const resetView = () => {
    setScale(0.6);
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
    setScale((s) => clampScale(s + (e.deltaY > 0 ? -0.07 : 0.07)));
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
    setPan((p) => ({ x: p.x + e.clientX - lastPointer.current.x, y: p.y + e.clientY - lastPointer.current.y }));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Requirement mind map"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[rgb(var(--surface))] px-4 py-3 text-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
            <TreeStructure size={18} weight="fill" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Feature Mind Map</h3>
            <p className="text-xs text-slate-400">Kéo để di chuyển · cuộn để zoom · Esc để đóng</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={zoomOut} className="btn-ghost" aria-label="Zoom out">
            <Minus size={16} weight="bold" />
          </button>
          <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button type="button" onClick={zoomIn} className="btn-ghost" aria-label="Zoom in">
            <Plus size={16} weight="bold" />
          </button>
          <button type="button" onClick={resetView} className="btn-ghost">
            <ArrowCounterClockwise size={16} />
            Reset
          </button>
          <button type="button" onClick={onClose} className="btn-primary">
            <X size={16} weight="bold" />
            Đóng
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <MindMapCanvas tree={tree} nodes={nodes} scale={scale} animate={false} />
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

  const nodes = useMemo(() => (tree ? getInfographicFlowNodes(tree) : []), [tree]);

  if (!tree || nodes.length === 0) {
    return (
      <p className="text-sm italic text-slate-500">
        Thêm các bước requirement (Bước 1, Bước 2, …) để tạo sơ đồ mind map.
      </p>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
              <TreeStructure size={18} weight="fill" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Visual Mind Map</h4>
              <p className="text-xs text-slate-400">Sơ đồ tỏa nhánh — nhấn để phóng to</p>
            </div>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-secondary">
            <ArrowsOut size={16} />
            Mở &amp; Zoom
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group block w-full cursor-zoom-in overflow-auto bg-slate-900/40 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          title="Click để mở chế độ zoom"
        >
          <div className="mx-auto w-fit">
            <MindMapCanvas tree={tree} nodes={nodes} scale={0.48} />
          </div>
        </button>
      </div>

      {modalOpen && <ZoomableModal tree={tree} nodes={nodes} onClose={() => setModalOpen(false)} />}
    </>
  );
}
