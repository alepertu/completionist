"use client";

import React from "react";

export type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled,
  danger = true,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2
            id="confirm-title"
            className="text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
        </div>
        <div
          id="confirm-desc"
          className="space-y-2 px-4 py-3 text-sm text-slate-700"
        >
          {description}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`rounded-md px-3 py-2 text-sm font-medium text-white shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              danger
                ? "bg-red-600 hover:bg-red-500 focus:ring-red-500"
                : "bg-slate-900 hover:bg-slate-800 focus:ring-slate-800"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
