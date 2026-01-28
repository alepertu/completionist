"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { MediaType } from "@prisma/client";
import { AdminShell } from "src/components/admin/AdminShell";
import { ConfirmDeleteModal } from "src/components/admin/modals/ConfirmDeleteModal";
import { api } from "src/trpc/react";

type EditableEntry = {
  id?: string;
  title: string;
  mediaType: MediaType;
  isOptional: boolean;
};

const mediaOptions = [
  MediaType.GAME,
  MediaType.BOOK,
  MediaType.MOVIE,
  MediaType.OTHER,
];

export default function FranchiseEntriesPage() {
  const params = useParams();
  const franchiseId = params?.franchiseId as string;
  const [form, setForm] = useState<EditableEntry>({
    title: "",
    mediaType: MediaType.GAME,
    isOptional: false,
  });
  const [entrySearch, setEntrySearch] = useState("");
  const [showOptional, setShowOptional] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const ctx = api.useContext();
  const { data, isLoading, error } = api.entry.listByFranchiseAdmin.useQuery({
    franchiseId,
  });

  const createMutation = api.entry.create.useMutation({
    onSuccess: () => {
      setForm({
        title: "",
        mediaType: MediaType.GAME,
        isOptional: false,
        id: undefined,
      });
      ctx.entry.listByFranchiseAdmin.invalidate({ franchiseId });
    },
  });

  const updateMutation = api.entry.update.useMutation({
    onSuccess: () => {
      setForm({
        title: "",
        mediaType: MediaType.GAME,
        isOptional: false,
        id: undefined,
      });
      ctx.entry.listByFranchiseAdmin.invalidate({ franchiseId });
    },
  });

  const deleteMutation = api.entry.delete.useMutation({
    onSuccess: () => ctx.entry.listByFranchiseAdmin.invalidate({ franchiseId }),
  });

  const bulkDeleteMutation = api.entry.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedEntries([]);
      setShowBulkConfirm(false);
      ctx.entry.listByFranchiseAdmin.invalidate({ franchiseId });
    },
  });

  const reorderMutation = api.entry.reorder.useMutation({
    onSuccess: () => ctx.entry.listByFranchiseAdmin.invalidate({ franchiseId }),
  });

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const filteredEntries = useMemo(() => {
    const term = entrySearch.trim().toLowerCase();
    return entries.filter((e) => {
      if (!showOptional && e.isOptional) return false;
      if (!term) return true;
      return e.title.toLowerCase().includes(term);
    });
  }, [entries, entrySearch, showOptional]);
  const selectedMilestoneCount = filteredEntries
    .filter((e) => selectedEntries.includes(e.id))
    .reduce((acc, entry) => acc + entry.milestoneCount, 0);
  const editingId = form.id;
  const canSubmit = form.title.trim().length > 0;
  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    bulkDeleteMutation.error ||
    reorderMutation.error;

  const sorted = useMemo(() => entries, [entries]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      updateMutation.mutate({
        entryId: editingId,
        title: form.title.trim(),
        mediaType: form.mediaType,
        isOptional: form.isOptional,
      });
    } else {
      createMutation.mutate({
        franchiseId,
        title: form.title.trim(),
        mediaType: form.mediaType,
        isOptional: form.isOptional,
      });
    }
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((e) => e.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const next = [...sorted];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    reorderMutation.mutate({
      franchiseId,
      orderedEntryIds: next.map((e) => e.id),
    });
  };

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    bulkDeleteMutation.isPending ||
    reorderMutation.isPending;

  const toggleSelectAll = () => {
    const ids = filteredEntries.map((e) => e.id);
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedEntries.includes(id));
    setSelectedEntries(allSelected ? [] : ids);
  };

  return (
    <AdminShell
      title="Entries"
      subtitle="Manage entries for this franchise and navigate to milestone trees."
      actions={
        <Link
          href="/admin/franchises"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to franchises
        </Link>
      }
    >
      <div className="space-y-4">
        {mutationError ? (
          <p className="text-sm text-red-600" role="alert">
            {mutationError.message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error.message}
          </p>
        ) : null}

        <form
          onSubmit={submit}
          className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Entry title"
            aria-label="Entry title"
            className="w-56 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
          <select
            value={form.mediaType}
            onChange={(e) =>
              setForm((f) => ({ ...f, mediaType: e.target.value as MediaType }))
            }
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            aria-label="Media type"
          >
            {mediaOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.toLowerCase()}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isOptional}
              onChange={(e) =>
                setForm((f) => ({ ...f, isOptional: e.target.checked }))
              }
            />
            Optional entry
          </label>
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? "Save" : "Create"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() =>
                setForm({
                  title: "",
                  mediaType: MediaType.GAME,
                  isOptional: false,
                })
              }
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={entrySearch}
              onChange={(e) => setEntrySearch(e.target.value)}
              placeholder="Search entries"
              aria-label="Search entries"
              className="w-56 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showOptional}
                onChange={(e) => setShowOptional(e.target.checked)}
              />
              Show optional entries
            </label>
          </div>
          <button
            type="button"
            onClick={() => setShowBulkConfirm(true)}
            disabled={selectedEntries.length === 0}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete selected
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading entries…</p>
        ) : null}

        <div
          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          aria-live="polite"
        >
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all entries"
                    onChange={toggleSelectAll}
                    checked={
                      filteredEntries.length > 0 &&
                      filteredEntries.every((e) =>
                        selectedEntries.includes(e.id)
                      )
                    }
                    disabled={filteredEntries.length === 0}
                  />
                </th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Media</th>
                <th className="px-4 py-2">Optional</th>
                <th className="px-4 py-2">Milestones</th>
                <th className="px-4 py-2">Completion</th>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const idx = sorted.findIndex((e) => e.id === entry.id);
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select entry ${entry.title}`}
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() =>
                          setSelectedEntries((prev) =>
                            prev.includes(entry.id)
                              ? prev.filter((id) => id !== entry.id)
                              : [...prev, entry.id]
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {entry.title}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.mediaType.toLowerCase()}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.isOptional ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.milestoneCount}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.completion.percent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-slate-700">{idx + 1}</td>
                    <td className="px-4 py-2 space-x-2 text-sm">
                      <Link
                        href={`/admin/entries/${entry.id}`}
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Milestones
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            id: entry.id,
                            title: entry.title,
                            mediaType: entry.mediaType,
                            isOptional: entry.isOptional,
                          })
                        }
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => move(entry.id, -1)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                        disabled={idx === 0 || busy}
                        aria-label={`Move ${entry.title} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(entry.id, 1)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                        disabled={idx === sorted.length - 1 || busy}
                        aria-label={`Move ${entry.title} down`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteMutation.mutate({ entryId: entry.id })
                        }
                        className="rounded-md border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && !isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    No entries match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <ConfirmDeleteModal
          open={showBulkConfirm}
          onCancel={() => setShowBulkConfirm(false)}
          onConfirm={() =>
            bulkDeleteMutation.mutate({ entryIds: selectedEntries })
          }
          confirmLabel={
            bulkDeleteMutation.isPending ? "Deleting…" : "Delete entries"
          }
          confirmDisabled={bulkDeleteMutation.isPending}
          title="Delete selected entries"
          description={
            <div className="space-y-2">
              <p>
                Delete {selectedEntries.length} entr
                {selectedEntries.length === 1 ? "y" : "ies"} from this
                franchise?
              </p>
              <p className="text-sm text-slate-700">
                This removes {selectedMilestoneCount} milestone
                {selectedMilestoneCount === 1 ? "" : "s"}. This action cannot be
                undone.
              </p>
            </div>
          }
        />
      </div>
    </AdminShell>
  );
}
