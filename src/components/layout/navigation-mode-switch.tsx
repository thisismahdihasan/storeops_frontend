"use client";

import { cn } from "cn";

import type { NavigationMode } from "./navigation.config";

type NavigationModeSwitchProps = {
  mode: NavigationMode;
  onModeChange: (mode: NavigationMode) => void;
};

const modes: Array<{ label: string; value: NavigationMode }> = [
  { label: "Management", value: "management" },
  { label: "My Work", value: "work" },
];

export function NavigationModeSwitch({
  mode,
  onModeChange,
}: NavigationModeSwitchProps) {
  return (
    <div
      aria-label="Navigation context"
      className="grid grid-cols-2 rounded-lg border border-border bg-muted/40 p-1"
      role="group"
    >
      {modes.map((item) => {
        const isSelected = item.value === mode;

        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            key={item.value}
            onClick={() => onModeChange(item.value)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
