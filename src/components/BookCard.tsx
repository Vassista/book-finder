import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, User } from "lucide-react";
import SmartCoverImage from "@/components/SmartCoverImage";

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
}

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const formatDate = (date?: string | number | null) => {
    if (!date) return "Unknown";
    if (typeof date === 'number') return String(date);
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    } catch {}
    return String(date);
  };

  const truncateDescription = (text?: string, maxLength: number = 120) => {
    if (!text) return "No description available";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-smooth hover:shadow-medium hover:bg-card-hover transform hover:-translate-y-1"
      onClick={() => onClick(book)}
    >
      <div className="relative">
        <div className="aspect-[3/4] overflow-hidden bg-muted">
          <SmartCoverImage
            coverUrls={book.coverUrls}
            fallbackCover={book.cover}
            title={book.title}
            authors={book.authors}
            alt={book.title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
        </div>

        {book.averageRating && (
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-soft">
            <Star className="w-3 h-3 fill-secondary text-secondary" />
            <span className="text-xs font-medium">{book.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-playfair font-semibold text-lg line-clamp-2 text-primary group-hover:text-accent transition-smooth">
            {book.title}
          </h3>
          {book.authors && book.authors.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <User className="w-3 h-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground line-clamp-1">
                {book.authors.join(", ")}
              </p>
            </div>
          )}
        </div>

        {book.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {truncateDescription(book.description)}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {book.publishedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDate(book.publishedDate)}
                </span>
              </div>
            )}
            {book.pageCount && (
              <span className="text-xs text-muted-foreground">
                {book.pageCount} pages
              </span>
            )}
          </div>

          {book.categories && book.categories.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {book.categories[0]}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
