"use client";

import { CalendarClock, CheckCircle2, Clock, Loader2, PauseCircle, PowerOff } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

import {
  formatPausedUntil,
  formatPausedUntilFull,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
  toDateTimeLocalString,
  type AssignmentAvailabilityState,
} from "./assignment-availability";
import type {
  AssignmentAvailabilityRole,
  TeamMember,
  UpdateMemberAssignmentAvailabilityInput,
} from "./team.types";

const STATUS_LABELS: Record<AssignmentAvailabilityState, string> = {
  AVAILABLE: "Available",
  OFF: "Off",
  PAUSED: "Paused",
};

const STATUS_TONES: Record<AssignmentAvailabilityState, StatusBadgeTone> = {
  AVAILABLE: "success",
  OFF: "danger",
  PAUSED: "warning",
};

const PAUSE_PRESETS = [
  { durationMs: 60 * 60 * 1_000, id: "1h", label: "1h", title: "1 hour" },
  { durationMs: 4 * 60 * 60 * 1_000, id: "4h", label: "4h", title: "4 hours" },
  { durationMs: 24 * 60 * 60 * 1_000, id: "1d", label: "1d", title: "1 day" },
  { durationMs: 3 * 24 * 60 * 60 * 1_000, id: "3d", label: "3d", title: "3 days" },
  { durationMs: 7 * 24 * 60 * 60 * 1_000, id: "1w", label: "1w", title: "1 week" },
] as const;

type PresetId = (typeof PAUSE_PRESETS)[number]["id"];

type AssignmentAvailabilityDialogProps = {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpdateMemberAssignmentAvailabilityInput) => Promise<void>;
  open: boolean;
  submitting: boolean;
};

type RoleAvailabilityFormProps = {
  member: TeamMember;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpdateMemberAssignmentAvailabilityInput) => Promise<void>;
  role: AssignmentAvailabilityRole;
  submitting: boolean;
};

function formatDurationFromNow(targetDate: Date, currentNow: number): string {
  const diffMs = targetDate.getTime() - currentNow;
  if (diffMs <= 0) return "momentarily";
  const diffMinutes = Math.round(diffMs / (60 * 1_000));
  if (diffMinutes < 60) return `in ${diffMinutes}m`;
  const diffHours = Math.round(diffMs / (60 * 60 * 1_000));
  if (diffHours < 24) return `in ${diffHours}h`;
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1_000));
  return `in ${diffDays}d`;
}

function RoleAvailabilityForm({
  member,
  onOpenChange,
  onSubmit,
  role,
  submitting,
}: RoleAvailabilityFormProps) {
  const [now] = useState(() => Date.now());

  const savedMode = getAssignmentAvailabilityState(member, role, now);
  const savedPausedUntil = getAssignmentPausedUntil(member, role);

  const [mode, setMode] = useState<AssignmentAvailabilityState>(savedMode);
  const [pausedUntil, setPausedUntil] = useState<string | null>(savedPausedUntil);
  const [customDateTime, setCustomDateTime] = useState<string>(() => {
    if (savedPausedUntil && !Number.isNaN(new Date(savedPausedUntil).getTime())) {
      return toDateTimeLocalString(new Date(savedPausedUntil));
    }
    return "";
  });
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const roleTitle = role === "DESIGNER" ? "Designer" : "Lister";

  const isDirty = useMemo(() => {
    if (mode !== savedMode) return true;
    if (mode === "PAUSED") {
      if (!pausedUntil && !savedPausedUntil) return false;
      if (!pausedUntil || !savedPausedUntil) return true;
      return new Date(pausedUntil).getTime() !== new Date(savedPausedUntil).getTime();
    }
    return false;
  }, [mode, pausedUntil, savedMode, savedPausedUntil]);

  const pauseValidation = useMemo(() => {
    if (mode !== "PAUSED") return { isValid: true, message: null };
    if (!pausedUntil) return { isValid: false, message: "Select a pause duration or end time." };
    const date = new Date(pausedUntil);
    if (Number.isNaN(date.getTime())) return { isValid: false, message: "Invalid date format." };
    if (date.getTime() <= now) return { isValid: false, message: "Pause end time must be in the future." };
    return { isValid: true, message: null };
  }, [mode, pausedUntil, now]);

  const canSubmit = isDirty && pauseValidation.isValid && !submitting;

  const handleModeSelect = (newMode: AssignmentAvailabilityState) => {
    setMode(newMode);
    setSubmissionError(null);

    if (newMode === "PAUSED") {
      if (!pausedUntil || new Date(pausedUntil).getTime() <= now) {
        const defaultDuration = 60 * 60 * 1_000;
        const targetDate = new Date(now + defaultDuration);
        setPausedUntil(targetDate.toISOString());
        setCustomDateTime(toDateTimeLocalString(targetDate));
        setActivePreset("1h");
      }
    } else {
      setPausedUntil(null);
      setCustomDateTime("");
      setActivePreset(null);
    }
  };

  const handlePresetSelect = (preset: (typeof PAUSE_PRESETS)[number]) => {
    setMode("PAUSED");
    setActivePreset(preset.id);
    const targetDate = new Date(now + preset.durationMs);
    setPausedUntil(targetDate.toISOString());
    setCustomDateTime(toDateTimeLocalString(targetDate));
    setSubmissionError(null);
  };

  const handleCustomDateTimeChange = (value: string) => {
    setCustomDateTime(value);
    setActivePreset(null);
    setSubmissionError(null);

    if (!value) {
      setPausedUntil(null);
      return;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      setPausedUntil(parsedDate.toISOString());
    } else {
      setPausedUntil(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (mode === "PAUSED" && !pauseValidation.isValid) {
      setSubmissionError(pauseValidation.message);
      return;
    }

    setSubmissionError(null);

    try {
      await onSubmit(
        mode === "PAUSED"
          ? { mode: "PAUSED", pausedUntil: pausedUntil!, role }
          : { mode, role },
      );
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Could not update assignment availability. Please try again.",
      );
    }
  };

  const minDateTimeLocal = useMemo(() => toDateTimeLocalString(new Date(now + 60_000)), [now]);
  const parsedPauseDate = pausedUntil ? new Date(pausedUntil) : null;
  const isPauseDateValid = Boolean(
    parsedPauseDate && !Number.isNaN(parsedPauseDate.getTime()) && parsedPauseDate.getTime() > now,
  );

  return (
    <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
      {/* Current Saved Status Banner */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {roleTitle} Status
          </span>
          <StatusBadge tone={STATUS_TONES[savedMode]}>
            {STATUS_LABELS[savedMode]}
          </StatusBadge>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {savedMode === "AVAILABLE" && (
            "Eligible for incoming automatic assignments based on least workload."
          )}
          {savedMode === "PAUSED" && savedPausedUntil && (
            `Currently paused until ${formatPausedUntilFull(savedPausedUntil)}. Will automatically resume after this time.`
          )}
          {savedMode === "OFF" && (
            "Excluded from automatic assignments indefinitely until manually enabled."
          )}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Set Availability
        </Label>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border/80 bg-muted/40 p-1">
          {(["AVAILABLE", "PAUSED", "OFF"] as const).map((m) => {
            const isSelected = mode === m;
            return (
              <button
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all",
                  isSelected
                    ? m === "AVAILABLE"
                      ? "border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-700 shadow-2xs dark:text-emerald-400"
                      : m === "PAUSED"
                        ? "border border-amber-500/30 bg-amber-500/15 font-semibold text-amber-800 shadow-2xs dark:text-amber-400"
                        : "border border-red-500/30 bg-red-500/15 font-semibold text-red-700 shadow-2xs dark:text-red-400"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
                disabled={submitting}
                key={m}
                onClick={() => handleModeSelect(m)}
                type="button"
              >
                {m === "AVAILABLE" && <CheckCircle2 className="size-3.5" />}
                {m === "PAUSED" && <PauseCircle className="size-3.5" />}
                {m === "OFF" && <PowerOff className="size-3.5" />}
                <span>{m === "AVAILABLE" ? "Available" : m === "PAUSED" ? "Pause" : "Off"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pause Settings (Visible only when PAUSED is selected) */}
      {mode === "PAUSED" && (
        <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 dark:bg-amber-950/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
            <Clock className="size-3.5" />
            <span>Pause Duration</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5" role="group">
            {PAUSE_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <Button
                  className={cn(
                    "h-7 min-w-10 px-2.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-amber-500/60 bg-amber-500/25 font-semibold text-amber-900 shadow-2xs dark:bg-amber-500/30 dark:text-amber-200"
                      : "text-muted-foreground hover:border-amber-500/40 hover:text-foreground",
                  )}
                  disabled={submitting}
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  size="sm"
                  title={preset.title}
                  type="button"
                  variant="outline"
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          {/* Custom Date/Time Input */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label
                className="text-xs font-medium text-foreground"
                htmlFor={`custom-pause-input-${role}`}
              >
                Custom pause end
              </Label>
              <span className="text-[11px] text-muted-foreground">Uses your local time</span>
            </div>
            <Input
              className="h-9 w-full rounded-lg border-border/80 bg-background px-3 text-xs shadow-none transition-colors focus-visible:ring-1 focus-visible:ring-primary dark:bg-background/80"
              disabled={submitting}
              id={`custom-pause-input-${role}`}
              min={minDateTimeLocal}
              onChange={(e) => handleCustomDateTimeChange(e.target.value)}
              type="datetime-local"
              value={customDateTime}
            />
          </div>

          {/* Active Resume Preview Card */}
          {isPauseDateValid && parsedPauseDate && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/25 bg-background/80 px-2.5 py-2 text-xs text-foreground">
              <CalendarClock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">
                Resumes{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  {formatPausedUntil(parsedPauseDate.toISOString())}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({formatDurationFromNow(parsedPauseDate, now)})
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Submission Error Alert */}
      {submissionError && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
          role="alert"
        >
          {submissionError}
        </div>
      )}

      {/* Dialog Action Buttons */}
      <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button
          disabled={submitting}
          onClick={() => onOpenChange(false)}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={!canSubmit} type="submit">
          {submitting && <Loader2 className="size-3.5 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AssignmentAvailabilityDialog({
  member,
  onOpenChange,
  onSubmit,
  open,
  submitting,
}: AssignmentAvailabilityDialogProps) {
  const workerRoles = useMemo(() => {
    if (!member) return [];
    return member.roles.filter(
      (role): role is AssignmentAvailabilityRole =>
        role === "DESIGNER" || role === "LISTER",
    );
  }, [member]);

  const [selectedRole, setSelectedRole] = useState<AssignmentAvailabilityRole | null>(null);

  const activeRole = useMemo(() => {
    if (selectedRole && workerRoles.includes(selectedRole)) {
      return selectedRole;
    }
    return workerRoles[0] ?? "DESIGNER";
  }, [selectedRole, workerRoles]);

  if (!member || workerRoles.length === 0) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-md overflow-y-auto p-5 sm:max-w-[480px]">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold">Assignment availability</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure automatic workload assignment for this workspace member.
          </DialogDescription>
        </DialogHeader>

        {/* Member Identity Card */}
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
          <UserAvatar email={member.email} name={member.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {member.name ?? member.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>

        {/* Role Switcher Tabs (if member has both DESIGNER and LISTER) */}
        {workerRoles.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-medium text-muted-foreground">Select role to configure</Label>
            <div className="flex rounded-lg border border-border/80 bg-muted/40 p-1">
              {workerRoles.map((role) => {
                const isSelected = activeRole === role;
                const roleState = getAssignmentAvailabilityState(member, role);
                return (
                  <button
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    type="button"
                  >
                    <span>{role === "DESIGNER" ? "Designer" : "Lister"}</span>
                    <StatusBadge
                      className="h-4 border-0 px-1 py-0 font-mono text-[9px] uppercase"
                      tone={STATUS_TONES[roleState]}
                    >
                      {STATUS_LABELS[roleState]}
                    </StatusBadge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Role Configuration Form */}
        <RoleAvailabilityForm
          key={`${member.membershipId}-${activeRole}`}
          member={member}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
          role={activeRole}
          submitting={submitting}
        />
      </DialogContent>
    </Dialog>
  );
}
