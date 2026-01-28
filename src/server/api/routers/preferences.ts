import { z } from "zod";
import { prisma } from "../../db";
import { publicProcedure, router } from "../trpc";

/**
 * User preferences router for managing global settings like
 * includeOptionalEntries toggle.
 * 
 * Currently uses a single-row pattern (first or create) since
 * we don't have user authentication. In a multi-user system,
 * this would be keyed by userId.
 */
export const preferencesRouter = router({
  /**
   * Get current user preferences.
   * Creates default preferences if none exist.
   */
  get: publicProcedure.query(async () => {
    let prefs = await prisma.userPreferences.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          includeOptionalEntries: true,
        },
      });
    }

    return {
      preferences: {
        id: prefs.id,
        includeOptionalEntries: prefs.includeOptionalEntries,
      },
    };
  }),

  /**
   * Update user preferences.
   * Creates preferences if they don't exist.
   */
  set: publicProcedure
    .input(
      z.object({
        includeOptionalEntries: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let prefs = await prisma.userPreferences.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (!prefs) {
        prefs = await prisma.userPreferences.create({
          data: {
            includeOptionalEntries: input.includeOptionalEntries ?? true,
          },
        });
      } else {
        prefs = await prisma.userPreferences.update({
          where: { id: prefs.id },
          data: {
            ...(input.includeOptionalEntries !== undefined && {
              includeOptionalEntries: input.includeOptionalEntries,
            }),
          },
        });
      }

      return {
        preferences: {
          id: prefs.id,
          includeOptionalEntries: prefs.includeOptionalEntries,
        },
      };
    }),

  /**
   * Toggle includeOptionalEntries preference.
   * Convenience method for quick toggling.
   */
  toggleOptionalEntries: publicProcedure.mutation(async () => {
    let prefs = await prisma.userPreferences.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          includeOptionalEntries: false, // Start with false since toggling from default true
        },
      });
    } else {
      prefs = await prisma.userPreferences.update({
        where: { id: prefs.id },
        data: {
          includeOptionalEntries: !prefs.includeOptionalEntries,
        },
      });
    }

    return {
      preferences: {
        id: prefs.id,
        includeOptionalEntries: prefs.includeOptionalEntries,
      },
    };
  }),
});
