import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../db";
import { publicProcedure, router } from "../trpc";
import { computeEntryCompletion } from "./entry";

type FranchiseSummaryRow = {
  id: string;
  name: string;
  accent: string;
  completionPercent: number;
};

type FranchiseAdminRow = {
  id: string;
  name: string;
  accent: string;
  entryCount: number;
  milestoneCount: number;
};

type FranchiseWithCounts = {
  id: string;
  name: string;
  accent: string;
  entries: Array<{ id: string; _count: { milestones: number } }>;
};

export const franchiseRouter = router({
  list: publicProcedure
    .input(
      z.object({ includeOptionalEntries: z.boolean().optional().default(true) })
    )
    .query(async ({ input }) => {
      const franchises = await prisma.franchise.findMany({
        orderBy: { name: "asc" },
      });

      const results: FranchiseSummaryRow[] = [];

      for (const franchise of franchises) {
        const entries = await prisma.entry.findMany({
          where: { franchiseId: franchise.id },
          orderBy: { displayOrder: "asc" },
        });

        const entryCompletions: number[] = [];
        for (const entry of entries) {
          if (!input.includeOptionalEntries && entry.isOptional) continue;
          const completion = await computeEntryCompletion(entry.id);
          entryCompletions.push(completion.percent);
        }

        const completionPercent = entryCompletions.length
          ? entryCompletions.reduce((a, b) => a + b, 0) /
            entryCompletions.length
          : 0;

        results.push({
          id: franchise.id,
          name: franchise.name,
          accent: franchise.accent,
          completionPercent,
        });
      }

      return { franchises: results };
    }),

  listAdmin: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const searchTerm = input.search?.trim();
      const franchises = (await prisma.franchise.findMany({
        where: searchTerm
          ? { name: { contains: searchTerm, mode: "insensitive" } }
          : undefined,
        orderBy: { name: "asc" },
        include: {
          entries: {
            select: {
              id: true,
              _count: { select: { milestones: true } },
            },
          },
        },
      })) as unknown as FranchiseWithCounts[];

      return {
        franchises: franchises.map(
          (f): FranchiseAdminRow => ({
            id: f.id,
            name: f.name,
            accent: f.accent,
            entryCount: f.entries.length,
            milestoneCount: f.entries.reduce(
              (acc, e) => acc + e._count.milestones,
              0
            ),
          })
        ),
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        accent: z.string().trim().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const franchise = await prisma.franchise.create({
        data: { name: input.name, accent: input.accent },
      });
      return { franchise };
    }),

  update: publicProcedure
    .input(
      z.object({
        franchiseId: z.string(),
        name: z.string().trim().min(1).optional(),
        accent: z.string().trim().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const franchise = await prisma.franchise.update({
        where: { id: input.franchiseId },
        data: { name: input.name, accent: input.accent },
      });
      return { franchise };
    }),

  delete: publicProcedure
    .input(z.object({ franchiseId: z.string() }))
    .mutation(async ({ input }) => {
      const entryCount = await prisma.entry.count({
        where: { franchiseId: input.franchiseId },
      });
      if (entryCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete franchise with ${entryCount} entries. Delete child entries first.`,
        });
      }

      await prisma.franchise.delete({ where: { id: input.franchiseId } });
      return { success: true };
    }),
});
