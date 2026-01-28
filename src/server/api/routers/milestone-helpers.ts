export type MilestoneEdge = {
  id: string;
  parentId: string | null;
};

export function willCreateCycle(
  nodes: MilestoneEdge[],
  movingId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false;
  const parentMap = new Map(nodes.map((n) => [n.id, n.parentId]));

  let current: string | null | undefined = newParentId;
  while (current) {
    if (current === movingId) return true;
    current = parentMap.get(current) ?? null;
  }
  return false;
}

export function buildDisplayOrderUpdates(ids: string[], start = 0, step = 10) {
  return ids.map((id, index) => ({ id, displayOrder: start + index * step }));
}
