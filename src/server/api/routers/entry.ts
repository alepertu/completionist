import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MediaType } from "@prisma/client";
import { prisma } from "../../db";
import { publicProcedure, router } from "../trpc";
import { computePercent, type MilestoneNode } from "src/lib/completion";
import { buildDisplayOrderUpdates } from "./milestone-helpers";

export type EntryCompletion = {
  entryId: string;
  percent: number;
  completed: number;
  total: number;
};

type EntryWithCount = {
  id: string;
  title: string;
  mediaType: MediaType;
  isOptional: boolean;
  displayOrder: number;
  _count: { milestones: number };
};

type AdminEntryRow = {
  id: string;
  title: string;
  mediaType: MediaType;
  isOptional: boolean;
  displayOrder: number;
  milestoneCount: number;
  completion: EntryCompletion;
};

type PublicEntryRow = {
  id: string;
  title: string;
  mediaType: MediaType;
  isOptional: boolean;
  displayOrder: number;
  completion: EntryCompletion;
};

async function loadMilestoneTree(entryId: string): Promise<MilestoneNode[]> {
  const milestones = await prisma.milestone.findMany({
    where: { entryId },
    orderBy: { displayOrder: "asc" },
  });

  const nodeMap = new Map<string, MilestoneNode>();
  milestones.forEach((m: (typeof milestones)[number]) => {
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
  milestones.forEach((m: (typeof milestones)[number]) => {
    const node = nodeMap.get(m.id)!;
    if (m.parentId) {
      const parent = nodeMap.get(m.parentId);
      if (parent) parent.children?.push(node);
      else roots.push(node); // orphan fallback
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function computeEntryCompletion(
  entryId: string
): Promise<EntryCompletion> {
  const roots = await loadMilestoneTree(entryId);
  if (roots.length === 0)
    return { entryId, percent: 0, completed: 0, total: 0 };

  const results = roots.map(computePercent);
  const percent =
    results.reduce((acc, r) => acc + r.percent, 0) / results.length;
  const completed = results.reduce((acc, r) => acc + r.completed, 0);
  const total = results.reduce((acc, r) => acc + r.total, 0);
  return { entryId, percent, completed, total };
}

export const entryRouter = router({
  listByFranchise: publicProcedure
    .input(
      z.object({
        franchiseId: z.string(),
        includeOptionalEntries: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const entries = await prisma.entry.findMany({
        where: { franchiseId: input.franchiseId },
        orderBy: { displayOrder: "asc" },
      });

      const results: PublicEntryRow[] = [];

      for (const entry of entries) {
        const completion = await computeEntryCompletion(entry.id);
        results.push({
          id: entry.id,
          title: entry.title,
          mediaType: entry.mediaType,
          isOptional: entry.isOptional,
          displayOrder: entry.displayOrder,
          completion,
        });
      }

      const filtered = input.includeOptionalEntries
        ? results
        : results.filter((e) => !e.isOptional);

      return { entries: filtered };
    }),

  listByFranchiseAdmin: publicProcedure
    .input(z.object({ franchiseId: z.string() }))
    .query(async ({ input }) => {
      const entries = (await prisma.entry.findMany({
        where: { franchiseId: input.franchiseId },
        orderBy: { displayOrder: "asc" },
        include: {
          _count: { select: { milestones: true } },
        },
      })) as unknown as EntryWithCount[];

      const results: AdminEntryRow[] = [];

      for (const entry of entries) {
        const completion = await computeEntryCompletion(entry.id);
        results.push({
          id: entry.id,
          title: entry.title,
          mediaType: entry.mediaType,
          isOptional: entry.isOptional,
          displayOrder: entry.displayOrder,
          milestoneCount: entry._count.milestones,
          completion,
        });
      }

      return { entries: results };
    }),

  create: publicProcedure
    .input(
      z.object({
        franchiseId: z.string(),
        title: z.string().min(1),
        mediaType: z.nativeEnum(MediaType).default(MediaType.GAME),
        isOptional: z.boolean().optional().default(false),
        displayOrder: z.number().optional(),
        autoSeedCheckbox: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const maxOrder = await prisma.entry.aggregate({
        where: { franchiseId: input.franchiseId },
        _max: { displayOrder: true },
      });
      const nextOrder =
        input.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 10;

      const entry = await prisma.entry.create({
        data: {
          franchiseId: input.franchiseId,
          title: input.title,
          mediaType: input.mediaType,
          isOptional: input.isOptional,
          displayOrder: nextOrder,
        },
      });

      // Auto-seed checkbox for binary media types (BOOK, MOVIE)
      if (
        input.autoSeedCheckbox &&
        (input.mediaType === MediaType.BOOK ||
          input.mediaType === MediaType.MOVIE)
      ) {
        const checkboxTitle =
          input.mediaType === MediaType.BOOK ? "Finished Reading" : "Watched";

        await prisma.milestone.create({
          data: {
            entryId: entry.id,
            title: checkboxTitle,
            type: "CHECKBOX",
            current: 0,
            displayOrder: 10,
          },
        });
      }

      return { entry };
    }),

  update: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        title: z.string().min(1).optional(),
        mediaType: z.nativeEnum(MediaType).optional(),
        isOptional: z.boolean().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const entry = await prisma.entry.update({
        where: { id: input.entryId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.mediaType !== undefined && { mediaType: input.mediaType }),
          ...(input.isOptional !== undefined && {
            isOptional: input.isOptional,
          }),
          ...(input.displayOrder !== undefined && {
            displayOrder: input.displayOrder,
          }),
        },
      });
      return { entry };
    }),

  delete: publicProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.entry.delete({ where: { id: input.entryId } });
      return { success: true };
    }),

  bulkDelete: publicProcedure
    .input(z.object({ entryIds: z.array(z.string()).min(1) }))
    .mutation(async ({ input }) => {
      const entries: Array<{ id: string; franchiseId: string }> =
        await prisma.entry.findMany({
          where: { id: { in: input.entryIds } },
          select: { id: true, franchiseId: true },
        });

      if (entries.length !== input.entryIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more entries not found",
        });
      }

      const franchiseId = entries[0]?.franchiseId;
      const sameFranchise = entries.every(
        (e: { id: string; franchiseId: string }) =>
          e.franchiseId === franchiseId
      );
      if (!sameFranchise) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bulk delete must target entries from the same franchise",
        });
      }

      const milestoneCount = await prisma.milestone.count({
        where: { entryId: { in: input.entryIds } },
      });

      await prisma.$transaction([
        prisma.milestone.deleteMany({
          where: { entryId: { in: input.entryIds } },
        }),
        prisma.entry.deleteMany({ where: { id: { in: input.entryIds } } }),
      ]);

      return { deletedEntryIds: entries.map((e) => e.id), milestoneCount };
    }),

  reorder: publicProcedure
    .input(
      z.object({
        franchiseId: z.string(),
        orderedEntryIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const existingIds = await prisma.entry.findMany({
        where: { franchiseId: input.franchiseId },
        select: { id: true },
      });
      const expected = existingIds
        .map((e: { id: string }) => e.id)
        .sort()
        .join(",");
      const provided = [...input.orderedEntryIds].sort().join(",");
      if (expected !== provided) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orderedEntryIds must include all entries",
        });
      }

      const updates = buildDisplayOrderUpdates(input.orderedEntryIds);
      await prisma.$transaction(
        updates.map((u: { id: string; displayOrder: number }) =>
          prisma.entry.update({
            where: { id: u.id },
            data: { displayOrder: u.displayOrder },
          })
        )
      );
      return { success: true };
    }),
});
