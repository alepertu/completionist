import { z } from "zod";
import { prisma } from "../../db";
import { publicProcedure, router } from "../trpc";
import { computePercent, type MilestoneNode } from "src/lib/completion";

export type CompletionResult = {
  milestoneId: string;
  percent: number;
  completed: number;
  total: number;
};

export type EntryCompletionResult = {
  entryId: string;
  percent: number;
  completed: number;
  total: number;
};

export type FranchiseCompletionResult = {
  franchiseId: string;
  percent: number;
  entryCount: number;
};

async function loadMilestoneTree(entryId: string): Promise<MilestoneNode[]> {
  const milestones = await prisma.milestone.findMany({
    where: { entryId },
    orderBy: { displayOrder: "asc" },
  });

  const nodeMap = new Map<string, MilestoneNode>();
  milestones.forEach((m) => {
    nodeMap.set(m.id, {
      id: m.id,
      title: m.title,
      type: m.type,
      target: m.target ?? undefined,
      current: m.current ?? undefined,
      children: [],
    });
  });

  const roots: MilestoneNode[] = [];
  milestones.forEach((m) => {
    const node = nodeMap.get(m.id)!;
    if (m.parentId) {
      const parent = nodeMap.get(m.parentId);
      if (parent) parent.children?.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function collectCompletionResults(
  node: MilestoneNode,
  results: CompletionResult[]
): CompletionResult {
  if (node.children && node.children.length > 0) {
    const childResults = node.children.map((child) =>
      collectCompletionResults(child, results)
    );
    const percent =
      childResults.reduce((acc, c) => acc + c.percent, 0) / childResults.length;
    const completed = childResults.reduce((acc, c) => acc + c.completed, 0);
    const total = childResults.reduce((acc, c) => acc + c.total, 0);
    const result = { milestoneId: node.id, percent, completed, total };
    results.push(result);
    return result;
  }

  const result = computePercent(node);
  const completionResult = {
    milestoneId: node.id,
    percent: result.percent,
    completed: result.completed,
    total: result.total,
  };
  results.push(completionResult);
  return completionResult;
}

async function computeEntryCompletion(
  entryId: string
): Promise<EntryCompletionResult> {
  const roots = await loadMilestoneTree(entryId);

  if (roots.length === 0) {
    return { entryId, percent: 0, completed: 0, total: 0 };
  }

  const allResults: CompletionResult[] = [];
  const rootResults = roots.map((root) =>
    collectCompletionResults(root, allResults)
  );

  const percent =
    rootResults.reduce((acc, r) => acc + r.percent, 0) / rootResults.length;
  const completed = rootResults.reduce((acc, r) => acc + r.completed, 0);
  const total = rootResults.reduce((acc, r) => acc + r.total, 0);

  return { entryId, percent, completed, total };
}

async function computeFranchiseCompletion(
  franchiseId: string,
  includeOptionalEntries: boolean
): Promise<FranchiseCompletionResult> {
  const entries = await prisma.entry.findMany({
    where: { franchiseId },
  });

  const filteredEntries = includeOptionalEntries
    ? entries
    : entries.filter((e) => !e.isOptional);

  if (filteredEntries.length === 0) {
    return { franchiseId, percent: 0, entryCount: 0 };
  }

  const entryCompletions = await Promise.all(
    filteredEntries.map((entry) => computeEntryCompletion(entry.id))
  );

  const percent =
    entryCompletions.reduce((acc, ec) => acc + ec.percent, 0) /
    entryCompletions.length;

  return {
    franchiseId,
    percent,
    entryCount: filteredEntries.length,
  };
}

export const completionRouter = router({
  /**
   * Recompute completion for an entry or franchise.
   * Returns detailed milestone-level completion data plus rolled-up entry/franchise percent.
   */
  recompute: publicProcedure
    .input(
      z.object({
        entryId: z.string().optional(),
        franchiseId: z.string().optional(),
        includeOptionalEntries: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      // If entryId is provided, compute for that entry
      if (input.entryId) {
        const roots = await loadMilestoneTree(input.entryId);
        const milestoneResults: CompletionResult[] = [];

        const rootResults = roots.map((root) =>
          collectCompletionResults(root, milestoneResults)
        );

        const entryPercent =
          rootResults.length > 0
            ? rootResults.reduce((acc, r) => acc + r.percent, 0) /
              rootResults.length
            : 0;
        const entryCompleted = rootResults.reduce(
          (acc, r) => acc + r.completed,
          0
        );
        const entryTotal = rootResults.reduce((acc, r) => acc + r.total, 0);

        return {
          milestones: milestoneResults,
          entry: {
            entryId: input.entryId,
            percent: entryPercent,
            completed: entryCompleted,
            total: entryTotal,
          },
          franchise: null,
        };
      }

      // If franchiseId is provided, compute for all entries in the franchise
      if (input.franchiseId) {
        const entries = await prisma.entry.findMany({
          where: { franchiseId: input.franchiseId },
        });

        const filteredEntries = input.includeOptionalEntries
          ? entries
          : entries.filter((e) => !e.isOptional);

        const entryResults: EntryCompletionResult[] = [];
        const allMilestoneResults: CompletionResult[] = [];

        for (const entry of filteredEntries) {
          const roots = await loadMilestoneTree(entry.id);
          const milestoneResults: CompletionResult[] = [];

          const rootResults = roots.map((root) =>
            collectCompletionResults(root, milestoneResults)
          );

          allMilestoneResults.push(...milestoneResults);

          const entryPercent =
            rootResults.length > 0
              ? rootResults.reduce((acc, r) => acc + r.percent, 0) /
                rootResults.length
              : 0;
          const entryCompleted = rootResults.reduce(
            (acc, r) => acc + r.completed,
            0
          );
          const entryTotal = rootResults.reduce((acc, r) => acc + r.total, 0);

          entryResults.push({
            entryId: entry.id,
            percent: entryPercent,
            completed: entryCompleted,
            total: entryTotal,
          });
        }

        const franchisePercent =
          entryResults.length > 0
            ? entryResults.reduce((acc, e) => acc + e.percent, 0) /
              entryResults.length
            : 0;

        return {
          milestones: allMilestoneResults,
          entries: entryResults,
          franchise: {
            franchiseId: input.franchiseId,
            percent: franchisePercent,
            entryCount: entryResults.length,
          },
        };
      }

      // Neither provided, return empty
      return {
        milestones: [],
        entry: null,
        franchise: null,
      };
    }),

  /**
   * Get completion for a single entry (simplified query)
   */
  entry: publicProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ input }) => {
      return computeEntryCompletion(input.entryId);
    }),

  /**
   * Get completion for a franchise (simplified query)
   */
  franchise: publicProcedure
    .input(
      z.object({
        franchiseId: z.string(),
        includeOptionalEntries: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      return computeFranchiseCompletion(
        input.franchiseId,
        input.includeOptionalEntries
      );
    }),
});
