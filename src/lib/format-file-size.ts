export function formatFileSize(fileSize: string): string {
  if (!/^\d+$/.test(fileSize)) return "Unknown size";

  let value = fileSize.replace(/^0+(?=\d)/, "");
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;

  while (isAtLeast(value, 1024) && unitIndex < units.length - 1) {
    value = divideDecimalString(value, 1024);
    unitIndex += 1;
  }

  return `${value} ${units[unitIndex]}`;
}

function isAtLeast(value: string, minimum: number): boolean {
  const minimumText = minimum.toString();
  return (
    value.length > minimumText.length ||
    (value.length === minimumText.length && value >= minimumText)
  );
}

function divideDecimalString(value: string, divisor: number): string {
  let remainder = 0;
  let quotient = "";

  for (const digit of value) {
    const next = remainder * 10 + Number(digit);
    quotient += Math.floor(next / divisor).toString();
    remainder = next % divisor;
  }

  return quotient.replace(/^0+(?=\d)/, "");
}
