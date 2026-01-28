"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../src/trpc/react";
import { useTheme } from "../../../src/context/theme-context";
import { CompletionSummary } from "../../../src/components/progress/CompletionSummary";

export default function FranchisePage() {
  const params = useParams();
  const franchiseId = params?.franchiseId as string;
  const { includeOptionalEntries } = useTheme();

  const { data: franchiseData } = api.franchise.list.useQuery({
    includeOptionalEntries,
  });

  const {
    data: entriesData,
    isLoading,
    error,
  } = api.entry.listByFranchise.useQuery(
    { franchiseId },
    { enabled: !!franchiseId }
  );

  const franchise = franchiseData?.franchises?.find(
    (f) => f.id === franchiseId
  );
  const entries = entriesData?.entries ?? [];
  const accentColor = franchise?.accent ?? "#00e5ff";

  // Calculate overall completion
  const overallCompletion =
    entries.length > 0
      ? entries.reduce((acc, e) => acc + e.completion.percent, 0) /
        entries.length
      : 0;
  const totalCompleted = entries.reduce(
    (acc, e) => acc + e.completion.completed,
    0
  );
  const totalMilestones = entries.reduce(
    (acc, e) => acc + e.completion.total,
    0
  );

  if (!franchise) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-cyan-500 rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading franchise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview Header */}
      <div className="text-center mb-8">
        <h2 className="text-xl text-slate-600">
          Select an entry to view milestones
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          or view the overall progress below
        </p>
      </div>

      {/* Overall Franchise Completion */}
      <CompletionSummary
        title={`${franchise.name} Overall Progress`}
        subtitle={`${entries.length} entries`}
        percent={overallCompletion}
        completed={totalCompleted}
        total={totalMilestones}
        accentColor={accentColor}
        size="lg"
      />

      {/* Entry Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Entries</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click an entry to view its milestones
            </p>
          </div>
          <Link
            href={`/admin/franchises/${franchiseId}`}
            className="text-sm text-slate-500 hover:text-slate-700 transition flex items-center gap-1"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Manage
          </Link>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-slate-300 border-t-cyan-500 rounded-full" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">Error loading entries: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && entries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-sm">No entries yet</p>
              <Link
                href={`/admin/franchises/${franchiseId}`}
                className="inline-block mt-2 text-sm text-cyan-600 hover:underline"
              >
                Add your first entry
              </Link>
            </div>
          )}

          {!isLoading && !error && entries.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/franchises/${franchiseId}/entries/${entry.id}`}
                  className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 group-hover:text-slate-700">
                      {entry.title}
                    </span>
                    {entry.isOptional && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${entry.completion.percent}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: accentColor }}
                    >
                      {Math.round(entry.completion.percent)}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    {entry.completion.completed}/{entry.completion.total}{" "}
                    milestones •{" "}
                    <span className="capitalize">
                      {entry.mediaType.toLowerCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
