"use client";

import React, { useState } from "react";

export type BatchLoadModalProps = {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (lines: string[]) => void;
  onCancel: () => void;
};

export function BatchLoadModal({
  open,
  title,
  description,
  placeholder = "Item 1\nItem 2\nItem 3",
  loading = false,
  error,
  onSubmit,
  onCancel,
}: BatchLoadModalProps) {
  const [text, setText] = useState("");

  if (!open) return null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const lineCount = lines.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) return;
    onSubmit(lines);
  };

  const handleClose = () => {
    setText("");
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-title"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 id="batch-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={10}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono focus:border-slate-400 focus:outline-none resize-none"
              autoFocus
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>
                {lineCount} item{lineCount !== 1 ? "s" : ""} to create
              </span>
              <span>One item per line</span>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lineCount === 0}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              Create {lineCount} item{lineCount !== 1 ? "s" : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
