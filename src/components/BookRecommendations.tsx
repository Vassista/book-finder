import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Clock, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BookCard from "@/components/BookCard"
import { generateCoverUrls } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

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
}

interface BookRecommendationsProps {
  currentBook?: Book | null;
  userHistory?: string[];
  onBookSelect: (book: Book) => void;
}

interface UserBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  status: 'reading' | 'completed' | 'wishlist';
  rating: number | null;
}

export function BookRecommendations({ currentBook, userHistory = [], onBookSelect }: BookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'similar' | 'trending' | 'recent'>('similar');
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const { user } = useAuth();

  // Fetch user's reading history
  const fetchUserBooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, genre, status, rating')
        .eq('user_id', user.id)
        .in('status', ['completed', 'reading']) // Focus on books they've engaged with
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user books:', error);
        return;
      }

      setUserBooks((data || []) as UserBook[]);
    } catch (err) {
      console.error('Failed to fetch user books:', err);
    }
  };

  // Get user's preferred genres based on their reading history
  const getUserPreferredGenres = (): string[] => {
    const genreCount: { [key: string]: number } = {};

    userBooks.forEach(book => {
      if (book.genre) {
        genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
        // Give higher weight to completed books with good ratings
        if (book.status === 'completed' && book.rating && book.rating >= 4) {
          genreCount[book.genre] += 2;
        }
      }
    });

    // Return top 3 genres sorted by preference
    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);
  };

  // Get authors user has enjoyed
  const getUserPreferredAuthors = (): string[] => {
    const authorBooks = userBooks.filter(book =>
      book.status === 'completed' && book.rating && book.rating >= 4
    );

    return [...new Set(authorBooks.map(book => book.author))].slice(0, 5);
  };

  const fetchRecommendations = async (type: string, query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      const urls: { url: string; reason: string }[] = [];

      if (type === 'similar') {
        // Prioritize user's reading preferences
        const preferredGenres = getUserPreferredGenres();
        const preferredAuthors = getUserPreferredAuthors();

        // If user has reading history, use their preferences
        if (userBooks.length > 0) {
          // Search by user's favorite genres
          for (const genre of preferredGenres) {
            urls.push({
              url: `https://openlibrary.org/search.json?subject=${encodeURIComponent(genre)}&sort=rating&limit=24&first_publish_year:[2015 TO ${currentYear}]`,
              reason: `user favorite genre: ${genre}`
            });
          }

          // Search by authors user has enjoyed
          for (const author of preferredAuthors.slice(0, 2)) {
            urls.push({
              url: `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=12`,
              reason: `user liked author: ${author}`
            });
          }

          // Search for books similar to user's highly rated books
          const topRatedBooks = userBooks
            .filter(book => book.rating && book.rating >= 4)
            .slice(0, 3);

          for (const book of topRatedBooks) {
            if (book.genre) {
              urls.push({
                url: `https://openlibrary.org/search.json?subject=${encodeURIComponent(book.genre)}&sort=new&limit=12`,
                reason: `similar to highly rated: ${book.title}`
              });
            }
          }
        } else {
          // Fallback to current book or generic recommendations
          const subject = currentBook?.categories?.[0];
          if (subject) {
            urls.push({ url: `https://openlibrary.org/search.json?subject=${encodeURIComponent(subject)}&limit=24`, reason: 'subject match' });
          }
        }

        // Always include some trending fallbacks
        urls.push({ url: `https://openlibrary.org/search.json?q=bestseller&sort=rating&limit=24`, reason: 'bestseller fallback' });
        urls.push({ url: `https://openlibrary.org/search.json?subject=fiction&sort=new&limit=24`, reason: 'recent fiction fallback' });
      } else if (type === 'trending') {
        // Multiple heuristics for popularity. Avoid q=* which can 500.
        urls.push({ url: `https://openlibrary.org/search.json?subject=bestsellers&limit=24`, reason: 'bestsellers subject' });
        urls.push({ url: `https://openlibrary.org/search.json?q=bestseller&limit=24`, reason: 'bestseller keyword' });
        urls.push({ url: `https://openlibrary.org/search.json?q=popular+books&limit=24`, reason: 'popular books keyword' });
        urls.push({ url: `https://openlibrary.org/search.json?subject=award_winners&limit=24`, reason: 'award winners subject' });
      } else if (type === 'recent') {
        // Year-specific + new release keywords
        urls.push({ url: `https://openlibrary.org/search.json?published_in=${currentYear}&limit=24`, reason: 'current year published' });
        urls.push({ url: `https://openlibrary.org/search.json?q=${currentYear}+books&limit=24`, reason: 'year keyword' });
        urls.push({ url: `https://openlibrary.org/search.json?title=new&limit=24`, reason: 'title new' });
        urls.push({ url: `https://openlibrary.org/search.json?q=new+release&limit=24`, reason: 'new release keyword' });
      } else {
        const q = query || 'fiction';
        urls.push({ url: `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24`, reason: 'default search' });
      }

      let docs: any[] = [];
      let lastStatus: number | null = null;
      for (const candidate of urls) {
        try {
          const res = await fetch(candidate.url);
          lastStatus = res.status;
            if (!res.ok) continue; // try next
          const data = await res.json();
          if (Array.isArray(data.docs) && data.docs.length) {
            docs = data.docs;
            break;
          }
        } catch (innerErr) {
          // proceed to next candidate silently
          continue;
        }
      }

      if (!docs.length) {
        setRecommendations([]);
        setError(lastStatus ? `No data (last status: ${lastStatus})` : 'No recommendations available');
        return;
      }

      const processedBooks: Book[] = docs.slice(0, 24).map((doc: any) => {
        const isbn = Array.isArray(doc.isbn) && doc.isbn.length ? doc.isbn[0] : null;
        const coverUrls = generateCoverUrls(doc);
        const primaryCover = coverUrls && coverUrls.length > 0 ? coverUrls[0] : null;
        return {
          id: doc.key || `${doc.title}-${doc.cover_i ?? isbn ?? ''}`,
          title: doc.title || 'Unknown Title',
          authors: Array.isArray(doc.author_name) ? doc.author_name : [],
          description: doc.subtitle || undefined,
          cover: primaryCover,
          coverUrls,
          publishedDate: doc.first_publish_year ?? null,
          categories: Array.isArray(doc.subject) ? doc.subject : undefined,
          averageRating: undefined,
          ratingsCount: undefined,
          pageCount: doc.number_of_pages_median ?? null,
          infoLink: doc.key ? `https://openlibrary.org${doc.key}` : null,
          publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
          language: Array.isArray(doc.language) ? doc.language[0] : undefined,
        };
      });

      // Filter out books the user already has in their library
      const userBookTitles = new Set(
        userBooks.map(book => book.title.toLowerCase().trim())
      );

      const filteredBooks = processedBooks.filter(book =>
        !userBookTitles.has(book.title.toLowerCase().trim())
      );

      setRecommendations(filteredBooks);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Unable to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user books when component mounts or user changes
    if (user) {
      fetchUserBooks();
    }
  }, [user]);

  useEffect(() => {
    // whenever tab or current book changes, reset view state then fetch
    setShowAll(false);
    fetchRecommendations(activeTab);
  }, [activeTab, currentBook, userBooks]); // Add userBooks as dependency

  const tabs = [
    {
      id: 'similar',
      label: 'For You',
      icon: Sparkles,
      description: userBooks.length > 0 ? 'Based on your reading history' : 'Based on current selection'
    },
    { id: 'trending', label: 'Trending', icon: TrendingUp, description: 'Popular right now' },
    { id: 'recent', label: 'New Releases', icon: Clock, description: 'Latest publications' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Recommendations
        </CardTitle>
        <CardDescription>
          {userBooks.length > 0
            ? `Personalized recommendations based on your ${userBooks.length} books`
            : 'Discover your next great read'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-shrink-0 gap-2"
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Active Tab Description */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </Badge>
        </div>

        {/* Recommendations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: showAll ? 8 : 4 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg aspect-[3/4] mb-2" />
                <div className="bg-muted rounded h-4 mb-1" />
                <div className="bg-muted rounded h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          error ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {error}
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => fetchRecommendations(activeTab)}>Retry</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(showAll ? recommendations : recommendations.slice(0, 4)).map((book) => (
                <div key={book.id} className="cursor-pointer transition-transform hover:scale-[1.02]">
                  <BookCard book={book} onClick={onBookSelect} />
                </div>
              ))}
            </div>
          )
        )}

        {recommendations.length > 4 && (
          <div className="text-center mt-6">
            <Button
              variant={showAll ? "subtle" : "outline"}
              size="sm"
              onClick={() => setShowAll(s => !s)}
              aria-expanded={showAll}
              className="min-w-[14rem]"
            >
              {showAll ? 'Show Fewer Recommendations' : 'View All Recommendations'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
