"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../../trpc/react";
import { useTheme } from "../../context/theme-context";

type FranchiseItem = {
  id: string;
  name: string;
  accent: string;
  completionPercent: number;
};

export function FranchiseSidebar() {
  const pathname = usePathname();
  const { setAccent, includeOptionalEntries } = useTheme();

  const { data, isLoading, error } = api.franchise.list.useQuery({
    includeOptionalEntries,
  });

  const handleFranchiseClick = (franchise: FranchiseItem) => {
    setAccent(franchise.accent);
  };

  if (isLoading) {
    return (
      <aside className="w-64 min-h-screen bg-slate-900 text-white p-4 flex flex-col">
        <div className="mb-6">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            Completionist
          </Link>
        </div>
        <div className="flex-1 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 min-h-screen bg-slate-900 text-white p-4 flex flex-col">
        <div className="mb-6">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            Completionist
          </Link>
        </div>
        <div className="text-red-400 text-sm">Error loading franchises</div>
      </aside>
    );
  }

  const franchises = data?.franchises ?? [];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-4 flex flex-col">
      <div className="mb-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide hover:text-slate-300 transition"
        >
          Completionist
        </Link>
      </div>

      {franchises.length === 0 ? (
        <div className="text-slate-400 text-sm">
          No franchises yet.{" "}
          <Link href="/admin" className="text-cyan-400 underline">
            Add one
          </Link>
        </div>
      ) : (
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {franchises.map((franchise) => {
            const isActive = pathname?.startsWith(
              `/franchises/${franchise.id}`
            );

            return (
              <Link
                key={franchise.id}
                href={`/franchises/${franchise.id}`}
                onClick={() => handleFranchiseClick(franchise)}
                className={`
                  group block rounded-lg p-3 transition-all
                  ${
                    isActive
                      ? "bg-slate-800 ring-1 ring-inset"
                      : "hover:bg-slate-800/60"
                  }
                `}
                style={{
                  ...(isActive && {
                    borderLeftColor: franchise.accent,
                    borderLeftWidth: "3px",
                  }),
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: franchise.accent }}
                  />
                  <span className="font-medium truncate text-sm">
                    {franchise.name}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${franchise.completionPercent}%`,
                        backgroundColor: franchise.accent,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {Math.round(franchise.completionPercent)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-slate-800">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Admin Panel
        </Link>
      </div>
    </aside>
  );
}
