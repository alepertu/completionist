// Shared types that mirror Prisma enums for client-side use
// These must match the values defined in prisma/schema.prisma

export const MediaType = {
  GAME: "GAME",
  BOOK: "BOOK",
  MOVIE: "MOVIE",
  OTHER: "OTHER",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];
