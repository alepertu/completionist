"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import { AdminShell } from "src/components/admin/AdminShell";
import { MilestoneEditor } from "src/components/admin/MilestoneEditor";

export default function AdminEntryMilestonesPage() {
  const params = useParams();
  const entryId = params?.entryId as string;

  return (
    <AdminShell
      title="Milestones"
      subtitle="Edit, reorder, and reparent milestones for this entry."
      actions={
        <Link
          href="/admin/franchises"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to franchises
        </Link>
      }
    >
      <MilestoneEditor entryId={entryId} />
    </AdminShell>
  );
}
