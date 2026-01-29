import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../db";
import { publicProcedure, router } from "../trpc";
import { computePercent, type MilestoneNode } from "src/lib/completion";
import { buildDisplayOrderUpdates, willCreateCycle } from "./milestone-helpers";

type AdminMilestoneNode = {
  id: string;
  title: string;
  type: "CHECKBOX" | "COUNTER";
  target: number | null;
  current: number;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  children: AdminMilestoneNode[];
};

type MilestoneIdParent = { id: string; parentId: string | null };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const milestoneRouter = router({
  tree: publicProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ input }) => {
      const milestones = await prisma.milestone.findMany({
        where: { entryId: input.entryId },
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
          else roots.push(node);
        } else {
          roots.push(node);
        }
      });

      const results = roots.map((r) => ({
        node: r,
        completion: computePercent(r),
      }));
      return { roots: results };
    }),

  treeAdmin: publicProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ input }) => {
      const milestones = await prisma.milestone.findMany({
        where: { entryId: input.entryId },
        orderBy: { displayOrder: "asc" },
      });

      const nodeMap = new Map<string, AdminMilestoneNode>();
      milestones.forEach((m: (typeof milestones)[number]) => {
        nodeMap.set(m.id, {
          id: m.id,
          title: m.title,
          type: m.type,
          target: m.target,
          current: m.current,
          description: m.description,
          parentId: m.parentId,
          displayOrder: m.displayOrder,
          children: [],
        });
      });

      const roots: AdminMilestoneNode[] = [];
      milestones.forEach((m: (typeof milestones)[number]) => {
        const node = nodeMap.get(m.id)!;
        if (m.parentId) {
          const parent = nodeMap.get(m.parentId);
          if (parent) parent.children.push(node);
          else roots.push(node);
        } else {
          roots.push(node);
        }
      });

      return { roots };
    }),

  create: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        parentId: z.string().nullish(),
        title: z.string().min(1),
        type: z.enum(["CHECKBOX", "COUNTER"]),
        target: z.number().optional(),
        description: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.type === "COUNTER" && (!input.target || input.target <= 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Counter target must be > 0",
        });
      }

      if (input.parentId) {
        const parent = await prisma.milestone.findUnique({
          where: { id: input.parentId },
        });
        if (!parent || parent.entryId !== input.entryId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent",
          });
        }
      }

      const maxOrder = await prisma.milestone.aggregate({
        where: { entryId: input.entryId, parentId: input.parentId ?? null },
        _max: { displayOrder: true },
      });
      const nextOrder =
        input.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 10;

      const milestone = await prisma.milestone.create({
        data: {
          entryId: input.entryId,
          parentId: input.parentId ?? null,
          title: input.title,
          type: input.type,
          target: input.type === "COUNTER" ? input.target : null,
          current: input.type === "COUNTER" ? 0 : 0,
          description: input.description,
          displayOrder: nextOrder,
        },
      });

      return { milestone };
    }),

  update: publicProcedure
    .input(
      z.object({
        milestoneId: z.string(),
        title: z.string().min(1).optional(),
        type: z.enum(["CHECKBOX", "COUNTER"]).optional(),
        target: z.number().optional(),
        current: z.number().optional(),
        description: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.milestone.findUnique({
        where: { id: input.milestoneId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const nextType = input.type ?? existing.type;
      let nextTarget = input.target ?? existing.target;
      if (nextType === "COUNTER") {
        if (!nextTarget || nextTarget <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Counter target must be > 0",
          });
        }
      } else {
        nextTarget = null;
      }

      let nextCurrent = existing.current;
      if (typeof input.current === "number") {
        nextCurrent = input.current;
      }
      if (nextType === "COUNTER") {
        const targetVal = nextTarget ?? 0;
        nextCurrent = clamp(nextCurrent, 0, targetVal);
      } else {
        nextCurrent = nextCurrent >= 1 ? 1 : 0;
      }

      const milestone = await prisma.milestone.update({
        where: { id: input.milestoneId },
        data: {
          title: input.title,
          type: nextType,
          target: nextTarget,
          current: nextCurrent,
          description: input.description,
          displayOrder: input.displayOrder,
        },
      });

      return { milestone };
    }),

  reparent: publicProcedure
    .input(
      z.object({ milestoneId: z.string(), newParentId: z.string().nullish() })
    )
    .mutation(async ({ input }) => {
      const node = await prisma.milestone.findUnique({
        where: { id: input.milestoneId },
      });
      if (!node) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.newParentId) {
        const parent = await prisma.milestone.findUnique({
          where: { id: input.newParentId },
        });
        if (!parent || parent.entryId !== node.entryId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent",
          });
        }
      }

      const siblings = await prisma.milestone.findMany({
        where: { entryId: node.entryId },
        select: { id: true, parentId: true },
      });

      if (
        willCreateCycle(
          siblings.map((s: MilestoneIdParent) => ({
            id: s.id,
            parentId: s.parentId,
          })),
          node.id,
          input.newParentId ?? null
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reparent would create a cycle",
        });
      }

      const maxOrder = await prisma.milestone.aggregate({
        where: { entryId: node.entryId, parentId: input.newParentId ?? null },
        _max: { displayOrder: true },
      });
      const nextOrder = (maxOrder._max.displayOrder ?? 0) + 10;

      const milestone = await prisma.milestone.update({
        where: { id: node.id },
        data: { parentId: input.newParentId ?? null, displayOrder: nextOrder },
      });

      return { milestone };
    }),

  reorder: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        parentId: z.string().nullish(),
        orderedIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const nodes = await prisma.milestone.findMany({
        where: { id: { in: input.orderedIds }, entryId: input.entryId },
        select: { id: true, parentId: true },
      });

      if (nodes.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orderedIds must belong to entry",
        });
      }

      const sameParent = nodes.every(
        (n: MilestoneIdParent) =>
          (n.parentId ?? null) === (input.parentId ?? null)
      );
      if (!sameParent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All nodes must share the same parent",
        });
      }

      const updates = buildDisplayOrderUpdates(input.orderedIds);
      await prisma.$transaction(
        updates.map((u: { id: string; displayOrder: number }) =>
          prisma.milestone.update({
            where: { id: u.id },
            data: { displayOrder: u.displayOrder },
          })
        )
      );

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ milestoneId: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.milestone.delete({ where: { id: input.milestoneId } });
      return { success: true };
    }),

  increment: publicProcedure
    .input(
      z.object({
        milestoneId: z.string(),
        delta: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const milestone = await prisma.milestone.findUnique({
        where: { id: input.milestoneId },
      });

      if (!milestone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Milestone not found",
        });
      }

      let newCurrent: number;

      if (milestone.type === "CHECKBOX") {
        // Toggle between 0 and 1 for checkboxes
        newCurrent = milestone.current >= 1 ? 0 : 1;
      } else {
        // Counter: increment/decrement with clamp
        const target = milestone.target ?? 0;
        newCurrent = clamp(milestone.current + input.delta, 0, target);
      }

      const updated = await prisma.milestone.update({
        where: { id: input.milestoneId },
        data: { current: newCurrent },
      });

      return {
        milestone: updated,
        previousCurrent: milestone.current,
      };
    }),

  // Set counter to a specific value (for slider/direct input)
  setCurrent: publicProcedure
    .input(
      z.object({
        milestoneId: z.string(),
        value: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const milestone = await prisma.milestone.findUnique({
        where: { id: input.milestoneId },
      });

      if (!milestone) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Milestone not found",
        });
      }

      let newCurrent: number;

      if (milestone.type === "CHECKBOX") {
        // For checkboxes, treat any value >= 1 as checked
        newCurrent = input.value >= 1 ? 1 : 0;
      } else {
        // Counter: clamp to valid range
        const target = milestone.target ?? 0;
        newCurrent = clamp(input.value, 0, target);
      }

      const updated = await prisma.milestone.update({
        where: { id: input.milestoneId },
        data: { current: newCurrent },
      });

      return {
        milestone: updated,
        previousCurrent: milestone.current,
      };
    }),

  duplicateSubtree: publicProcedure
    .input(
      z.object({ milestoneId: z.string(), newParentId: z.string().nullish() })
    )
    .mutation(async ({ input }) => {
      const all = await prisma.milestone.findMany({
        where: {
          entryId: (
            await prisma.milestone.findUniqueOrThrow({
              where: { id: input.milestoneId },
            })
          ).entryId,
        },
      });
      const root = all.find(
        (m: (typeof all)[number]) => m.id === input.milestoneId
      );
      if (!root) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.newParentId) {
        const parent = all.find(
          (m: (typeof all)[number]) => m.id === input.newParentId
        );
        if (!parent || parent.entryId !== root.entryId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent",
          });
        }
      }

      // Build subtree
      const childrenMap = new Map<string | null, typeof all>();
      all.forEach((m: (typeof all)[number]) => {
        const list = childrenMap.get(m.parentId ?? null) ?? [];
        list.push(m);
        childrenMap.set(m.parentId ?? null, list);
      });

      const subtreeIds = new Set<string>();
      const stack = [root];
      while (stack.length) {
        const node = stack.pop()!;
        subtreeIds.add(node.id);
        const kids = childrenMap.get(node.id) ?? [];
        kids.forEach((k: (typeof kids)[number]) => stack.push(k));
      }

      if (input.newParentId && subtreeIds.has(input.newParentId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot duplicate under descendant",
        });
      }

      const entryId = root.entryId;
      const parentMax = await prisma.milestone.aggregate({
        where: { entryId, parentId: input.newParentId ?? null },
        _max: { displayOrder: true },
      });
      const parentCounters = new Map<string | null, number>();
      parentCounters.set(
        input.newParentId ?? null,
        (parentMax._max.displayOrder ?? 0) + 10
      );

      const newIds = new Map<string, string>();

      const createNode = async (node: typeof root, parentId: string | null) => {
        const start = parentCounters.get(parentId) ?? 0;
        parentCounters.set(parentId, start + 10);
        const created = await prisma.milestone.create({
          data: {
            entryId,
            parentId,
            title: node.title,
            type: node.type,
            target: node.type === "COUNTER" ? node.target : null,
            current: 0,
            description: node.description,
            displayOrder: start,
          },
        });
        newIds.set(node.id, created.id);
        const children = childrenMap.get(node.id) ?? [];
        for (const child of children) {
          await createNode(child, created.id);
        }
      };

      await createNode(root, input.newParentId ?? null);

      return { success: true };
    }),

  batchCreate: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        parentId: z.string().nullish(),
        titles: z.array(z.string().min(1)),
        type: z.enum(["CHECKBOX", "COUNTER"]).default("CHECKBOX"),
        target: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.titles.length === 0) {
        return { milestones: [], count: 0 };
      }

      // Validate counter target
      if (input.type === "COUNTER" && (!input.target || input.target <= 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Counter target must be > 0",
        });
      }

      // Validate parent if provided
      if (input.parentId) {
        const parent = await prisma.milestone.findUnique({
          where: { id: input.parentId },
        });
        if (!parent || parent.entryId !== input.entryId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent",
          });
        }
      }

      const maxOrder = await prisma.milestone.aggregate({
        where: { entryId: input.entryId, parentId: input.parentId ?? null },
        _max: { displayOrder: true },
      });
      let nextOrder = (maxOrder._max.displayOrder ?? 0) + 10;

      const createdMilestones = await prisma.$transaction(
        input.titles.map((title) => {
          const order = nextOrder;
          nextOrder += 10;
          return prisma.milestone.create({
            data: {
              entryId: input.entryId,
              parentId: input.parentId ?? null,
              title: title.trim(),
              type: input.type,
              target: input.type === "COUNTER" ? input.target : null,
              current: 0,
              displayOrder: order,
            },
          });
        })
      );

      return { milestones: createdMilestones, count: createdMilestones.length };
    }),
});
