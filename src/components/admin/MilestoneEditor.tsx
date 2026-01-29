"use client";

import React, { useMemo, useState } from "react";
import { api } from "src/trpc/react";

export type MilestoneEditorProps = {
  entryId: string;
};

type Draft = {
  title: string;
  type: "CHECKBOX" | "COUNTER";
  target: number | null;
  current: number;
  description: string;
};

type TreeNode = {
  id: string;
  title: string;
  type: "CHECKBOX" | "COUNTER";
  target: number | null;
  current: number;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  children: TreeNode[];
};

function flatten(nodes: TreeNode[], acc: TreeNode[] = []) {
  nodes.forEach((n) => {
    acc.push(n);
    flatten(n.children, acc);
  });
  return acc;
}

function collectIds(node: TreeNode, acc = new Set<string>()) {
  acc.add(node.id);
  node.children.forEach((c) => collectIds(c, acc));
  return acc;
}

export function MilestoneEditor({ entryId }: MilestoneEditorProps) {
  const { data, isLoading, isFetching, error, refetch } =
    api.milestone.treeAdmin.useQuery({ entryId });
  const roots = useMemo(() => data?.roots ?? [], [data?.roots]);
  const ctx = api.useContext();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newNode, setNewNode] = useState<{
    title: string;
    parentId: string | null;
    type: "CHECKBOX" | "COUNTER";
    target: number | null;
  }>({ title: "", parentId: null, type: "CHECKBOX", target: null });
  const [dupTargets, setDupTargets] = useState<Record<string, string | null>>(
    {}
  );
  const [showBatchLoad, setShowBatchLoad] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchType, setBatchType] = useState<"CHECKBOX" | "COUNTER">(
    "CHECKBOX"
  );
  const [batchTarget, setBatchTarget] = useState<number | null>(null);
  const [batchParentId, setBatchParentId] = useState<string | null>(null);

  const createMutation = api.milestone.create.useMutation({
    onSuccess: () => {
      setNewNode({ title: "", parentId: null, type: "CHECKBOX", target: null });
      ctx.milestone.treeAdmin.invalidate({ entryId });
    },
  });
  const updateMutation = api.milestone.update.useMutation({
    onSuccess: () => ctx.milestone.treeAdmin.invalidate({ entryId }),
  });
  const deleteMutation = api.milestone.delete.useMutation({
    onSuccess: () => ctx.milestone.treeAdmin.invalidate({ entryId }),
  });
  const reparentMutation = api.milestone.reparent.useMutation({
    onSuccess: () => ctx.milestone.treeAdmin.invalidate({ entryId }),
  });
  const reorderMutation = api.milestone.reorder.useMutation({
    onSuccess: () => ctx.milestone.treeAdmin.invalidate({ entryId }),
  });
  const duplicateMutation = api.milestone.duplicateSubtree.useMutation({
    onSuccess: () => ctx.milestone.treeAdmin.invalidate({ entryId }),
  });

  const batchCreateMutation = api.milestone.batchCreate.useMutation({
    onSuccess: () => {
      setShowBatchLoad(false);
      setBatchText("");
      ctx.milestone.treeAdmin.invalidate({ entryId });
    },
  });

  const allNodes = useMemo(() => flatten(roots, []), [roots]);
  const siblingsMap = useMemo(() => {
    const map = new Map<string | null, TreeNode[]>();
    const walk = (nodes: TreeNode[], parentId: string | null) => {
      map.set(parentId, nodes);
      nodes.forEach((n) => walk(n.children, n.id));
    };
    walk(roots, null);
    return map;
  }, [roots]);

  const getDraft = (node: TreeNode): Draft => {
    const existing = drafts[node.id];
    if (existing) return existing;
    const base: Draft = {
      title: node.title,
      type: node.type,
      target: node.target ?? null,
      current: node.current,
      description: node.description ?? "",
    };
    setDrafts((d) => ({ ...d, [node.id]: base }));
    return base;
  };

  const saveDraft = (id: string, partial: Partial<Draft>) => {
    setDrafts((d) => ({
      ...d,
      [id]: { ...(d[id] ?? ({} as Draft)), ...partial },
    }));
  };

  const handleSave = (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    updateMutation.mutate({
      milestoneId: id,
      title: draft.title,
      type: draft.type,
      target:
        draft.type === "COUNTER" ? (draft.target ?? undefined) : undefined,
      current:
        draft.type === "COUNTER" ? draft.current : draft.current >= 1 ? 1 : 0,
      description: draft.description,
    });
  };

  const move = (parentId: string | null, id: string, direction: -1 | 1) => {
    const siblings = siblingsMap.get(parentId) ?? [];
    const index = siblings.findIndex((s) => s.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const ordered = [...siblings];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(target, 0, removed);
    reorderMutation.mutate({
      entryId,
      parentId,
      orderedIds: ordered.map((s) => s.id),
    });
  };

  const parentOptions = useMemo(() => {
    return [
      { id: "root", title: "(root)" },
      ...allNodes.map((n) => ({ id: n.id, title: n.title })),
    ];
  }, [allNodes]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNode.title.trim()) return;
    createMutation.mutate({
      entryId,
      parentId: newNode.parentId ?? null,
      title: newNode.title.trim(),
      type: newNode.type,
      target:
        newNode.type === "COUNTER" ? (newNode.target ?? undefined) : undefined,
    });
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const draft = getDraft(node);
    const childOptions = parentOptions.filter(
      (opt) => opt.id !== node.id && !collectIds(node).has(opt.id)
    );
    const duplicateOptions = parentOptions.filter(
      (opt) => opt.id === "root" || !collectIds(node).has(opt.id)
    );
    const duplicateTarget = dupTargets[node.id] ?? node.parentId ?? null;
    return (
      <div key={node.id} className="space-y-2 border-l border-slate-200 pl-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={draft.title}
                onChange={(e) => saveDraft(node.id, { title: e.target.value })}
                className="w-56 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
              />
              <select
                value={draft.type}
                onChange={(e) =>
                  saveDraft(node.id, { type: e.target.value as Draft["type"] })
                }
                className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="CHECKBOX">checkbox</option>
                <option value="COUNTER">counter</option>
              </select>
              {draft.type === "COUNTER" ? (
                <>
                  <input
                    type="number"
                    value={draft.target ?? ""}
                    onChange={(e) =>
                      saveDraft(node.id, {
                        target: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="target"
                    className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={draft.current}
                    onChange={(e) =>
                      saveDraft(node.id, { current: Number(e.target.value) })
                    }
                    placeholder="current"
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </>
              ) : null}
              <input
                value={draft.description}
                onChange={(e) =>
                  saveDraft(node.id, { description: e.target.value })
                }
                placeholder="Description"
                className="w-64 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <label className="flex items-center gap-1">
                Parent:
                <select
                  value={node.parentId ?? "root"}
                  onChange={(e) =>
                    reparentMutation.mutate({
                      milestoneId: node.id,
                      newParentId:
                        e.target.value === "root" ? null : e.target.value,
                    })
                  }
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                >
                  {childOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </label>
              <span>Order: {node.displayOrder}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => handleSave(node.id)}
              className="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
              aria-label={`Save ${node.title}`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate({ milestoneId: node.id })}
              className="rounded-md border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50"
              aria-label={`Delete ${node.title}`}
            >
              Delete
            </button>
            <div className="flex items-center gap-1">
              <select
                value={duplicateTarget ?? "root"}
                onChange={(e) =>
                  setDupTargets((prev) => ({
                    ...prev,
                    [node.id]:
                      e.target.value === "root" ? null : e.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                aria-label={`Duplicate target for ${node.title}`}
              >
                {duplicateOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  duplicateMutation.mutate({
                    milestoneId: node.id,
                    newParentId: duplicateTarget ?? null,
                  })
                }
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                aria-label={`Duplicate ${node.title}`}
                disabled={duplicateMutation.isPending}
              >
                Duplicate
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(node.parentId ?? null, node.id, -1)}
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                aria-label={`Move ${node.title} up`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(node.parentId ?? null, node.id, 1)}
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                aria-label={`Move ${node.title} down`}
              >
                ↓
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-3 pl-4">
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" aria-live="polite">
      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">Failed to load milestones.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 inline-flex rounded-md border border-red-200 px-2 py-1 text-xs font-medium hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
      >
        <input
          value={newNode.title}
          onChange={(e) => setNewNode((n) => ({ ...n, title: e.target.value }))}
          placeholder="New milestone title"
          aria-label="New milestone title"
          className="w-56 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
        <select
          value={newNode.type}
          onChange={(e) =>
            setNewNode((n) => ({ ...n, type: e.target.value as typeof n.type }))
          }
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          aria-label="New milestone type"
        >
          <option value="CHECKBOX">checkbox</option>
          <option value="COUNTER">counter</option>
        </select>
        {newNode.type === "COUNTER" ? (
          <input
            type="number"
            value={newNode.target ?? ""}
            onChange={(e) =>
              setNewNode((n) => ({
                ...n,
                target: e.target.value ? Number(e.target.value) : null,
              }))
            }
            placeholder="Target"
            aria-label="Counter target"
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        ) : null}
        <select
          value={newNode.parentId ?? "root"}
          onChange={(e) =>
            setNewNode((n) => ({
              ...n,
              parentId: e.target.value === "root" ? null : e.target.value,
            }))
          }
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          aria-label="Parent milestone"
        >
          <option value="root">(root)</option>
          {allNodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
          disabled={isLoading}
        >
          Add milestone
        </button>
        <button
          type="button"
          onClick={() => setShowBatchLoad(true)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          title="Batch load milestones"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Batch
        </button>
        {isFetching ? (
          <span className="text-xs text-slate-500" role="status">
            Syncing…
          </span>
        ) : null}
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading milestones…</p>
      ) : null}

      {!isLoading && roots.length === 0 ? (
        <p className="text-sm text-slate-600">
          No milestones yet. Add your first milestone above.
        </p>
      ) : null}

      {roots.length > 0 ? (
        <div className="space-y-4">{roots.map((node) => renderNode(node))}</div>
      ) : null}

      {/* Batch Load Modal */}
      {showBatchLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Batch Load Milestones
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Add multiple milestones at once. One milestone per line.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const lines = batchText
                  .split("\n")
                  .map((l) => l.trim())
                  .filter((l) => l.length > 0);
                if (lines.length === 0) return;
                batchCreateMutation.mutate({
                  entryId,
                  parentId: batchParentId,
                  titles: lines,
                  type: batchType,
                  target:
                    batchType === "COUNTER"
                      ? (batchTarget ?? undefined)
                      : undefined,
                });
              }}
            >
              <div className="px-4 py-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Type:
                    <select
                      value={batchType}
                      onChange={(e) =>
                        setBatchType(e.target.value as "CHECKBOX" | "COUNTER")
                      }
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                      disabled={batchCreateMutation.isPending}
                    >
                      <option value="CHECKBOX">checkbox</option>
                      <option value="COUNTER">counter</option>
                    </select>
                  </label>
                  {batchType === "COUNTER" && (
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      Target:
                      <input
                        type="number"
                        value={batchTarget ?? ""}
                        onChange={(e) =>
                          setBatchTarget(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        placeholder="e.g. 100"
                        className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                        disabled={batchCreateMutation.isPending}
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Parent:
                    <select
                      value={batchParentId ?? "root"}
                      onChange={(e) =>
                        setBatchParentId(
                          e.target.value === "root" ? null : e.target.value
                        )
                      }
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                      disabled={batchCreateMutation.isPending}
                    >
                      <option value="root">(root)</option>
                      {allNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={"Milestone 1\nMilestone 2\nMilestone 3"}
                  rows={10}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono focus:border-slate-400 focus:outline-none resize-none"
                  autoFocus
                  disabled={batchCreateMutation.isPending}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {
                      batchText
                        .split("\n")
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0).length
                    }{" "}
                    milestone(s) to create
                  </span>
                  <span>One milestone per line</span>
                </div>
                {batchCreateMutation.error && (
                  <p className="text-sm text-red-600" role="alert">
                    {batchCreateMutation.error.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchLoad(false);
                    setBatchText("");
                    batchCreateMutation.reset();
                  }}
                  disabled={batchCreateMutation.isPending}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    batchCreateMutation.isPending ||
                    batchText
                      .split("\n")
                      .map((l) => l.trim())
                      .filter((l) => l.length > 0).length === 0
                  }
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                >
                  {batchCreateMutation.isPending && (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  Create milestones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
