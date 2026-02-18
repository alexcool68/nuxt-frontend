import type { Step, File } from "~/types/compta";

/**
 * Returns a color name based on the file's direction.
 * 'primary' for 'IN', 'secondary' for 'OUT'.
 */
export function getFileColor(file: File): "primary" | "secondary" {
  return file.direction === "IN" ? "primary" : "secondary";
}

/**
 * Returns a counter based on the StepFile's direction.
 * file.direction 'IN' and 'OUT'
 */
export function getTotalFilestepByDirection(
  step: Step,
  direction: "IN" | "OUT",
): number {
  return step.files?.filter((f) => f.direction === direction).length || 0;
}
