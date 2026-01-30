"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  computePercent,
  type MilestoneNode,
  type CompletionResult,
} from "../../lib/completion";
import { api } from "../../trpc/react";
import { useIsMobile } from "../../hooks/useMediaQuery";

type MilestoneTreeNode = {
  node: MilestoneNode;
  completion: CompletionResult;
};

type MilestoneTreeProps = {
  roots: MilestoneTreeNode[];
  entryId: string;
  accentColor?: string;
  onProgressUpdate?: () => void;
};

type MilestoneItemProps = {
  node: MilestoneNode;
  completion: CompletionResult;
  entryId: string;
  accentColor: string;
  depth?: number;
  onMilestoneUpdate: () => void;
};

function MilestoneItem({
  node,
  completion,
  entryId,
  accentColor,
  depth = 0,
  onMilestoneUpdate,
}: MilestoneItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const utils = api.useUtils();
  const isMobile = useIsMobile();

  // Responsive indentation: 16px on mobile, 24px on desktop
  const indentPixels = isMobile ? 16 : 24;

  // Local state for counter with debounce
  const [localCurrent, setLocalCurrent] = useState(node.current ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Sync local state when node.current changes from server
  useEffect(() => {
    if (pendingValueRef.current === null) {
      setLocalCurrent(node.current ?? 0);
    }
  }, [node.current]);

  const setCounterMutation = api.milestone.setCurrent.useMutation({
    onMutate: async ({ milestoneId, value }) => {
      await utils.milestone.tree.cancel({ entryId });
      const previousData = utils.milestone.tree.getData({ entryId });

      utils.milestone.tree.setData({ entryId }, (old) => {
        if (!old) return old;

        const updateNode = (n: MilestoneNode): MilestoneNode => {
          if (n.id === milestoneId) {
            const target = n.target ?? 0;
            const newCurrent = Math.min(Math.max(value, 0), target);
            return { ...n, current: newCurrent };
          }
          if (n.children) {
            return { ...n, children: n.children.map(updateNode) };
          }
          return n;
        };

        return {
          roots: old.roots.map((item) => ({
            node: updateNode(item.node),
            completion: computePercent(updateNode(item.node)),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.milestone.tree.setData({ entryId }, context.previousData);
      }
    },
    onSettled: () => {
      pendingValueRef.current = null;
      utils.milestone.tree.invalidate({ entryId });
      utils.completion.recompute.invalidate();
      onMilestoneUpdate();
    },
  });

  const incrementMutation = api.milestone.increment.useMutation({
    onMutate: async ({ milestoneId, delta }) => {
      // Cancel any outgoing refetches
      await utils.milestone.tree.cancel({ entryId });

      // Snapshot current data
      const previousData = utils.milestone.tree.getData({ entryId });

      // Optimistically update the cache
      utils.milestone.tree.setData({ entryId }, (old) => {
        if (!old) return old;

        const updateNode = (n: MilestoneNode): MilestoneNode => {
          if (n.id === milestoneId) {
            if (n.type === "CHECKBOX") {
              const newCurrent = (n.current ?? 0) >= 1 ? 0 : 1;
              return { ...n, current: newCurrent };
            } else {
              const target = n.target ?? 0;
              const newCurrent = Math.min(
                Math.max((n.current ?? 0) + (delta ?? 1), 0),
                target
              );
              return { ...n, current: newCurrent };
            }
          }
          if (n.children) {
            return { ...n, children: n.children.map(updateNode) };
          }
          return n;
        };

        return {
          roots: old.roots.map((item) => ({
            node: updateNode(item.node),
            completion: computePercent(updateNode(item.node)),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.milestone.tree.setData({ entryId }, context.previousData);
      }
    },
    onSettled: () => {
      // Invalidate to refetch fresh data
      utils.milestone.tree.invalidate({ entryId });
      utils.completion.recompute.invalidate();
      onMilestoneUpdate();
    },
  });

  const handleCheckboxToggle = () => {
    incrementMutation.mutate({ milestoneId: node.id, delta: 1 });
  };

  // Debounced counter update - batches rapid changes
  const debouncedSetCounter = useCallback(
    (value: number) => {
      const target = node.target ?? 0;
      const clampedValue = Math.min(Math.max(value, 0), target);
      setLocalCurrent(clampedValue);
      pendingValueRef.current = clampedValue;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer (500ms delay)
      debounceTimerRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          setCounterMutation.mutate({
            milestoneId: node.id,
            value: pendingValueRef.current,
          });
        }
      }, 500);
    },
    [node.id, node.target, setCounterMutation]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleCounterChange = (delta: number) => {
    debouncedSetCounter(localCurrent + delta);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetCounter(parseInt(e.target.value, 10));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      debouncedSetCounter(value);
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasChildren) {
      if (e.key === "ArrowRight" && !isExpanded) {
        e.preventDefault();
        setIsExpanded(true);
      } else if (e.key === "ArrowLeft" && isExpanded) {
        e.preventDefault();
        setIsExpanded(false);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    }
  };

  const childCompletions = node.children?.map((child) => ({
    node: child,
    completion: computePercent(child),
  }));

  const getProgressDisplay = () => {
    const isPending = incrementMutation.isPending;

    if (node.type === "CHECKBOX") {
      const isChecked = (node.current ?? 0) >= 1;
      return (
        <button
          onClick={handleCheckboxToggle}
          disabled={isPending}
          className={`
            w-8 h-8 md:w-5 md:h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isChecked ? "bg-opacity-100" : "bg-transparent"}
            ${isPending ? "opacity-50 cursor-wait" : "cursor-pointer hover:opacity-80"}
          `}
          style={{
            borderColor: accentColor,
            backgroundColor: isChecked ? accentColor : "transparent",
          }}
          aria-label={isChecked ? "Uncheck milestone" : "Check milestone"}
        >
          {isChecked && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      );
    }

    if (node.type === "COUNTER") {
      const target = node.target ?? 0;
      const isPendingCounter =
        setCounterMutation.isPending || pendingValueRef.current !== null;
      const canDecrement = localCurrent > 0;
      const canIncrement = localCurrent < target;
      const localPercent = target > 0 ? (localCurrent / target) * 100 : 0;

      // Mobile: compact vertical layout (text above slider)
      if (isMobile) {
        return (
          <div className="flex flex-col items-end gap-1">
            {/* Counter text above */}
            {isEditing ? (
              <input
                type="number"
                min={0}
                max={target}
                value={localCurrent}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                autoFocus
                className="w-14 text-xs text-center font-mono border border-slate-300 rounded px-1 py-0.5"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-500 font-mono hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
                title="Tap to edit"
              >
                {localCurrent}/{target}
                {isPendingCounter && (
                  <span className="ml-1 text-slate-400">...</span>
                )}
              </button>
            )}

            {/* Slider only */}
            <input
              type="range"
              min={0}
              max={target}
              value={localCurrent}
              onChange={handleSliderChange}
              className="w-24 h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${localPercent}%, #e2e8f0 ${localPercent}%, #e2e8f0 100%)`,
              }}
              aria-label={`Progress: ${localCurrent} of ${target}`}
            />
          </div>
        );
      }

      // Desktop: full horizontal layout with buttons
      return (
        <div className="flex items-center gap-2">
          {/* Decrement button */}
          <button
            onClick={() => handleCounterChange(-1)}
            disabled={!canDecrement}
            className={`
              w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
              transition-colors border shrink-0
              ${
                canDecrement
                  ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                  : "border-slate-200 text-slate-300 cursor-not-allowed"
              }
            `}
            aria-label="Decrease counter"
          >
            −
          </button>

          {/* Slider for easy adjustment */}
          <input
            type="range"
            min={0}
            max={target}
            value={localCurrent}
            onChange={handleSliderChange}
            className="w-20 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${localPercent}%, #e2e8f0 ${localPercent}%, #e2e8f0 100%)`,
            }}
            aria-label={`Progress: ${localCurrent} of ${target}`}
          />

          {/* Editable number input */}
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={target}
              value={localCurrent}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus
              className="w-16 text-xs text-center font-mono border border-slate-300 rounded px-1 py-0.5"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-slate-500 font-mono min-w-[50px] text-center hover:bg-slate-100 rounded px-1 py-0.5 transition-colors"
              title="Click to edit value directly"
            >
              {localCurrent}/{target}
              {isPendingCounter && (
                <span className="ml-1 text-slate-400">...</span>
              )}
            </button>
          )}

          {/* Increment button */}
          <button
            onClick={() => handleCounterChange(1)}
            disabled={!canIncrement}
            className={`
              w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
              transition-colors border shrink-0
              ${
                canIncrement
                  ? "text-white hover:opacity-80"
                  : "border-slate-200 text-slate-300 cursor-not-allowed bg-transparent"
              }
            `}
            style={{
              backgroundColor: canIncrement ? accentColor : undefined,
              borderColor: canIncrement ? accentColor : undefined,
            }}
            aria-label="Increase counter"
          >
            +
          </button>
        </div>
      );
    }

    // Parent node (has children) - show aggregate progress
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${completion.percent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <span className="text-xs text-slate-500">
          {Math.round(completion.percent)}%
        </span>
      </div>
    );
  };

  return (
    <div
      className="border-l-2 border-slate-200"
      style={{ marginLeft: depth > 0 ? `${indentPixels}px` : 0 }}
      role="treeitem"
      aria-selected={false}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-level={depth + 1}
      aria-label={`${node.title}, ${Math.round(completion.percent)}% complete`}
    >
      <div
        className={`
          flex items-center gap-2 md:gap-3 py-3 md:py-2 px-2 md:px-3 rounded-r transition-colors
          hover:bg-slate-50 focus-within:bg-slate-50
        `}
        onKeyDown={handleKeyDown}
        tabIndex={hasChildren ? 0 : -1}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="touch-target w-8 h-8 md:w-5 md:h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 rounded"
            aria-label={
              isExpanded ? `Collapse ${node.title}` : `Expand ${node.title}`
            }
            aria-expanded={isExpanded}
            aria-controls={`children-${node.id}`}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <div className="w-8 md:w-5" />
        )}

        {/* Progress Indicator */}
        {getProgressDisplay()}

        {/* Milestone Title */}
        <span className="flex-1 text-sm text-slate-900 font-medium">
          {node.title}
        </span>

        {/* Completion Badge for Parents */}
        {hasChildren && (
          <span className="text-xs text-slate-400">
            {completion.completed}/{completion.total}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2" role="group" id={`children-${node.id}`}>
          {childCompletions?.map((child) => (
            <MilestoneItem
              key={child.node.id}
              node={child.node}
              completion={child.completion}
              entryId={entryId}
              accentColor={accentColor}
              depth={depth + 1}
              onMilestoneUpdate={onMilestoneUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MilestoneTree({
  roots,
  entryId,
  accentColor = "#64748b",
  onProgressUpdate,
}: MilestoneTreeProps) {
  const handleMilestoneUpdate = () => {
    onProgressUpdate?.();
  };

  if (roots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm">No milestones yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1" role="tree" aria-label="Milestone tree">
      {roots.map((item) => (
        <MilestoneItem
          key={item.node.id}
          node={item.node}
          completion={item.completion}
          entryId={entryId}
          accentColor={accentColor}
          onMilestoneUpdate={handleMilestoneUpdate}
        />
      ))}
    </div>
  );
}
