"use client";

import Link from "next/link";
import { useState } from "react";
import { HardDrive } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatFileSize } from "@/lib/format-file-size";
import type {
  UpdateWorkspaceSettingsInput,
  WorkspaceWithMembership,
} from "@/features/workspace/workspace.types";
import { useStorageMetrics } from "./use-storage-metrics";

const RETENTION_PRESETS = [1, 3, 7, 14, 30, 60, 90] as const;

type StorageCleanupSettingsCardProps = {
  workspace: WorkspaceWithMembership;
  onUpdateSettings: (input: UpdateWorkspaceSettingsInput) => void;
  isUpdating: boolean;
};

export function StorageCleanupSettingsCard({
  workspace,
  onUpdateSettings,
  isUpdating,
}: StorageCleanupSettingsCardProps) {
  const isPresetValue = (RETENTION_PRESETS as readonly number[]).includes(
    workspace.finalAssetRetentionDays,
  );

  const [isCustomMode, setIsCustomMode] = useState(!isPresetValue);
  const [customDaysInput, setCustomDaysInput] = useState(
    String(workspace.finalAssetRetentionDays),
  );
  const [prevRetentionDays, setPrevRetentionDays] = useState(
    workspace.finalAssetRetentionDays,
  );

  // Synchronize local input if workspace prop changes from external refetch
  if (workspace.finalAssetRetentionDays !== prevRetentionDays) {
    setPrevRetentionDays(workspace.finalAssetRetentionDays);
    const newIsPreset = (RETENTION_PRESETS as readonly number[]).includes(
      workspace.finalAssetRetentionDays,
    );
    setIsCustomMode(!newIsPreset);
    setCustomDaysInput(String(workspace.finalAssetRetentionDays));
  }

  const {
    data: metricsResponse,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useStorageMetrics(workspace.id);

  const metrics = metricsResponse?.data;

  const handleAutoCleanupToggle = (checked: boolean) => {
    onUpdateSettings({ finalAssetAutoCleanupEnabled: checked });
  };

  const handlePresetSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    if (value === "CUSTOM") {
      setIsCustomMode(true);
      setCustomDaysInput(String(workspace.finalAssetRetentionDays));
    } else {
      setIsCustomMode(false);
      const days = parseInt(value, 10);
      if (Number.isInteger(days) && days >= 1 && days <= 365) {
        onUpdateSettings({ finalAssetRetentionDays: days });
      }
    }
  };

  const handleCustomDaysSave = () => {
    const trimmed = customDaysInput.trim();
    const days = parseInt(trimmed, 10);
    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365 ||
      String(days) !== trimmed
    ) {
      toast.error("Retention period must be a whole number between 1 and 365 days.");
      return;
    }
    onUpdateSettings({ finalAssetRetentionDays: days });
  };

  const selectValue = isCustomMode
    ? "CUSTOM"
    : String(workspace.finalAssetRetentionDays);

  const isCleanupDisabled =
    !workspace.finalAssetAutoCleanupEnabled || isUpdating;

  return (
    <section className="rounded-xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/20 px-4 py-3 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">
          Storage Cleanup & Retention
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Automatically remove production ZIP files for completed listings after a retention period, or manage storage manually.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-border/50">
        {/* Toggle: Automatic Cleanup */}
        <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground">
              Automatic Final ZIP cleanup
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently remove stored production ZIP packages for completed listings after the retention period.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="w-6 text-right text-sm font-medium">
              {workspace.finalAssetAutoCleanupEnabled ? "On" : "Off"}
            </span>
            <Switch
              checked={workspace.finalAssetAutoCleanupEnabled}
              disabled={isUpdating}
              onCheckedChange={handleAutoCleanupToggle}
              aria-label="Automatic final asset cleanup"
            />
          </div>
        </div>

        {/* Setting: Retention Period */}
        <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground">
              Retention period
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              How long to keep production ZIP packages after an item is listed. Automatic cleanup runs daily at 3:00 AM BDT.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 self-start sm:items-end sm:self-auto">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Retention period preset"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCleanupDisabled}
                onChange={handlePresetSelectChange}
                value={selectValue}
              >
                {RETENTION_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset} {preset === 1 ? "day" : "days"}{preset === 30 ? " (default)" : ""}
                  </option>
                ))}
                <option value="CUSTOM">Custom...</option>
              </select>

              {isCustomMode && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    className="h-9 w-20 px-2 text-center text-sm"
                    disabled={isCleanupDisabled}
                    value={customDaysInput}
                    onChange={(e) => setCustomDaysInput(e.target.value)}
                    aria-label="Custom retention days"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomDaysSave();
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-9 px-3 text-xs"
                    disabled={
                      isCleanupDisabled ||
                      customDaysInput.trim() ===
                        String(workspace.finalAssetRetentionDays)
                    }
                    onClick={handleCustomDaysSave}
                    type="button"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
            {!workspace.finalAssetAutoCleanupEnabled && (
              <span className="text-xs text-muted-foreground/80">
                Retention applies when automatic cleanup is turned on.
              </span>
            )}
          </div>
        </div>

        {/* Managed Final ZIP Storage Overview */}
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Managed Final ZIP Storage
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Current storage footprint for production ZIP files in this workspace.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href={`/w/${workspace.id}/settings/storage`} />}
              variant="outline"
              size="xs"
              className="h-8 gap-1.5 self-start px-3 sm:self-auto"
            >
              <HardDrive className="size-3.5" />
              <span>Manage Stored Files</span>
            </Button>
          </div>

          {/* Metrics 3-Stat Grid */}
          {isMetricsLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : isMetricsError ? (
            <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
              Storage metrics temporarily unavailable.
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <p className="text-xs font-medium text-muted-foreground">
                  Active Packages
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {metrics.active.count}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({formatFileSize(metrics.active.bytes)})
                  </span>
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <p className="text-xs font-medium text-muted-foreground">
                  Reclaimable Listed ZIPs
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {metrics.reclaimable.count}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({formatFileSize(metrics.reclaimable.bytes)})
                  </span>
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <p className="text-xs font-medium text-muted-foreground">
                  Cleaned Up to Date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {metrics.cleaned.count}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({formatFileSize(metrics.cleaned.bytes)})
                  </span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
