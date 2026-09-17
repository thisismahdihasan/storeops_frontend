"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { GlobalUploadIndicator } from "@/components/layout/global-upload-indicator";

type ProvidersProps = {
  children: ReactNode;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <GlobalUploadIndicator />
        <Toaster closeButton position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
