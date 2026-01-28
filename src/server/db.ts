/* eslint-env node */

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: connectionString,
  }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
