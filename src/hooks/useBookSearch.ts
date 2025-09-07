import { useState } from "react";
import { generateCoverUrls } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  cover?: string | null;
  coverUrls?: string[] | null;
  publishedDate?: string | number | null;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  pageCount?: number | null;
  infoLink?: string | null;
  publisher?: string;
  language?: string;
  raw?: any;
}

interface SearchResult {
  totalItems: number;
  items: Book[];
}

export function useBookSearch() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const searchBooks = async (query: string, startIndex: number = 0, maxResults: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = encodeURIComponent(query);
      // Open Library uses page indexing; convert startIndex -> page
      const page = Math.floor(startIndex / maxResults) + 1;
      const url = `https://openlibrary.org/search.json?title=${searchQuery}&page=${page}&limit=${maxResults}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to search Open Library: ${response.status}`);

      const data = await response.json();

      const docs = Array.isArray(data.docs) ? data.docs : [];

      const processedBooks: Book[] = docs.map((doc: any) => {
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length ? doc.isbn[0] : null;
        const edition = Array.isArray(doc.edition_key) && doc.edition_key.length ? doc.edition_key[0] : null;

        // Use the new cover strategy
        const coverUrls = generateCoverUrls(doc);
        const primaryCover = coverUrls && coverUrls.length > 0 ? coverUrls[0] : null;

        return {
          id: edition ? `/books/${edition}` : doc.key || `${doc.title}-${doc.cover_i ?? isbn ?? ''}`,
          title: doc.title || 'Unknown Title',
          authors: Array.isArray(doc.author_name) ? doc.author_name : doc.authors || [],
          description: doc.subtitle || doc.first_sentence || undefined,
          cover: primaryCover,
          coverUrls,
          publishedDate: doc.first_publish_year ?? (Array.isArray(doc.publish_year) ? doc.publish_year[0] : null),
          categories: Array.isArray(doc.subject) ? doc.subject : undefined,
          pageCount: doc.number_of_pages_median ?? null,
          infoLink: edition
            ? `https://openlibrary.org/books/${edition}`
            : isbn
            ? `https://openlibrary.org/isbn/${isbn}`
            : doc.key
            ? `https://openlibrary.org${doc.key}`
            : null,
          publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
          language: Array.isArray(doc.language) ? doc.language[0] : undefined,
          raw: doc,
        };
      });

      if (startIndex === 0) {
        setBooks(processedBooks);
      } else {
        setBooks(prev => [...prev, ...processedBooks]);
      }

      setTotalResults(typeof data.numFound === 'number' ? data.numFound : processedBooks.length);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while searching");
      if (startIndex === 0) {
        setBooks([]);
        setTotalResults(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async (query: string) => {
    if (!isLoading && books.length < totalResults) {
      await searchBooks(query, books.length);
    }
  };

  return {
    books,
    isLoading,
    error,
    totalResults,
    searchBooks,
    loadMore,
  };
}
