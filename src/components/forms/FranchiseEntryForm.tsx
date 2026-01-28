"use client";

import React, { useState, useEffect } from "react";
import { MediaType } from "@prisma/client";

// Color presets for accent picker
const ACCENT_PRESETS = [
  { name: "Cyan", value: "#00e5ff" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
];

// -------------------
// Franchise Form
// -------------------

export type FranchiseFormData = {
  name: string;
  accent: string;
};

type FranchiseFormProps = {
  initialData?: FranchiseFormData;
  onSubmit: (data: FranchiseFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
};

export function FranchiseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
}: FranchiseFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [accent, setAccent] = useState(
    initialData?.accent ?? ACCENT_PRESETS[0].value
  );
  const [customColor, setCustomColor] = useState("");
  const [errors, setErrors] = useState<{ name?: string; accent?: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAccent(initialData.accent);
      // Check if initial accent is a custom color
      if (!ACCENT_PRESETS.some((p) => p.value === initialData.accent)) {
        setCustomColor(initialData.accent);
      }
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!accent.trim() || !/^#[0-9A-Fa-f]{6}$/.test(accent)) {
      newErrors.accent = "Valid hex color required (e.g., #00e5ff)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: name.trim(), accent });
  };

  const handlePresetClick = (color: string) => {
    setAccent(color);
    setCustomColor("");
    setErrors((prev) => ({ ...prev, accent: undefined }));
  };

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setAccent(value);
      setErrors((prev) => ({ ...prev, accent: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label
          htmlFor="franchise-name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Franchise Name
        </label>
        <input
          id="franchise-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
            ${errors.name ? "border-red-500" : "border-slate-300"}
          `}
          placeholder="Enter franchise name"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Accent Color Picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Accent Color
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={`
                w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                ${accent === preset.value ? "border-slate-900 ring-2 ring-offset-2" : "border-white shadow-md"}
              `}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
              disabled={isLoading}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Custom hex color (e.g., #ff5500)"
            disabled={isLoading}
          />
          <div
            className="w-10 h-10 rounded-lg border border-slate-300"
            style={{ backgroundColor: accent }}
          />
        </div>
        {errors.accent && (
          <p className="mt-1 text-xs text-red-500">{errors.accent}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// -------------------
// Entry Form
// -------------------

export type EntryFormData = {
  title: string;
  mediaType: MediaType;
  isOptional: boolean;
};

type EntryFormProps = {
  initialData?: EntryFormData;
  onSubmit: (data: EntryFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  accentColor?: string;
};

const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string; icon: string }[] =
  [
    { value: "GAME", label: "Game", icon: "🎮" },
    { value: "BOOK", label: "Book", icon: "📚" },
    { value: "MOVIE", label: "Movie", icon: "🎬" },
    { value: "OTHER", label: "Other", icon: "📦" },
  ];

export function EntryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
  accentColor = "#00e5ff",
}: EntryFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [mediaType, setMediaType] = useState<MediaType>(
    initialData?.mediaType ?? "GAME"
  );
  const [isOptional, setIsOptional] = useState(
    initialData?.isOptional ?? false
  );
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setMediaType(initialData.mediaType);
      setIsOptional(initialData.isOptional);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title: title.trim(), mediaType, isOptional });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Field */}
      <div>
        <label
          htmlFor="entry-title"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Entry Title
        </label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
            ${errors.title ? "border-red-500" : "border-slate-300"}
          `}
          placeholder="Enter entry title"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Media Type Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Media Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MEDIA_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMediaType(option.value)}
              disabled={isLoading}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${
                  mediaType === option.value
                    ? "border-current bg-opacity-10"
                    : "border-slate-200 hover:border-slate-300"
                }
              `}
              style={{
                borderColor:
                  mediaType === option.value ? accentColor : undefined,
                backgroundColor:
                  mediaType === option.value ? `${accentColor}15` : undefined,
              }}
            >
              <div className="text-xl mb-1">{option.icon}</div>
              <div className="text-xs font-medium text-slate-700">
                {option.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <div className="text-sm font-medium text-slate-700">
            Mark as Optional
          </div>
          <div className="text-xs text-slate-500">
            Optional entries can be excluded from completion calculations
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOptional(!isOptional)}
          disabled={isLoading}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${isOptional ? "" : "bg-slate-300"}
          `}
          style={{ backgroundColor: isOptional ? accentColor : undefined }}
          role="switch"
          aria-checked={isOptional}
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
              ${isOptional ? "translate-x-6" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// -------------------
// Accent Picker (Standalone)
// -------------------

type AccentPickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export function AccentPicker({
  value,
  onChange,
  disabled = false,
}: AccentPickerProps) {
  const [customColor, setCustomColor] = useState("");

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor("");
  };

  const handleCustomColorChange = (input: string) => {
    setCustomColor(input);
    if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
      onChange(input);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={`
              w-7 h-7 rounded-full border-2 transition-transform hover:scale-110
              ${value === preset.value ? "border-slate-900 ring-2 ring-offset-1" : "border-white shadow"}
            `}
            style={{ backgroundColor: preset.value }}
            title={preset.name}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customColor}
          onChange={(e) => handleCustomColorChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="#ff5500"
          disabled={disabled}
        />
        <div
          className="w-6 h-6 rounded border border-slate-300"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

// -------------------
// Optional Toggle (Standalone)
// -------------------

type OptionalToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accentColor?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export function OptionalToggle({
  value,
  onChange,
  accentColor = "#00e5ff",
  disabled = false,
  label = "Optional",
  description,
}: OptionalToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {description && (
          <div className="text-xs text-slate-500">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${value ? "" : "bg-slate-300"}
        `}
        style={{ backgroundColor: value ? accentColor : undefined }}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${value ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
