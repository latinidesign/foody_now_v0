import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOrderNumber(n?: number | null): string {
  return n != null ? String(n).padStart(6, "0") : "------"
}
