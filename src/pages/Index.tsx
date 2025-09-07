import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import BookCard from "@/components/BookCard";
import BookDetail from "@/components/BookDetail";
import { FilterSidebar } from "@/components/FilterSidebar";
import { UserProfile } from "@/components/UserProfile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookRecommendations } from "@/components/BookRecommendations";
import { BookChatbot } from "@/components/BookChatbot";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { ChatButton } from "@/components/ChatButton";
import { useBookSearch } from "@/hooks/useBookSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Library, Sparkles, TrendingUp, BookOpen, Computer, Briefcase, Star, SortAsc, LogIn } from "lucide-react";

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

const Index = () => {
  const { books, isLoading, error, totalResults, searchBooks, loadMore } = useBookSearch();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    categories: [],
    yearRange: [1900, new Date().getFullYear()] as [number, number],
    minRating: 0,
    pageRange: [0, 1000] as [number, number]
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'rating'>('relevance');

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    await searchBooks(query);
  };

  const handleLoadMore = () => {
    if (currentQuery) {
      loadMore(currentQuery);
    }
  };

  const featuredCategories = [
    { name: "Fiction", icon: BookOpen, query: "fiction bestsellers" },
    { name: "Technology", icon: Computer, query: "technology programming" },
    { name: "Business", icon: Briefcase, query: "business strategy" },
    { name: "Self Help", icon: Star, query: "self improvement" },
  ];

  const activeFiltersCount = filters.categories.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear() ? 1 : 0) +
    (filters.pageRange[0] > 0 || filters.pageRange[1] < 1000 ? 1 : 0);

  const filteredBooks = books.filter(book => {
    // Apply filters here - in real app this would be done server-side
    if (filters.minRating > 0 && (book.averageRating || 0) < filters.minRating) return false;
    if (filters.categories.length > 0 && !book.categories?.some(cat =>
      filters.categories.some(filterCat => cat.toLowerCase().includes(filterCat))
    )) return false;

    const publishYear = book.publishedDate ? new Date(book.publishedDate).getFullYear() : 0;
    if (publishYear && (publishYear < filters.yearRange[0] || publishYear > filters.yearRange[1])) return false;

    if (book.pageCount && (book.pageCount < filters.pageRange[0] || book.pageCount > filters.pageRange[1])) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-playfair">
            <Library className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold tracking-tight">BookFinder</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <UserProfile />
            ) : (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/auth">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="container py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-card/60 backdrop-blur px-5 py-2 text-xs font-medium text-foreground/70 ring-1 ring-border/60 shadow-soft">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Tailored discovery for curious readers
            </span>
            <h1 className="font-playfair text-4xl md:text-6xl font-semibold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Find & Curate Your Next Great Read
            </h1>
            <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
              Intelligent search across global catalogs with elegant browsing & thoughtful context to help you decide faster.
            </p>
            <div className="w-full max-w-xl">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      {!books.length && !isLoading && (
  <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl font-bold text-primary mb-4">
              Explore Popular Categories
            </h2>
            <p className="text-muted-foreground text-lg">
              Start your journey with these curated selections
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {featuredCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={index}
                  variant="search"
                  className="h-24 flex-col gap-2 rounded-xl"
                  onClick={() => handleSearch(category.query)}
                >
                  <IconComponent className="w-6 h-6" />
                  <span className="font-medium">{category.name}</span>
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {/* Search Results */}
      {books.length > 0 && (
  <section className="py-16 container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-playfair text-3xl font-bold text-primary mb-2">
                Search Results
              </h2>
              <p className="text-muted-foreground">
                Found {totalResults.toLocaleString()} books matching "{currentQuery}"
                {filteredBooks.length !== books.length && (
                  <span> • Showing {filteredBooks.length} filtered results</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                activeFiltersCount={activeFiltersCount}
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                <SortAsc className="w-4 h-4" />
                <span className="text-sm">Sorted by {sortBy}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={setSelectedBook}
              />
            ))}
          </div>

          {/* Load More */}
          {filteredBooks.length < totalResults && (
            <div className="text-center mt-12">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="px-8"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Load More Books
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Error State */}
      {error && (
  <section className="py-16 container">
          <div className="text-center max-w-md mx-auto">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-playfair text-xl font-semibold text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      {!books.length && !isLoading && !error && (
  <section className="py-16 container">
          <BookRecommendations onBookSelect={setSelectedBook} />
        </section>
      )}

      {/* Book Detail Modal */}
      <BookDetail
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />

      {/* Chat Components */}
      <WelcomeDialog onOpenChat={() => setIsChatOpen(true)} />
      <BookChatbot
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        onBookSelect={setSelectedBook}
      />
      {!isChatOpen && <ChatButton onClick={() => setIsChatOpen(true)} />}

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/70 backdrop-blur py-12">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Library className="w-6 h-6 text-primary" />
            <span className="font-playfair text-xl font-bold text-primary">
              BookFinder
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Powered by Open Library. Crafted for focused, delightful reading exploration.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
