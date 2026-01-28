import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Admin</p>
      <h1 className="text-3xl font-semibold">Admin backend</h1>
      <p className="text-slate-600">
        Manage franchises, entries, and milestone trees. Navigate to a franchise
        to begin editing.
      </p>
      <Link
        href="/admin/franchises"
        className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
      >
        Go to franchises
      </Link>
    </div>
  );
}
