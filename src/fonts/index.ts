import localFont from "next/font/local";

export const stapelText = localFont({
  src: "./Stapel_Text-Regular.ttf",
  variable: "--font-stapel-text",
  display: "swap",
  weight: "400",
  style: "normal",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const stapelMedium = localFont({
  src: "./Stapel_Medium.ttf",
  variable: "--font-stapel-medium",
  display: "swap",
  weight: "500",
  style: "normal",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const stapelExpanded = localFont({
  src: "./Stapel_Expanded-Bold.ttf",
  variable: "--font-stapel-expanded",
  display: "swap",
  weight: "700",
  style: "normal",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const stapelDisplay = localFont({
  src: "./Stapel_Semi-Expanded-Extra-Bold.ttf",
  variable: "--font-stapel-display",
  display: "swap",
  weight: "800",
  style: "normal",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const stapelFontVariables = `${stapelText.variable} ${stapelMedium.variable} ${stapelExpanded.variable} ${stapelDisplay.variable}`;
