"use client";

import Link from "next/link";
import { api } from "../src/trpc/react";

export default function HomePage() {
  const { data, isLoading, error } = api.franchise.list.useQuery({
    includeOptionalEntries: true,
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Completionist Tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Select a franchise to begin
          </h1>
        </header>

        {isLoading && (
          <div className="text-center text-slate-500">
            Loading franchises...
          </div>
        )}

        {error && (
          <div className="text-center text-red-500">
            Error loading franchises: {error.message}
          </div>
        )}

        {data?.franchises && data.franchises.length === 0 && (
          <div className="text-center text-slate-500">
            No franchises found. Add some in the{" "}
            <Link href="/admin" className="text-blue-600 underline">
              admin panel
            </Link>
            .
          </div>
        )}

        {data?.franchises && data.franchises.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.franchises.map((franchise) => (
              <Link
                key={franchise.id}
                href={`/franchises/${franchise.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
              >
                <div
                  className="mb-3 h-2 w-12 rounded-full"
                  style={{ backgroundColor: franchise.accent }}
                />
                <h2 className="text-lg font-medium text-slate-900 group-hover:text-slate-700">
                  {franchise.name}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${franchise.completionPercent}%`,
                        backgroundColor: franchise.accent,
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-500">
                    {Math.round(franchise.completionPercent)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
