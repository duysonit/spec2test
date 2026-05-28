export type MindMapNodeType = 'root' | 'section' | 'step' | 'detail';

export interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
  type: MindMapNodeType;
  stepCode?: string;
}

const STEP_PATTERN = /^Bước\s+([\d]+[a-zA-Z]?):\s*(.*)$/i;
const SECTION_PATTERN = /^(Objective|Description|Mục tiêu|Mô tả|Phạm vi|Scope)\s*:?\s*(.*)$/i;
const BULLET_PATTERN = /^[-*•]\s+(.+)$/;

function truncate(label: string, max = 120): string {
  const oneLine = label.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

/**
 * Build a tree from requirement text (Vietnamese "Bước" steps, sections, bullets).
 */
export function parseRequirementMindMap(
  text: string,
  fallbackTitle = 'New Feature'
): MindMapNode | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  let rootLabel = fallbackTitle;
  const root: MindMapNode = {
    id: 'root',
    label: rootLabel,
    children: [],
    type: 'root',
  };
  let currentStep: MindMapNode | null = null;
  let nodeIndex = 0;

  const addChild = (parent: MindMapNode, label: string, type: MindMapNodeType = 'detail') => {
    nodeIndex += 1;
    parent.children.push({
      id: `n-${nodeIndex}`,
      label: truncate(label),
      children: [],
      type,
    });
  };

  for (const line of lines) {
    const stepMatch = line.match(STEP_PATTERN);
    if (stepMatch) {
      nodeIndex += 1;
      const stepCode = stepMatch[1];
      const stepBody = stepMatch[2]?.trim() || line;
      currentStep = {
        id: `step-${nodeIndex}`,
        label: truncate(`Bước ${stepCode}: ${stepBody}`),
        children: [],
        type: 'step',
        stepCode,
      };
      root.children.push(currentStep);
      continue;
    }

    const sectionMatch = line.match(SECTION_PATTERN);
    if (sectionMatch) {
      const title = sectionMatch[1] || sectionMatch[0];
      const body = sectionMatch[2]?.trim();
      if (title && rootLabel === fallbackTitle) {
        rootLabel = truncate(title, 56);
        root.label = rootLabel;
      }
      nodeIndex += 1;
      const sectionNode: MindMapNode = {
        id: `section-${nodeIndex}`,
        label: truncate(line.split(':')[0] || line, 40),
        children: [],
        type: 'section',
      };
      if (body) {
        addChild(sectionNode, body, 'detail');
      }
      root.children.push(sectionNode);
      currentStep = sectionNode;
      continue;
    }

    const bulletMatch = line.match(BULLET_PATTERN);
    if (bulletMatch) {
      const parent = currentStep ?? root;
      addChild(parent, bulletMatch[1], 'detail');
      continue;
    }

    if (!currentStep && root.children.length === 0 && line.length < 80) {
      root.label = truncate(line, 56);
      continue;
    }

    const parent = currentStep ?? root;
    addChild(parent, line, 'detail');
  }

  return root.children.length > 0 || root.label !== fallbackTitle ? root : null;
}

/** Flatten top-level flow nodes for horizontal infographic layout. */
export function getInfographicFlowNodes(root: MindMapNode): MindMapNode[] {
  return root.children.length > 0 ? root.children : [];
}
