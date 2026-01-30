"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { api } from "../../../src/trpc/react";
import { useTheme } from "../../../src/context/theme-context";
import {
  FranchiseSidebar,
  FranchiseSidebarContent,
} from "../../../src/components/sidebar/FranchiseSidebar";
import { MobileMenu } from "../../../src/components/layout/MobileMenu";
import { useIsMobile } from "../../../src/hooks/useMediaQuery";

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const franchiseId = params?.franchiseId as string;
  const { setAccent, includeOptionalEntries } = useTheme();
  const isMobile = useIsMobile();

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

  const carouselRef = useRef<HTMLDivElement>(null);
  const activeEntryRef = useRef<HTMLAnchorElement>(null);

  // Scroll active entry into center view (desktop only)
  useEffect(() => {
    if (!isMobile && activeEntryRef.current && carouselRef.current) {
      const carousel = carouselRef.current;
      const activeEntry = activeEntryRef.current;

      const carouselRect = carousel.getBoundingClientRect();
      const entryRect = activeEntry.getBoundingClientRect();

      const scrollLeft =
        activeEntry.offsetLeft - carouselRect.width / 2 + entryRect.width / 2;

      carousel.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [pathname, entries, isMobile]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Menu with Sidebar Content */}
      <MobileMenu>
        <FranchiseSidebarContent />
      </MobileMenu>

      {/* Desktop Sidebar */}
      <FranchiseSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Entry Carousel Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4 pl-14 md:pl-0">
            <h1
              className="text-lg md:text-2xl font-bold truncate"
              style={{ color: franchise?.accent ?? "#64748b" }}
            >
              {franchise?.name ?? "Loading..."}
            </h1>
            {franchise && (
              <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
                <span>{Math.round(franchise.completionPercent)}% Complete</span>
              </div>
            )}
          </div>

          {/* Entry Carousel */}
          <div className="relative overflow-hidden -mx-4 md:-mx-6">
            {isLoading && (
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 px-4 md:px-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-[calc(100vw-3rem)] md:w-40 h-20 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm px-4 md:px-6">
                Error loading entries: {error.message}
              </div>
            )}

            {!isLoading && entries.length === 0 && (
              <div className="text-slate-500 text-sm py-4 px-4 md:px-6">
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
              <div
                ref={carouselRef}
                className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-hidden pb-2 px-4 md:px-6 scroll-smooth max-w-full scroll-snap-x"
                style={{
                  scrollbarWidth: "thin",
                  scrollPaddingInline: isMobile ? "1rem" : "50%",
                }}
              >
                {/* Left spacer for centering first item - desktop only */}
                {!isMobile && (
                  <div
                    className="shrink-0 hidden md:block"
                    style={{ width: "calc(50vw - 11rem - 128px)" }}
                    aria-hidden="true"
                  />
                )}

                {entries.map((entry) => {
                  const isActive = pathname?.includes(`/entries/${entry.id}`);

                  return (
                    <Link
                      key={entry.id}
                      ref={isActive ? activeEntryRef : undefined}
                      href={`/franchises/${franchiseId}/entries/${entry.id}`}
                      className={`
                        shrink-0 w-[calc(100vw-3rem)] md:w-44 p-3 rounded-lg border transition-all snap-center touch-target
                        ${
                          isActive
                            ? "border-2 bg-white shadow-lg"
                            : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow"
                        }
                      `}
                      style={{
                        ...(isActive && {
                          borderColor: franchise?.accent ?? "#64748b",
                          boxShadow: `0 4px 14px -2px ${franchise?.accent ?? "#64748b"}40`,
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
                              backgroundColor: franchise?.accent ?? "#64748b",
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

                {/* Right spacer for centering last item - desktop only */}
                {!isMobile && (
                  <div
                    className="shrink-0 hidden md:block"
                    style={{ width: "calc(50vw - 11rem - 128px)" }}
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
