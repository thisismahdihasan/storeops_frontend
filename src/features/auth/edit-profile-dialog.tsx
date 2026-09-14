"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { UserAvatar } from "@/components/ui/user-avatar";

import type { CurrentUser } from "./auth.types";
import { useUpdateProfile } from "./use-update-profile";

const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

export type EditProfileDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: CurrentUser;
};

type EditProfileFormProps = {
  onClose: () => void;
  user: CurrentUser;
};

function EditProfileForm({ onClose, user }: EditProfileFormProps) {
  const [name, setName] = useState(() => user.name ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentName = user.name?.trim() ?? "";
  const trimmedName = name.trim();
  const hasNameChanged = trimmedName !== currentName;
  const hasChanges = hasNameChanged || selectedAvatar !== null || removeAvatar;
  const previewImageUrl = removeAvatar
    ? null
    : previewUrl ?? user.profileImageUrl;

  const handleAvatarSelection = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      setFormError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setFormError("Photo must be 5 MB or smaller.");
      return;
    }

    setFormError(null);
    setSelectedAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
    setFormError(null);
    setFileInputKey((value) => value + 1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (trimmedName.length === 0) {
      setFormError("Full name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setFormError("Full name must be 100 characters or fewer.");
      return;
    }

    if (!hasChanges) {
      return;
    }

    const formData = new FormData();

    if (hasNameChanged) {
      formData.append("name", trimmedName);
    }

    if (selectedAvatar) {
      formData.append("avatar", selectedAvatar);
    } else if (removeAvatar) {
      formData.append("removeAvatar", "true");
    }

    try {
      await updateProfileMutation.mutateAsync(formData);
      toast.success("Profile updated");
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again.",
      );
    }
  };

  return (
    <form className="min-w-0 space-y-5" onSubmit={handleSubmit}>
      <DialogHeader className="gap-2 pr-8">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-brand-accent" />
          <DialogTitle className="font-heading text-xl font-medium tracking-tight text-foreground">
            Edit profile
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Update your name and profile photo.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-w-0 flex-col items-center gap-4 rounded-xl border border-border bg-muted/20 p-4 text-center sm:flex-row sm:text-left">
        <UserAvatar
          className="ring-4 ring-background shadow-md"
          email={user.email}
          name={trimmedName || user.name}
          profileImageUrl={previewImageUrl}
          size="xl"
        />
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Input
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="peer sr-only"
              disabled={updateProfileMutation.isPending}
              id="profile-avatar"
              key={fileInputKey}
              onChange={(event) =>
                handleAvatarSelection(event.currentTarget.files?.[0])
              }
              type="file"
            />
            <Label
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 font-ui text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/85 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
              htmlFor="profile-avatar"
            >
              <Upload className="mr-1.5 size-4" />
              {user.profileImageUrl || selectedAvatar ? "Change photo" : "Upload photo"}
            </Label>
            {user.profileImageUrl && !removeAvatar && !selectedAvatar ? (
              <Button
                className="h-8 px-2 text-xs text-muted-foreground hover:text-brand-accent"
                onClick={handleRemoveAvatar}
                size="sm"
                type="button"
                variant="outline"
              >
                Remove photo
              </Button>
            ) : null}
          </div>
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            JPEG, PNG, or WebP · Max 5 MB
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          aria-describedby={formError ? "profile-form-error" : undefined}
          autoComplete="name"
          disabled={updateProfileMutation.isPending}
          id="profile-name"
          maxLength={100}
          onChange={(event) => setName(event.currentTarget.value)}
          required
          value={name}
          className="h-10 rounded-lg border-border bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          className="h-10 rounded-lg border-border bg-muted/50 text-muted-foreground disabled:cursor-default disabled:opacity-100"
          disabled
          id="profile-email"
          type="email"
          value={user.email}
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>

      {formError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          id="profile-form-error"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <DialogFooter className="-mx-4 -mb-4 mt-6 gap-2 border-border/80 bg-transparent px-4 pt-4 pb-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:pb-6">
        <Button
          className="w-full sm:w-auto"
          disabled={updateProfileMutation.isPending}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="w-full sm:w-auto"
          disabled={
            !hasChanges || updateProfileMutation.isPending || trimmedName.length === 0
          }
          type="submit"
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProfileDialog({
  onOpenChange,
  open,
  user,
}: EditProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          className="max-h-[min(90vh,720px)] min-w-0 w-[calc(100vw-24px)] max-w-[460px] overflow-x-hidden overflow-y-auto rounded-2xl border border-primary/15 bg-card p-4 shadow-2xl dark:border-primary/35 sm:max-w-[460px] sm:p-6"
          overlayClassName="bg-black/35 supports-backdrop-filter:backdrop-blur-sm dark:bg-black/55"
        >
          <EditProfileForm onClose={() => onOpenChange(false)} user={user} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
