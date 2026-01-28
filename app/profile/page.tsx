"use client";

import { useEffect } from "react";
import { api } from "../../src/trpc/react";
import { useTheme } from "../../src/context/theme-context";
import Link from "next/link";

export default function ProfilePage() {
  const { accent, includeOptionalEntries, setIncludeOptionalEntries } =
    useTheme();
  const utils = api.useUtils();

  // Fetch current preferences
  const { data: prefsData, isLoading: prefsLoading } =
    api.preferences.get.useQuery();

  // Toggle mutation with optimistic update
  const toggleMutation = api.preferences.toggleOptionalEntries.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.preferences.get.cancel();

      // Snapshot current data
      const previousData = utils.preferences.get.getData();

      // Optimistically update
      utils.preferences.get.setData(undefined, (old) => {
        if (!old) return old;
        return {
          preferences: {
            ...old.preferences,
            includeOptionalEntries: !old.preferences.includeOptionalEntries,
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.preferences.get.setData(undefined, context.previousData);
      }
    },
    onSettled: () => {
      // Invalidate to refetch fresh data
      utils.preferences.get.invalidate();
      utils.franchise.list.invalidate();
      utils.entry.listByFranchise.invalidate();
      utils.completion.recompute.invalidate();
    },
    onSuccess: (data) => {
      // Update theme context
      setIncludeOptionalEntries(data.preferences.includeOptionalEntries);
    },
  });

  // Sync preferences with theme context on load
  useEffect(() => {
    if (prefsData?.preferences) {
      setIncludeOptionalEntries(prefsData.preferences.includeOptionalEntries);
    }
  }, [prefsData, setIncludeOptionalEntries]);

  const currentValue =
    prefsData?.preferences?.includeOptionalEntries ?? includeOptionalEntries;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 transition"
            aria-label="Back to home"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Completion Settings Section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-900">
              Completion Calculation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure how your progress is calculated
            </p>
          </div>

          <div className="p-4">
            {prefsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-cyan-500 rounded-full" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Include Optional Entries
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    When enabled, optional entries (like DLC, side content) are
                    included in your overall completion percentage
                  </div>
                </div>
                <button
                  onClick={() => toggleMutation.mutate()}
                  disabled={toggleMutation.isPending}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors shrink-0
                    ${toggleMutation.isPending ? "opacity-50" : ""}
                    ${currentValue ? "" : "bg-slate-300"}
                  `}
                  style={{ backgroundColor: currentValue ? accent : undefined }}
                  role="switch"
                  aria-checked={currentValue}
                  aria-label="Toggle include optional entries"
                >
                  <span
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${currentValue ? "translate-x-6" : "translate-x-0"}
                    `}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: currentValue ? "#22c55e" : "#f97316",
                }}
              />
              {currentValue ? (
                <span>
                  Optional entries are <strong>included</strong> in completion
                </span>
              ) : (
                <span>
                  Optional entries are <strong>excluded</strong> from completion
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Appearance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your accent color is set per-franchise
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg"
                style={{ backgroundColor: accent }}
              />
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Current Accent
                </div>
                <div className="text-xs text-slate-500 font-mono">{accent}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Each franchise can have its own accent color. Edit a franchise to
              change its color.
            </p>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Quick Links</h2>
          </div>

          <div className="divide-y divide-slate-100">
            <Link
              href="/"
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏠</span>
                <span className="text-sm text-slate-700">Home</span>
              </div>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              href="/admin"
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">⚙️</span>
                <span className="text-sm text-slate-700">Admin Panel</span>
              </div>
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
