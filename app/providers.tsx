"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { ThemeProvider } from "../src/context/theme-context";
import { MobileMenuProvider } from "../src/context/mobile-menu-context";
import { api, createClient } from "../src/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createClient());

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MobileMenuProvider>{children}</MobileMenuProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}
