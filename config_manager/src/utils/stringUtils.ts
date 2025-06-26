// Utility functions for string manipulation

export function capitalizeWords(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

