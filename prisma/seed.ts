import "dotenv/config";

import { withAccelerate } from "@prisma/extension-accelerate";
import { MediaType, PrismaClient } from "@prisma/client";

type MilestoneSeed = {
  title: string;
  type: "CHECKBOX" | "COUNTER";
  target?: number;
  current?: number;
  description?: string;
  displayOrder?: number;
  children?: MilestoneSeed[];
};

type EntrySeed = {
  title: string;
  mediaType: MediaType;
  isOptional?: boolean;
  displayOrder?: number;
  milestones: MilestoneSeed[];
};

type FranchiseSeed = {
  name: string;
  accent: string;
  entries: EntrySeed[];
};

const seedData: FranchiseSeed[] = [
  {
    name: "Legends of Aurora",
    accent: "#7c3aed",
    entries: [
      {
        title: "Aurora Zero",
        mediaType: MediaType.GAME,
        isOptional: false,
        displayOrder: 10,
        milestones: [
          {
            title: "Campaign",
            type: "CHECKBOX",
            current: 1,
            description: "Finish the opening act and unlock co-op",
            children: [
              { title: "Tutorial", type: "CHECKBOX", current: 1 },
              {
                title: "Chapter Goals",
                type: "COUNTER",
                target: 3,
                current: 2,
                description: "Complete the first three story missions",
              },
            ],
          },
          {
            title: "Scanner Logs",
            type: "COUNTER",
            target: 50,
            current: 15,
            description: "Collect data caches scattered across the hub",
          },
          {
            title: "Mastery Trials",
            type: "CHECKBOX",
            current: 0,
            children: [
              { title: "Time Trials", type: "COUNTER", target: 5, current: 1 },
              { title: "No-damage boss", type: "CHECKBOX", current: 0 },
            ],
          },
        ],
      },
      {
        title: "Fragments DLC",
        mediaType: MediaType.GAME,
        isOptional: true,
        displayOrder: 20,
        milestones: [
          { title: "Story episodes", type: "COUNTER", target: 4, current: 1 },
          {
            title: "Hidden Echoes",
            type: "CHECKBOX",
            current: 0,
            description: "Find the secret endings and lore stingers",
          },
        ],
      },
    ],
  },
  {
    name: "Chronicles Archive",
    accent: "#0ea5e9",
    entries: [
      {
        title: "Archive Vol. 1",
        mediaType: MediaType.BOOK,
        isOptional: false,
        displayOrder: 10,
        milestones: [
          { title: "Chapters", type: "COUNTER", target: 12, current: 6 },
          {
            title: "Appendix Research",
            type: "CHECKBOX",
            current: 1,
            description: "Review historical notes in the appendix",
          },
          { title: "Discussion Notes", type: "CHECKBOX", current: 0 },
        ],
      },
      {
        title: "Film Adaptation",
        mediaType: MediaType.MOVIE,
        isOptional: false,
        displayOrder: 20,
        milestones: [
          { title: "Watch main cut", type: "CHECKBOX", current: 1 },
          { title: "Commentary track", type: "CHECKBOX", current: 0 },
          {
            title: "Storyboard gallery",
            type: "COUNTER",
            target: 8,
            current: 3,
          },
        ],
      },
    ],
  },
  {
    name: "Indie Anthology",
    accent: "#22c55e",
    entries: [
      {
        title: "Weekend Jam",
        mediaType: MediaType.OTHER,
        isOptional: false,
        displayOrder: 10,
        milestones: [
          { title: "Prototype", type: "CHECKBOX", current: 1 },
          {
            title: "Playtest rounds",
            type: "COUNTER",
            target: 3,
            current: 2,
            description: "Run short playtests with friends",
          },
          { title: "Release page", type: "CHECKBOX", current: 0 },
        ],
      },
      {
        title: "Bonus Tracks",
        mediaType: MediaType.OTHER,
        isOptional: true,
        displayOrder: 20,
        milestones: [
          { title: "Mix drafts", type: "COUNTER", target: 6, current: 2 },
          { title: "Mastering", type: "CHECKBOX", current: 0 },
        ],
      },
    ],
  },
];

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// For Prisma Accelerate, use accelerateUrl option
const prisma = new PrismaClient({
  accelerateUrl: connectionString,
}).$extends(withAccelerate());

async function clearDatabase() {
  // Delete in correct order respecting foreign key constraints
  await prisma.milestone.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.franchise.deleteMany();
  // Only delete userPreferences if it exists
  await prisma.userPreferences.deleteMany().catch(() => {});
}

function normalizeCurrent(node: MilestoneSeed): number {
  if (node.type === "COUNTER") {
    const target = node.target ?? 0;
    const current = node.current ?? 0;
    if (target <= 0) return 0;
    return Math.min(Math.max(current, 0), target);
  }
  return node.current && node.current > 0 ? 1 : 0;
}

async function createMilestones(
  entryId: string,
  nodes: MilestoneSeed[],
  parentId: string | null = null
) {
  let order = 10;
  for (const node of nodes) {
    const milestone = await prisma.milestone.create({
      data: {
        entryId,
        parentId,
        title: node.title,
        type: node.type,
        target: node.type === "COUNTER" ? (node.target ?? null) : null,
        current: normalizeCurrent(node),
        description: node.description ?? null,
        displayOrder: node.displayOrder ?? order,
      },
    });

    order += 10;

    if (node.children?.length) {
      await createMilestones(entryId, node.children, milestone.id);
    }
  }
}

async function createEntries(franchiseId: string, entries: EntrySeed[]) {
  let order = 10;
  for (const entry of entries) {
    const createdEntry = await prisma.entry.create({
      data: {
        franchiseId,
        title: entry.title,
        mediaType: entry.mediaType,
        isOptional: entry.isOptional ?? false,
        displayOrder: entry.displayOrder ?? order,
      },
    });

    order += 10;

    if (entry.milestones.length) {
      await createMilestones(createdEntry.id, entry.milestones);
    }
  }
}

async function seedFranchises() {
  for (const franchise of seedData) {
    const createdFranchise = await prisma.franchise.create({
      data: {
        name: franchise.name,
        accent: franchise.accent,
      },
    });

    await createEntries(createdFranchise.id, franchise.entries);
  }
}

async function main() {
  await clearDatabase();
  await seedFranchises();

  await prisma.userPreferences.create({
    data: {
      includeOptionalEntries: true,
    },
  });

  console.log("Database seeded with sample admin data");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
