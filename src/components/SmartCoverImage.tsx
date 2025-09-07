import { useState, useCallback } from "react";

interface SmartCoverImageProps {
  coverUrls?: string[] | null;
  fallbackCover?: string | null;
  title: string;
  authors?: string[];
  alt: string;
  className?: string;
  onError?: () => void;
}

export default function SmartCoverImage({
  coverUrls,
  fallbackCover,
  title,
  authors,
  alt,
  className = "",
  onError
}: SmartCoverImageProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Get all available URLs in order of preference
  const allUrls = [
    ...(coverUrls || []),
    ...(fallbackCover ? [fallbackCover] : [])
  ].filter(Boolean);

  const handleImageError = useCallback(() => {
    const nextIndex = currentUrlIndex + 1;

    if (nextIndex < allUrls.length) {
      // Try next URL
      setCurrentUrlIndex(nextIndex);
    } else {
      // All URLs failed, show custom fallback
      setHasError(true);
      onError?.();
    }
  }, [currentUrlIndex, allUrls.length, onError]);

  // Generate initials from title and authors for fallback
  const generateInitials = () => {
    const titleWords = title.trim().split(' ');
    const titleInitial = titleWords[0]?.charAt(0).toUpperCase() || '';
    const secondTitleInitial = titleWords[1]?.charAt(0).toUpperCase() || '';

    const authorInitial = authors && authors.length > 0
      ? authors[0].split(' ').map(name => name.charAt(0)).join('').slice(0, 1).toUpperCase()
      : '';

    // Prefer title initials, fall back to author initial
    const initials = titleInitial + (secondTitleInitial || authorInitial);
    return initials.slice(0, 2) || '📚';
  };

  // Truncate title for display
  const truncatedTitle = title.length > 15 ? title.slice(0, 12) + '...' : title;  // If no URLs available or all failed, show custom fallback
  if (!allUrls.length || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-muted to-primary/10 ${className}`}>
        <div className="text-muted-foreground text-center p-4">
          <div className="text-4xl mb-2 font-bold text-primary/70">
            {generateInitials()}
          </div>
          <p className="text-sm font-medium">No Cover</p>
          <p className="text-xs opacity-70 mt-1">{truncatedTitle}</p>
        </div>
      </div>
    );
  }

  const currentUrl = allUrls[currentUrlIndex];

  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleImageError}
      onLoad={() => {
        // Reset error state if image loads successfully
        if (hasError) setHasError(false);
      }}
    />
  );
}
