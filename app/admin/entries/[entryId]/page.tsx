"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { AdminShell } from "src/components/admin/AdminShell";
import { MilestoneEditor } from "src/components/admin/MilestoneEditor";
import { api } from "src/trpc/react";

export default function AdminEntryMilestonesPage() {
  const params = useParams();
  const entryId = params?.entryId as string;

  const { data: entryData } = api.entry.get.useQuery(
    { entryId },
    { enabled: !!entryId }
  );

  const franchiseId = entryData?.entry?.franchiseId;
  const franchiseName = entryData?.entry?.franchise?.name;
  const entryTitle = entryData?.entry?.title;

  return (
    <AdminShell
      title={entryTitle ? `Milestones: ${entryTitle}` : "Milestones"}
      subtitle="Edit, reorder, and reparent milestones for this entry."
      actions={
        <Link
          href={
            franchiseId
              ? `/admin/franchises/${franchiseId}`
              : "/admin/franchises"
          }
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to {franchiseName ?? "franchise"}
        </Link>
      }
    >
      <MilestoneEditor entryId={entryId} />
    </AdminShell>
  );
}
