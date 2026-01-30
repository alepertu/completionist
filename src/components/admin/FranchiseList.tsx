"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "./modals/ConfirmDeleteModal";
import { api } from "src/trpc/react";

const defaultAccent = "#64748b";

type EditableFranchise = {
  id?: string;
  name: string;
  accent: string;
};

type FranchiseRow = {
  id: string;
  name: string;
  accent: string;
  entryCount: number;
  milestoneCount: number;
};

export function FranchiseList() {
  const [search, setSearch] = useState("");
  const [entrySearch, setEntrySearch] = useState("");
  const [showOptional, setShowOptional] = useState(true);
  const [form, setForm] = useState<EditableFranchise>({
    name: "",
    accent: defaultAccent,
  });
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(
    null
  );
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [pendingFranchiseId, setPendingFranchiseId] = useState<string | null>(
    null
  );
  const ctx = api.useContext();

  const searchTerm = search.trim();

  const franchiseQuery = api.franchise.listAdmin.useQuery({
    search: searchTerm || undefined,
  });

  const entryQuery = api.entry.listByFranchiseAdmin.useQuery(
    { franchiseId: selectedFranchiseId ?? "" },
    { enabled: Boolean(selectedFranchiseId) }
  );

  const createMutation = api.franchise.create.useMutation({
    onSuccess: () => {
      setForm({ name: "", accent: defaultAccent });
      ctx.franchise.listAdmin.invalidate();
    },
  });

  const updateMutation = api.franchise.update.useMutation({
    onSuccess: () => {
      setForm({ name: "", accent: defaultAccent, id: undefined });
      ctx.franchise.listAdmin.invalidate();
    },
  });

  const deleteMutation = api.franchise.delete.useMutation({
    onSuccess: () => {
      ctx.franchise.listAdmin.invalidate();
      if (pendingFranchiseId === selectedFranchiseId) {
        setSelectedFranchiseId(null);
      }
      setPendingFranchiseId(null);
    },
  });

  const bulkDeleteMutation = api.entry.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedEntries([]);
      setShowBulkConfirm(false);
      if (selectedFranchiseId) {
        ctx.entry.listByFranchiseAdmin.invalidate({
          franchiseId: selectedFranchiseId,
        });
      }
      ctx.franchise.listAdmin.invalidate();
    },
  });

  const franchises = useMemo<FranchiseRow[]>(
    () => franchiseQuery.data?.franchises ?? [],
    [franchiseQuery.data]
  );
  const selectedFranchise =
    franchises.find((f: FranchiseRow) => f.id === selectedFranchiseId) ?? null;
  const editingId = form.id;
  const canSubmit =
    form.name.trim().length > 0 && form.accent.trim().length > 0;

  useEffect(() => {
    setSelectedEntries([]);
    setEntrySearch("");
  }, [selectedFranchiseId]);

  const handleEdit = (id: string, name: string, accent: string) => {
    setForm({ id, name, accent });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      updateMutation.mutate({
        franchiseId: editingId,
        name: form.name.trim(),
        accent: form.accent.trim(),
      });
    } else {
      createMutation.mutate({
        name: form.name.trim(),
        accent: form.accent.trim(),
      });
    }
  };

  const entries = useMemo(
    () => entryQuery.data?.entries ?? [],
    [entryQuery.data]
  );
  const filteredEntries = useMemo(() => {
    const term = entrySearch.trim().toLowerCase();
    return entries.filter((e) => {
      if (!showOptional && e.isOptional) return false;
      if (!term) return true;
      return e.title.toLowerCase().includes(term);
    });
  }, [entries, entrySearch, showOptional]);

  const toggleEntrySelection = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredEntries.map((e) => e.id);
    const allSelected = visibleIds.every((id) => selectedEntries.includes(id));
    setSelectedEntries(allSelected ? [] : visibleIds);
  };

  const selectedMilestoneCount = filteredEntries
    .filter((e) => selectedEntries.includes(e.id))
    .reduce((acc, entry) => acc + entry.milestoneCount, 0);

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    bulkDeleteMutation.isPending;

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    bulkDeleteMutation.error;

  const franchiseLoading = franchiseQuery.isLoading;
  const entryLoading = entryQuery.isLoading || entryQuery.isFetching;

  return (
    <div className="space-y-5" aria-busy={busy}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search franchises"
            aria-label="Search franchises"
            className="w-64 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => franchiseQuery.refetch()}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-1 text-sm">
          {mutationError ? (
            <p className="text-red-600" role="alert">
              {mutationError.message}
            </p>
          ) : null}
          {franchiseQuery.error ? (
            <p className="text-red-600" role="alert">
              {franchiseQuery.error.message}
            </p>
          ) : null}
          {entryQuery.error ? (
            <p className="text-red-600" role="alert">
              {entryQuery.error.message}
            </p>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
        aria-label="Franchise form"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Franchise name"
          aria-label="Franchise name"
          className="w-48 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
        <input
          value={form.accent}
          onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
          placeholder="#64748b"
          aria-label="Accent color"
          className="w-32 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
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
            onClick={() => setForm({ name: "", accent: defaultAccent })}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </form>

      <div
        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
        aria-live="polite"
      >
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Accent</th>
              <th className="px-4 py-2">Entries</th>
              <th className="px-4 py-2">Milestones</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {franchiseLoading ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Loading franchises…
                </td>
              </tr>
            ) : null}
            {!franchiseLoading && franchises.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No franchises found. Try a different search.
                </td>
              </tr>
            ) : null}
            {franchises.map((f: FranchiseRow) => {
              const isSelected = f.id === selectedFranchiseId;
              return (
                <tr
                  key={f.id}
                  className={`border-t border-slate-100 ${
                    isSelected ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <button
                      type="button"
                      onClick={() => setSelectedFranchiseId(f.id)}
                      className="text-left underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
                      aria-label={`Select franchise ${f.name}`}
                    >
                      {f.name}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: f.accent }}
                        aria-label={`Accent ${f.accent}`}
                      />
                      {f.accent}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{f.entryCount}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {f.milestoneCount}
                  </td>
                  <td className="px-4 py-2 space-x-2 text-sm">
                    <Link
                      href={`/admin/franchises/${f.id}`}
                      className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEdit(f.id, f.name, f.accent)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingFranchiseId(f.id)}
                      className="rounded-md border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Entries</p>
            <p className="text-xs text-slate-600">
              Select a franchise to view and bulk-delete entries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={entrySearch}
              onChange={(e) => setEntrySearch(e.target.value)}
              placeholder="Search entries"
              aria-label="Search entries"
              className="w-48 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              disabled={!selectedFranchiseId}
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showOptional}
                onChange={(e) => setShowOptional(e.target.checked)}
                disabled={!selectedFranchiseId}
              />
              Show optional entries
            </label>
            <button
              type="button"
              onClick={() => setShowBulkConfirm(true)}
              disabled={selectedEntries.length === 0 || !selectedFranchiseId}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete selected
            </button>
          </div>
        </div>

        {!selectedFranchiseId ? (
          <p className="text-sm text-slate-600">
            Select a franchise to load entries.
          </p>
        ) : null}

        {selectedFranchiseId ? (
          <div
            className="overflow-hidden rounded-md border border-slate-200"
            aria-live="polite"
          >
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all visible entries"
                      checked={
                        filteredEntries.length > 0 &&
                        filteredEntries.every((e) =>
                          selectedEntries.includes(e.id)
                        )
                      }
                      onChange={toggleSelectAll}
                      disabled={filteredEntries.length === 0}
                    />
                  </th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Media</th>
                  <th className="px-4 py-2">Optional</th>
                  <th className="px-4 py-2">Milestones</th>
                  <th className="px-4 py-2">Completion</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entryLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={7}>
                      Loading entries…
                    </td>
                  </tr>
                ) : null}
                {!entryLoading && filteredEntries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={7}>
                      No entries match this filter.
                    </td>
                  </tr>
                ) : null}
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select entry ${entry.title}`}
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
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
                    <td className="px-4 py-2 space-x-2 text-sm">
                      <Link
                        href={`/admin/entries/${entry.id}`}
                        className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        Milestones
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
              {selectedEntries.length === 1 ? "y" : "ies"}
              {selectedFranchise ? ` from ${selectedFranchise.name}` : ""}?
            </p>
            <p className="text-sm text-slate-700">
              This removes {selectedMilestoneCount} linked milestone
              {selectedMilestoneCount === 1 ? "" : "s"} and cannot be undone.
            </p>
          </div>
        }
      />

      <ConfirmDeleteModal
        open={Boolean(pendingFranchiseId)}
        onCancel={() => setPendingFranchiseId(null)}
        onConfirm={() =>
          pendingFranchiseId
            ? deleteMutation.mutate({ franchiseId: pendingFranchiseId })
            : undefined
        }
        confirmLabel={
          deleteMutation.isPending ? "Deleting…" : "Delete franchise"
        }
        confirmDisabled={
          deleteMutation.isPending ||
          (franchises.find((f) => f.id === pendingFranchiseId)?.entryCount ??
            0) > 0
        }
        title="Delete franchise"
        description={(() => {
          const franchise = franchises.find(
            (f: FranchiseRow) => f.id === pendingFranchiseId
          );
          if (!franchise) return null;
          const blocked = franchise.entryCount > 0;
          return (
            <div className="space-y-2">
              <p className="font-medium text-slate-900">{franchise.name}</p>
              <p className="text-sm text-slate-700">
                Entries: {franchise.entryCount} · Milestones:{" "}
                {franchise.milestoneCount}
              </p>
              {blocked ? (
                <p className="text-sm text-red-700">
                  Deletion blocked until all entries and milestones are removed.
                </p>
              ) : (
                <p className="text-sm text-slate-700">
                  This action cannot be undone.
                </p>
              )}
            </div>
          );
        })()}
      />
    </div>
  );
}
