import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Bot, User, BookOpen, Loader2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useChatDatabase } from '@/hooks/useChatDatabase'
import { useIsMobile } from '@/hooks/use-mobile'
import BookCard from '@/components/BookCard'

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

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  books?: Book[]
  timestamp: Date
}

interface BookChatbotProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onBookSelect: (book: Book) => void
}

export function BookChatbot({ isOpen, setIsOpen, onBookSelect }: BookChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(0)
  // Minimize feature removed for simpler UX
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const { checkDailyUsage, updateDailyUsage, loadChatHistory, saveChatMessage, isTableMissing } = useChatDatabase()
  const isMobile = useIsMobile()

  const DAILY_LIMIT = 10 // Total chat messages allowed per day

  useEffect(() => {
    if (user && isOpen) {
      initializeChat()
    }
  }, [user, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      const usage = await checkDailyUsage()
      setDailyUsage(usage)

      const history = await loadChatHistory()
      setMessages(history)
    } catch (error) {
      console.warn('Could not load chat data:', error)
      // Fallback to defaults if database operations fail
      setDailyUsage(0)
      setMessages([])
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
  }

  // Simplified user intent analysis (Gemini handles the heavy lifting now)
  const analyzeUserIntent = (userMessage: string) => {
    const message = userMessage.toLowerCase();

    return {
      wantsRecommendations: message.includes('books like') || message.includes('similar to'),
      mentionedBooks: [], // Gemini will handle this intelligently
      isLookingForSpecificType: message.includes('productivity') || message.includes('philosophy')
    };
  };  // Use Gemini to intelligently determine if we should extract books
  const shouldExtractBooks = async (assistantResponse: string, userMessage: string): Promise<boolean> => {
    try {
      const { callGeminiAPI: geminiCall } = await import('@/lib/gemini');

      const analysisPrompt = `Analyze this conversation to determine if the assistant's response contains book recommendations or mentions specific books that should be displayed as cards.

User message: "${userMessage}"
Assistant response: "${assistantResponse}"

Respond with only "YES" if the assistant response:
- Recommends specific books
- Mentions book titles that should be shown as cards
- Discusses books in a way that would benefit from showing book cards

Respond with only "NO" if the assistant response:
- Only talks about books generally without mentioning specific titles
- Asks clarifying questions
- Discusses reading habits/preferences without specific recommendations

Response:`;

      const result = await geminiCall({
        message: analysisPrompt,
        chatHistory: []
      });

      const decision = result.response.trim().toUpperCase();
      console.log('Gemini book extraction decision:', decision);
      return decision === 'YES';
    } catch (error) {
      console.error('Error in Gemini book analysis:', error);
      // Fallback to basic text analysis if Gemini fails
      return assistantResponse.toLowerCase().includes('recommend') ||
             assistantResponse.includes('**"') ||
             userMessage.toLowerCase().includes('books like');
    }
  };

  // Use Gemini to intelligently extract book titles and authors
  const extractBooksWithGemini = async (assistantResponse: string, userMessage: string): Promise<string[]> => {
    try {
      const { callGeminiAPI: geminiCall } = await import('@/lib/gemini');

      const extractionPrompt = `Extract book titles and authors from this conversation. Focus on specific book recommendations or mentions.

User message: "${userMessage}"
Assistant response: "${assistantResponse}"

Return ONLY a JSON array of strings in the format "Title Author" for each book mentioned.
If the user asked for books SIMILAR to a mentioned book, include similar books, not the original book itself.
Maximum 3 books.

Examples:
- If text mentions "Atomic Habits by James Clear", return: ["Atomic Habits James Clear"]
- If user asks for "books like Atomic Habits", return similar books like: ["The Power of Habit Charles Duhigg", "Tiny Habits BJ Fogg"]

JSON Array:`;

      const result = await geminiCall({
        message: extractionPrompt,
        chatHistory: []
      });

      try {
        const books = JSON.parse(result.response.trim());
        if (Array.isArray(books)) {
          console.log('Gemini extracted books:', books);
          return books.slice(0, 3); // Limit to 3 books
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini book extraction response:', result.response);
      }

      return [];
    } catch (error) {
      console.error('Error in Gemini book extraction:', error);
      return [];
    }
  };

  // Extract book titles from Gemini's response and search for them
  const extractAndSearchBooks = async (text: string, userMessage?: string): Promise<Book[]> => {
    try {
      // Use Gemini to intelligently detect if the response contains book recommendations
      const shouldSearchBooks = await shouldExtractBooks(text, userMessage || '');

      if (!shouldSearchBooks) {
        console.log('Gemini determined no book recommendations to extract');
        return [];
      }

      // Analyze user intent from their original message
      const userIntent = analyzeUserIntent(userMessage || '');

      const foundBooks = new Set<string>();
      console.log('Extracting books from text:', text);

      // Use Gemini to intelligently extract book titles
      const geminiExtractedBooks = await extractBooksWithGemini(text, userMessage || '');
      geminiExtractedBooks.forEach(book => foundBooks.add(book));

      // Fallback: Pattern matching for common formats
      const pattern1 = /\*\*"([^"]+)"\s+by\s+([^*]+?)\*\*/gi;
      let match;
      while ((match = pattern1.exec(text)) !== null) {
        const title = match[1]?.trim();
        const author = match[2]?.trim();
        if (title && title.length > 2) {
          foundBooks.add(`${title} ${author}`);
          console.log('Found book (pattern fallback):', `${title} by ${author}`);
        }
      }

      // Always check for well-known book titles mentioned in conversation (fallback)
      const commonBooks = [
        { keywords: ['Atomic Habits', 'atomic habits'], search: 'Atomic Habits James Clear' },
        { keywords: ['The Power of Now'], search: 'The Power of Now Eckhart Tolle' },
        { keywords: ['Mindset', 'mindset'], search: 'Mindset Carol Dweck' },
        { keywords: ['Educated'], search: 'Educated Tara Westover' },
        { keywords: ['Sapiens'], search: 'Sapiens Yuval Noah Harari' }
      ];

      // Fallback: Check for direct mentions of popular books
      for (const mapping of commonBooks) {
        for (const keyword of mapping.keywords) {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            foundBooks.add(mapping.search);
            console.log('Found book (fallback keyword):', mapping.search);
            break;
          }
        }
      }      // Pattern 4: Extract any text in quotes that looks like book titles
      const quotedPattern = /"([A-Za-z][^"]{5,50})"/g;
      while ((match = quotedPattern.exec(text)) !== null) {
        const potentialTitle = match[1]?.trim();
        if (potentialTitle &&
            potentialTitle.length > 5 &&
            potentialTitle.length < 50 &&
            !potentialTitle.includes('?') &&
            !potentialTitle.includes('!') &&
            foundBooks.size < 5) {
          foundBooks.add(potentialTitle);
          console.log('Found potential book (quoted):', potentialTitle);
        }
      }

      console.log('Total books found:', foundBooks.size, Array.from(foundBooks));

      // Search for books using OpenLibrary
      const allBooks: Book[] = [];
      const searchPromises = Array.from(foundBooks).slice(0, 3).map(async (query) => {
        console.log('Searching for:', query);
        const books = await searchBooksFromOpenLibrary(query);
        console.log('Search results for', query, ':', books.length, 'books');
        return books.slice(0, 1); // Take only the best match per search
      });

      const results = await Promise.all(searchPromises);
      results.forEach(books => allBooks.push(...books));

      console.log('Final books to display:', allBooks.length);
      return allBooks.slice(0, 3);
    } catch (error) {
      console.error('Error extracting and searching books:', error);
      return [];
    }
  }

  const searchBooksFromOpenLibrary = async (query: string): Promise<Book[]> => {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 5; // Focus on books from last 5 years

      // Try multiple search strategies for better results
      const searchStrategies = [
        // Strategy 1: Recent books with the query, sorted by newest
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=new&limit=10&first_publish_year:[${startYear} TO ${currentYear}]`,
        // Strategy 2: Popular recent books (if no specific query results)
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=rating&limit=10&first_publish_year:[${startYear - 2} TO ${currentYear}]`,
        // Strategy 3: General search but filter for books with covers
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&has_fulltext=true`
      ];

      let allBooks: any[] = [];

      // Try the first strategy (newest books)
      for (const searchUrl of searchStrategies) {
        try {
          const response = await fetch(searchUrl);
          const data = await response.json();

          if (data.docs && data.docs.length > 0) {
            allBooks = data.docs;
            break; // Use the first successful strategy
          }
        } catch (err) {
          console.log('Search strategy failed, trying next...');
          continue;
        }
      }

      // Filter and sort for trending/recent books
      const filteredBooks = allBooks
        .filter((doc: any) => {
          // Only include books with covers and recent publication
          const hasImage = doc.cover_i;
          const publishYear = doc.first_publish_year;
          const isRecent = !publishYear || publishYear >= (currentYear - 10);
          const hasTitle = doc.title && doc.title.length > 2;

          return hasImage && isRecent && hasTitle;
        })
        .sort((a: any, b: any) => {
          // Sort by recency and popularity indicators
          const aYear = a.first_publish_year || 0;
          const bYear = b.first_publish_year || 0;
          const aEditions = a.edition_count || 0;
          const bEditions = b.edition_count || 0;

          // Prioritize newer books first
          if (aYear !== bYear) {
            return bYear - aYear;
          }

          // Then by number of editions (popularity indicator)
          return bEditions - aEditions;
        })
        .slice(0, 3); // Take top 3

      const books: Book[] = filteredBooks.map((doc: any) => ({
        id: doc.key || `${doc.title}-${doc.cover_i}`,
        title: doc.title || 'Unknown Title',
        authors: Array.isArray(doc.author_name) ? doc.author_name : [],
        description: doc.subtitle || '',
        // Use higher quality cover images
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
        coverUrls: doc.cover_i ? [
          `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        ] : null,
        publishedDate: doc.first_publish_year,
        categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
        averageRating: undefined,
        ratingsCount: undefined,
        pageCount: doc.number_of_pages_median,
        infoLink: doc.key ? `https://openlibrary.org${doc.key}` : null,
        publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : undefined,
        language: Array.isArray(doc.language) ? doc.language[0] : undefined,
      }));

      console.log(`Found ${books.length} trending books for query: ${query}`);
      return books;
    } catch (error) {
      console.error('Error searching books:', error)
      return []
    }
  }

  const callGeminiAPI = async (userMessage: string): Promise<{ response: string; bookQuery?: string }> => {
    try {
      const { callGeminiAPI: geminiCall } = await import('@/lib/gemini')
      return await geminiCall({
        message: userMessage,
        chatHistory: messages.slice(-5) // Send last 5 messages for context
      })
    } catch (error) {
      console.error('Error calling Gemini API:', error)

      // Check for specific error types
      if (error.message?.includes('Model not available') || error.message?.includes('404') || error.message?.includes('model')) {
        return {
          response: "🔧 **Model Updated**: I've updated to use the latest Gemini model (gemini-1.5-flash). Please try your question again!"
        }
      }

      if (error.message?.includes('API key')) {
        return {
          response: "❌ **API Key Issue**: Please check your Gemini API key configuration. Make sure VITE_GEMINI_API_KEY is set correctly in your .env.local file.\n\n🔗 Get a free API key from: https://makersuite.google.com/app/apikey"
        }
      }

      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return {
          response: "⚠️ **Rate Limit**: You've hit the API rate limit. Please wait a few minutes before trying again."
        }
      }

      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return {
          response: "🌐 **Connection Issue**: Please check your internet connection and try again."
        }
      }

      return {
        response: "🤖 **AI Service Temporarily Unavailable**: I'm having trouble connecting right now. Please try again in a moment!\n\n💡 In the meantime, try searching for books using the search bar above."
      }
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !user || isLoading) return

    if (dailyUsage >= DAILY_LIMIT) {
      toast({
        title: "Daily chat limit reached",
        description: `You've reached your daily limit of ${DAILY_LIMIT} chats. Try again tomorrow!`,
        variant: "destructive"
      })
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Save user message
    try {
      await saveChatMessage(userMessage)
    } catch (error) {
      console.warn('Could not save user message:', error)
    }

    try {
      // Call Gemini API
      const { response } = await callGeminiAPI(userMessage.content)
      console.log('Gemini response:', response)

      // Extract book titles from both user message and Gemini's response
      const books = await extractAndSearchBooks(response, userMessage.content)
      console.log('Found books:', books)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        books: books.length > 0 ? books : undefined,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message and update usage for each chat
      try {
        await saveChatMessage(assistantMessage)
        const newUsage = await updateDailyUsage(dailyUsage)
        setDailyUsage(newUsage)
      } catch (error) {
        console.warn('Could not save assistant message or update usage:', error)
      }

    } catch (error) {
      console.error('Error in chat:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  if (!user) {
    return (
      <div className={`fixed z-50 ${
        isMobile
          ? 'bottom-0 right-0 left-0'
          : 'bottom-20 right-6'
      }`}>
        <Card className={`shadow-xl border animate-in slide-in-from-bottom-5 duration-300 ${
          isMobile
            ? 'w-full rounded-t-3xl rounded-b-none'
            : 'w-80'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Book AI</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h3 className="font-semibold mb-2">Sign in to get personalized book recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Our AI assistant can help you discover amazing books based on your preferences!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`fixed z-50 ${
      isMobile
        ? 'bottom-0 right-0 left-0'
        : 'bottom-6 right-6'
    }`}>
      <Card className={`shadow-xl border transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-5 flex flex-col overflow-hidden bg-background ${
        isMobile
          ? 'w-full h-[85vh] rounded-t-3xl rounded-b-none'
          : 'rounded-3xl w-[500px] h-[640px] max-h-[90vh]'
      }`}>
        {/* Header */}
        <CardHeader className={`pb-3 border-b bg-gradient-to-r from-background to-secondary/10 ${
          isMobile ? 'px-4 py-4' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className={`font-semibold tracking-tight ${
                  isMobile ? 'text-lg' : 'text-lg'
                }`}>Book AI Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">Your reading companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium rounded-md">
                {dailyUsage}/{DAILY_LIMIT} chats today
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className={`hover:bg-secondary/50 rounded-lg ${
                  isMobile ? 'h-10 w-10' : 'h-8 w-8'
                }`}
              >
                <X className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            <div className="space-y-6 pb-4 min-h-full">
                  {messages.length === 0 && (
                    <div className="text-center py-8 animate-in fade-in duration-500">
                      <Bot className="h-14 w-14 mx-auto mb-4 text-muted-foreground animate-bounce" />
                      <h3 className="font-semibold text-lg mb-3">Ask me about books!</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        I can recommend books, discuss genres, help with reading goals, or chat about your favorite stories.
                      </p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`flex gap-3 max-w-[90%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {message.role === 'user' ? (
                            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                              <Bot className="h-4 w-4 text-secondary-foreground" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>

                          {message.books && message.books.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Recommended Books
                              </div>
                              {message.books.map((book) => (
                                <div
                                  key={book.id}
                                  className="cursor-pointer transform hover:scale-[1.02] transition-all duration-200 hover:shadow-md rounded-lg overflow-hidden"
                                  onClick={() => {
                                    onBookSelect(book)
                                    setIsOpen(false)
                                  }}
                                >
                                  <BookCard book={book} onClick={onBookSelect} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex gap-3">
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </CardContent>

        {/* Input */}
        <div className={`border-t bg-background ${isMobile ? 'p-4 pb-6' : 'p-4'}`}>
          <div className="flex gap-3 items-end">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                dailyUsage >= DAILY_LIMIT
                  ? `Daily chat limit reached (${DAILY_LIMIT} chats)`
                  : isMobile
                    ? 'Ask about books...'
                    : 'Ask me about books, genres, or anything reading-related...'
              }
              disabled={isLoading || dailyUsage >= DAILY_LIMIT}
              className={`flex-1 rounded-xl border-2 focus:border-primary/50 transition-colors bg-background ${
                isMobile ? 'h-12 text-base' : ''
              }`}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || dailyUsage >= DAILY_LIMIT}
              size="icon"
              className={`shrink-0 rounded-xl ${isMobile ? 'h-12 w-12' : 'h-11 w-11'}`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {dailyUsage >= DAILY_LIMIT && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Daily chat limit reached ({DAILY_LIMIT} chats/day). Try again tomorrow!
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
