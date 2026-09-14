import Image from "next/image";
import { cn } from "cn";

export type StoreOpsLogoProps = {
  variant?: "full" | "icon";
  theme?: "auto" | "light" | "dark";
  priority?: boolean;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

const FULL_ASPECT_RATIO = 4445 / 1171; // ~3.7959
const ICON_ASPECT_RATIO = 4500 / 5400; // ~0.8333

export function StoreOpsLogo({
  variant = "full",
  theme = "auto",
  priority = false,
  className,
  width,
  height,
  alt = "StoreOps",
}: StoreOpsLogoProps) {
  let resolvedWidth: number;
  let resolvedHeight: number;

  if (variant === "full") {
    if (width && !height) {
      resolvedWidth = width;
      resolvedHeight = Math.round(width / FULL_ASPECT_RATIO);
    } else if (height && !width) {
      resolvedHeight = height;
      resolvedWidth = Math.round(height * FULL_ASPECT_RATIO);
    } else if (width && height) {
      resolvedWidth = width;
      resolvedHeight = height;
    } else {
      resolvedHeight = 32;
      resolvedWidth = Math.round(32 * FULL_ASPECT_RATIO); // 121
    }
  } else {
    if (width && !height) {
      resolvedWidth = width;
      resolvedHeight = Math.round(width / ICON_ASPECT_RATIO);
    } else if (height && !width) {
      resolvedHeight = height;
      resolvedWidth = Math.round(height * ICON_ASPECT_RATIO);
    } else if (width && height) {
      resolvedWidth = width;
      resolvedHeight = height;
    } else {
      resolvedHeight = 32;
      resolvedWidth = Math.round(32 * ICON_ASPECT_RATIO); // 27
    }
  }

  const lightSrc =
    variant === "full"
      ? "/brand/storeops-logo.png"
      : "/brand/storeops-icon-light.png";

  const darkSrc =
    variant === "full"
      ? "/brand/storeops-logo-white.png"
      : "/brand/storeops-icon-dark.png";

  if (theme === "light") {
    return (
      <span className={cn("inline-flex items-center shrink-0", className)}>
        <Image
          src={lightSrc}
          alt={alt}
          width={resolvedWidth}
          height={resolvedHeight}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </span>
    );
  }

  if (theme === "dark") {
    return (
      <span className={cn("inline-flex items-center shrink-0", className)}>
        <Image
          src={darkSrc}
          alt={alt}
          width={resolvedWidth}
          height={resolvedHeight}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center shrink-0", className)}>
      <Image
        src={lightSrc}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        priority={priority}
        className="dark:hidden h-auto w-auto object-contain"
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        priority={priority}
        className="hidden dark:block h-auto w-auto object-contain"
      />
    </span>
  );
}
