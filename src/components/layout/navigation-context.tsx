"use client";

import { createContext, useContext } from "react";

import type { NavigationMode } from "./navigation.config";

type NavigationContextValue = {
  mode: NavigationMode;
};

type NavigationContextProviderProps = NavigationContextValue & {
  children: React.ReactNode;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationContextProvider({
  children,
  mode,
}: NavigationContextProviderProps) {
  return (
    <NavigationContext.Provider value={{ mode }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigationContext must be used within AppShell.");
  }

  return context;
}
