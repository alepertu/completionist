export type MilestoneNode = {
  id: string;
  title: string;
  type: "CHECKBOX" | "COUNTER";
  target?: number;
  current?: number;
  children?: MilestoneNode[];
};

export type CompletionResult = {
  id: string;
  percent: number;
  completed: number;
  total: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function computePercent(node: MilestoneNode): CompletionResult {
  if (node.children && node.children.length > 0) {
    const childResults = node.children.map(computePercent);
    const percent =
      childResults.reduce((acc, c) => acc + c.percent, 0) / childResults.length;
    const completed = childResults.reduce((acc, c) => acc + c.completed, 0);
    const total = childResults.reduce((acc, c) => acc + c.total, 0);
    return { id: node.id, percent, completed, total };
  }

  if (node.type === "COUNTER") {
    const target = node.target ?? 0;
    const current = clamp(node.current ?? 0, 0, target);
    const percent = target > 0 ? (current / target) * 100 : 0;
    return { id: node.id, percent, completed: current, total: target };
  }

  // Checkbox
  const done = (node.current ?? 0) >= 1;
  return {
    id: node.id,
    percent: done ? 100 : 0,
    completed: done ? 1 : 0,
    total: 1,
  };
}
