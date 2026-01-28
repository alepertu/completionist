"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect } from "react";
import { api } from "../../../src/trpc/react";
import { useTheme } from "../../../src/context/theme-context";
import { FranchiseSidebar } from "../../../src/components/sidebar/FranchiseSidebar";

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const franchiseId = params?.franchiseId as string;
  const { setAccent, includeOptionalEntries } = useTheme();

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

  // Set accent color when franchise data loads
  useEffect(() => {
    const franchise = franchiseData?.franchises?.find(
      (f) => f.id === franchiseId
    );
    if (franchise) {
      setAccent(franchise.accent);
    }
  }, [franchiseData, franchiseId, setAccent]);

  const franchise = franchiseData?.franchises?.find(
    (f) => f.id === franchiseId
  );
  const entries = entriesData?.entries ?? [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <FranchiseSidebar />

      <div className="flex-1 flex flex-col">
        {/* Entry Carousel Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-2xl font-bold"
              style={{ color: franchise?.accent ?? "#00e5ff" }}
            >
              {franchise?.name ?? "Loading..."}
            </h1>
            {franchise && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{Math.round(franchise.completionPercent)}% Complete</span>
              </div>
            )}
          </div>

          {/* Entry Carousel */}
          <div className="relative">
            {isLoading && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-40 h-20 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm">
                Error loading entries: {error.message}
              </div>
            )}

            {!isLoading && entries.length === 0 && (
              <div className="text-slate-500 text-sm py-4">
                No entries found.{" "}
                <Link
                  href={`/admin/franchises/${franchiseId}`}
                  className="text-cyan-600 underline"
                >
                  Add entries
                </Link>
              </div>
            )}

            {entries.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
                {entries.map((entry) => {
                  const isActive = pathname?.includes(`/entries/${entry.id}`);

                  return (
                    <Link
                      key={entry.id}
                      href={`/franchises/${franchiseId}/entries/${entry.id}`}
                      className={`
                        shrink-0 w-44 p-3 rounded-lg border transition-all
                        ${
                          isActive
                            ? "border-2 bg-white shadow-md"
                            : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow"
                        }
                      `}
                      style={{
                        ...(isActive && {
                          borderColor: franchise?.accent ?? "#00e5ff",
                        }),
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-slate-900 truncate">
                          {entry.title}
                        </span>
                        {entry.isOptional && (
                          <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${entry.completion.percent}%`,
                              backgroundColor: franchise?.accent ?? "#00e5ff",
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {Math.round(entry.completion.percent)}%
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {entry.completion.completed}/{entry.completion.total}{" "}
                        milestones
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
