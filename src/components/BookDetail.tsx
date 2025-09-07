import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Calendar, User, BookOpen, ExternalLink, X, Plus, Check, Trash2 } from "lucide-react";
import SmartCoverImage from "@/components/SmartCoverImage";
import { useUserBooks } from "@/hooks/useUserBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

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

interface BookDetailProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
}

export default function BookDetail({ book, open, onClose }: BookDetailProps) {
  const { addBook, removeBook, isBookInCollection, books } = useUserBooks()
  const { user } = useAuth()
  const [addingBook, setAddingBook] = useState(false)
  const [removingBook, setRemovingBook] = useState(false)

  if (!book) return null

  const handleAddToCollection = async (status: 'reading' | 'completed' | 'wishlist') => {
    setAddingBook(true)
    const result = await addBook({
      google_books_id: book.id,
      title: book.title,
      author: book.authors?.join(', ') || 'Unknown Author',
      cover_url: book.coverUrls?.[0] || book.cover,
      description: book.description,
      genre: book.categories?.[0],
      status: status
    })
    setAddingBook(false)

    // Trigger a custom event to notify other components
    if (result) {
      window.dispatchEvent(new CustomEvent('bookCollectionUpdated'))
    }
  }

  const handleRemoveFromCollection = async () => {
    const userBook = books.find(b => b.google_books_id === book.id)
    if (!userBook) return

    setRemovingBook(true)
    await removeBook(userBook.id)
    setRemovingBook(false)

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('bookCollectionUpdated'))
  }

  const isInCollection = user && isBookInCollection(book.id)

  const formatDate = (date?: string | number | null) => {
    if (!date) return "Unknown";
    if (typeof date === 'number') return String(date);
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {}
    return String(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{book.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Book details for {book.title} by {book.authors?.join(', ')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Book Cover */}
          <div className="md:col-span-2">
            <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-medium">
              <SmartCoverImage
                coverUrls={book.coverUrls}
                fallbackCover={book.cover}
                title={book.title}
                authors={book.authors}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Book Details */}
          <div className="md:col-span-3 space-y-6">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-primary mb-2">
                {book.title}
              </h1>

              {book.authors && book.authors.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    {book.authors.join(", ")}
                  </p>
                </div>
              )}

              {/* Rating */}
              {book.averageRating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-semibold">{book.averageRating.toFixed(1)}</span>
                  </div>
                  {book.ratingsCount && (
                    <span className="text-sm text-muted-foreground">
                      ({book.ratingsCount.toLocaleString()} ratings)
                    </span>
                  )}
                </div>
              )}

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.categories.slice(0, 3).map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Book Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {book.publishedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Published:</span>
                  <span>{formatDate(book.publishedDate)}</span>
                </div>
              )}

              {book.pageCount && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pages:</span>
                  <span>{book.pageCount}</span>
                </div>
              )}

              {book.publisher && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Publisher:</span>
                  <span className="ml-2">{book.publisher}</span>
                </div>
              )}

              {book.language && (
                <div>
                  <span className="text-muted-foreground">Language:</span>
                  <span className="ml-2 capitalize">{book.language}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {book.description && (
              <div>
                <h3 className="font-playfair text-xl font-semibold mb-3">Description</h3>
                <div
                  className="text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: book.description.replace(/<\/?[^>]+(>|$)/g, "")
                  }}
                />
              </div>
            )}

            {/* Collection Actions */}
            {user && (
              <div className="space-y-3">
                {!isInCollection ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleAddToCollection('reading')}
                      disabled={addingBook}
                      className="gap-2 h-11 text-xs font-medium hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white border-blue-200 hover:border-blue-500 transition-all duration-300"
                      variant="outline"
                    >
                      <BookOpen className="w-4 h-4" />
                      Reading List
                    </Button>
                    <Button
                      onClick={() => handleAddToCollection('wishlist')}
                      disabled={addingBook}
                      className="gap-2 h-11 text-xs font-medium hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white border-blue-200 hover:border-blue-500 transition-all duration-300"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                      Wishlist
                    </Button>
                    <Button
                      onClick={() => handleAddToCollection('completed')}
                      disabled={addingBook}
                      className="gap-2 h-11 text-xs font-medium hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white border-blue-200 hover:border-blue-500 transition-all duration-300"
                      variant="outline"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Read
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button disabled className="w-full gap-2 h-11 text-sm" variant="outline">
                      <Check className="w-4 h-4" />
                      In Your Collection
                    </Button>
                    <Button
                      onClick={handleRemoveFromCollection}
                      disabled={removingBook}
                      className="w-full gap-2 h-10 text-sm hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300"
                      variant="destructive"
                    >
                      {removingBook ? 'Removing...' : 'Remove from Collection'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {book.infoLink && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(book.infoLink, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              )}

              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  const searchQuery = `${book.title} ${book.authors?.join(' ')} buy book`;
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
                }}
              >
                Find to Buy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
