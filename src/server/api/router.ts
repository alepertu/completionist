import { router } from "./trpc";
import { franchiseRouter } from "./routers/franchise";
import { entryRouter } from "./routers/entry";
import { milestoneRouter } from "./routers/milestone";
import { completionRouter } from "./routers/completion";
import { preferencesRouter } from "./routers/preferences";

export const appRouter = router({
  franchise: franchiseRouter,
  entry: entryRouter,
  milestone: milestoneRouter,
  completion: completionRouter,
  preferences: preferencesRouter,
});

export type AppRouter = typeof appRouter;
