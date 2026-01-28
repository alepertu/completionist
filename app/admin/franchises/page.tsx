"use client";

import React from "react";
import { AdminShell } from "src/components/admin/AdminShell";
import { FranchiseList } from "src/components/admin/FranchiseList";

export default function AdminFranchisesPage() {
  return (
    <AdminShell
      title="Franchises"
      subtitle="Create, edit, delete, and navigate into entries."
    >
      <FranchiseList />
    </AdminShell>
  );
}
