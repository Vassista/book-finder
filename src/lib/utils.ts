import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate Open Library cover URLs with fallback strategy
 * Strategy:
 * 1. Try ISBN cover first (highest quality)
 * 2. If ISBN not available → try Work OLID
 * 3. If both fail → return null for custom fallback
 */
export function generateCoverUrls(doc: any) {
  const isbn = Array.isArray(doc.isbn) && doc.isbn.length ? doc.isbn[0] : null;
  const olid = doc.key ? doc.key.replace('/works/', '').replace('/books/', '') : null;

  const urls: string[] = [];

  // Strategy 1: ISBN cover (highest quality when available)
  if (isbn) {
    urls.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  }

  // Strategy 2: Cover ID (if available) - often higher quality than OLID
  if (doc.cover_i) {
    urls.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`);
  }

  // Strategy 3: Work OLID cover
  if (olid && olid !== isbn) {
    urls.push(`https://covers.openlibrary.org/b/olid/${olid}-L.jpg?default=false`);
  }

  // Strategy 4: Try edition key if available
  if (doc.edition_key && Array.isArray(doc.edition_key) && doc.edition_key.length > 0) {
    urls.push(`https://covers.openlibrary.org/b/olid/${doc.edition_key[0]}-L.jpg?default=false`);
  }

  return urls.length > 0 ? urls : null;
}
