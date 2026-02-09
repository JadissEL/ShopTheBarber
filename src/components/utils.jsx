import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const createPageUrl = (pageName) => {
  if (!pageName) return '/';
  // Ensure we don't double slash if pageName starts with /
  const path = pageName.startsWith('/') ? pageName : `/${pageName}`;
  return path;
};