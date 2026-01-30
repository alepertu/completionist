"use client";

type CompletionSummaryProps = {
  title: string;
  percent: number;
  completed: number;
  total: number;
  accentColor?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
};

export function CompletionSummary({
  title,
  percent,
  completed,
  total,
  accentColor = "#64748b",
  subtitle,
  size = "md",
}: CompletionSummaryProps) {
  const sizeClasses = {
    sm: {
      container: "p-3",
      title: "text-sm font-medium",
      percent: "text-2xl font-bold",
      progress: "h-2",
      stats: "text-xs",
    },
    md: {
      container: "p-4",
      title: "text-base font-semibold",
      percent: "text-3xl font-bold",
      progress: "h-3",
      stats: "text-sm",
    },
    lg: {
      container: "p-6",
      title: "text-lg font-bold",
      percent: "text-4xl font-extrabold",
      progress: "h-4",
      stats: "text-base",
    },
  };

  const styles = sizeClasses[size];
  const roundedPercent = Math.round(percent);
  const isComplete = roundedPercent >= 100;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${styles.container}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`${styles.title} text-slate-900`}>{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <div className={styles.percent} style={{ color: accentColor }}>
            {roundedPercent}%
          </div>
          {isComplete && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Complete!
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`w-full rounded-full bg-slate-100 overflow-hidden ${styles.progress}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(percent, 100)}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>

      {/* Stats */}
      <div
        className={`mt-2 flex items-center justify-between ${styles.stats} text-slate-500`}
      >
        <span>
          {completed} of {total} milestones completed
        </span>
        {total > 0 && !isComplete && <span>{total - completed} remaining</span>}
      </div>
    </div>
  );
}

type CompletionGridProps = {
  items: Array<{
    id: string;
    title: string;
    percent: number;
    completed: number;
    total: number;
    isOptional?: boolean;
  }>;
  accentColor?: string;
};

export function CompletionGrid({
  items,
  accentColor = "#64748b",
}: CompletionGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No items to display</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <CompletionSummary
          key={item.id}
          title={item.title}
          percent={item.percent}
          completed={item.completed}
          total={item.total}
          accentColor={accentColor}
          subtitle={item.isOptional ? "Optional" : undefined}
          size="sm"
        />
      ))}
    </div>
  );
}
