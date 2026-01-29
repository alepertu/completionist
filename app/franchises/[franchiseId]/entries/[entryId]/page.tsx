"use client";

import { useParams } from "next/navigation";
import { api } from "../../../../../src/trpc/react";
import { useTheme } from "../../../../../src/context/theme-context";
import { MilestoneTree } from "../../../../../src/components/milestones/MilestoneTree";
import { CompletionSummary } from "../../../../../src/components/progress/CompletionSummary";
import Link from "next/link";

export default function EntryPage() {
  const params = useParams();
  const franchiseId = params?.franchiseId as string;
  const entryId = params?.entryId as string;
  const { accent, includeOptionalEntries } = useTheme();

  // Fetch franchise data for accent color
  const { data: franchiseData } = api.franchise.list.useQuery({
    includeOptionalEntries,
  });

  // Fetch entry details
  const { data: entriesData, refetch: refetchEntries } =
    api.entry.listByFranchise.useQuery(
      { franchiseId },
      { enabled: !!franchiseId }
    );

  // Fetch milestone tree
  const {
    data: milestoneData,
    isLoading: milestonesLoading,
    error: milestonesError,
  } = api.milestone.tree.useQuery({ entryId }, { enabled: !!entryId });

  const franchise = franchiseData?.franchises?.find(
    (f) => f.id === franchiseId
  );
  const entry = entriesData?.entries?.find((e) => e.id === entryId);
  const milestoneRoots = milestoneData?.roots ?? [];
  const accentColor = franchise?.accent ?? accent;

  const handleProgressUpdate = () => {
    // Refetch entry data to get updated completion stats
    refetchEntries();
  };

  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-cyan-500 rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Entry Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{entry.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 capitalize">
              {entry.mediaType.toLowerCase()}
            </span>
            {entry.isOptional && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/admin/entries/${entryId}`}
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </Link>
      </div>

      {/* Completion Summary */}
      <CompletionSummary
        title={`${entry.title} Progress`}
        percent={entry.completion.percent}
        completed={entry.completion.completed}
        total={entry.completion.total}
        accentColor={accentColor}
        size="lg"
      />

      {/* Milestone Tree Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Milestones</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your progress through each milestone
          </p>
        </div>

        <div className="p-4">
          {milestonesLoading && (
            <div className="space-y-3">
              {/* Skeleton loading state */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3">
                  <div className="w-5 h-5 rounded bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 bg-slate-200 rounded animate-pulse"
                      style={{ width: `${60 + Math.random() * 30}%` }}
                    />
                    <div className="h-2 bg-slate-100 rounded animate-pulse w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {milestonesError && (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">
                Error loading milestones: {milestonesError.message}
              </p>
            </div>
          )}

          {!milestonesLoading && !milestonesError && (
            <MilestoneTree
              roots={milestoneRoots}
              entryId={entryId}
              accentColor={accentColor}
              onProgressUpdate={handleProgressUpdate}
            />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: accentColor }}>
            {entry.completion.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Milestones</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {entry.completion.completed}
          </div>
          <div className="text-xs text-slate-500 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">
            {entry.completion.total - entry.completion.completed}
          </div>
          <div className="text-xs text-slate-500 mt-1">Remaining</div>
        </div>
      </div>
    </div>
  );
}
