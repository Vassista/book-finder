import { useState } from "react"
import { BookOpen, Plus, X, Clock, Star, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReadingSession {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  startPage: number
  endPage: number
  totalPages: number
  startTime: Date
  endTime: Date
  notes?: string
  rating?: number
}

interface ReadingBook {
  id: string
  title: string
  author: string
  totalPages: number
  currentPage: number
  startDate: Date
  targetDate?: Date
  status: 'reading' | 'paused' | 'completed'
  sessions: ReadingSession[]
  cover?: string
}

export function ReadingTracker() {
  const [books, setBooks] = useState<ReadingBook[]>([
    {
      id: "1",
      title: "The Midnight Library",
      author: "Matt Haig",
      totalPages: 288,
      currentPage: 187,
      startDate: new Date('2024-01-15'),
      targetDate: new Date('2024-02-15'),
      status: 'reading',
      sessions: []
    },
    {
      id: "2", 
      title: "Atomic Habits",
      author: "James Clear",
      totalPages: 320,
      currentPage: 320,
      startDate: new Date('2024-01-01'),
      status: 'completed',
      sessions: []
    }
  ])
  
  const [isAddingBook, setIsAddingBook] = useState(false)
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    totalPages: '',
    targetDate: ''
  })

  const handleAddBook = () => {
    if (newBook.title && newBook.author && newBook.totalPages) {
      const book: ReadingBook = {
        id: Date.now().toString(),
        title: newBook.title,
        author: newBook.author,
        totalPages: parseInt(newBook.totalPages),
        currentPage: 0,
        startDate: new Date(),
        targetDate: newBook.targetDate ? new Date(newBook.targetDate) : undefined,
        status: 'reading',
        sessions: []
      }
      
      setBooks([...books, book])
      setNewBook({ title: '', author: '', totalPages: '', targetDate: '' })
      setIsAddingBook(false)
    }
  }

  const updateProgress = (bookId: string, newPage: number) => {
    setBooks(books.map(book => 
      book.id === bookId 
        ? { 
            ...book, 
            currentPage: newPage,
            status: newPage >= book.totalPages ? 'completed' : 'reading'
          }
        : book
    ))
  }

  const getProgress = (book: ReadingBook) => (book.currentPage / book.totalPages) * 100

  const getDaysLeft = (targetDate?: Date) => {
    if (!targetDate) return null
    const today = new Date()
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
      case 'completed': return 'bg-green-500/20 text-green-700 dark:text-green-300'
      case 'paused': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
    }
  }

  const readingBooks = books.filter(book => book.status === 'reading')
  const completedBooks = books.filter(book => book.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-primary">Reading Tracker</h2>
          <p className="text-muted-foreground">Track your reading progress and goals</p>
        </div>
        
        <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Start tracking a new book in your reading journey.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title</Label>
                <Input 
                  id="title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder="Enter book title"
                />
              </div>
              
              <div>
                <Label htmlFor="author">Author</Label>
                <Input 
                  id="author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder="Enter author name"
                />
              </div>
              
              <div>
                <Label htmlFor="pages">Total Pages</Label>
                <Input 
                  id="pages"
                  type="number"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook({...newBook, totalPages: e.target.value})}
                  placeholder="Enter total pages"
                />
              </div>
              
              <div>
                <Label htmlFor="target">Target Date (Optional)</Label>
                <Input 
                  id="target"
                  type="date"
                  value={newBook.targetDate}
                  onChange={(e) => setNewBook({...newBook, targetDate: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddBook} className="flex-1">Add Book</Button>
                <Button variant="outline" onClick={() => setIsAddingBook(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Currently Reading */}
      {readingBooks.length > 0 && (
        <div>
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Currently Reading ({readingBooks.length})
          </h3>
          
          <div className="grid gap-4">
            {readingBooks.map((book) => (
              <Card key={book.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{book.title}</h4>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    
                    <Badge className={getStatusColor(book.status)} variant="secondary">
                      {book.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{book.currentPage} / {book.totalPages} pages</span>
                      </div>
                      <Progress value={getProgress(book)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(getProgress(book))}% complete
                      </p>
                    </div>
                    
                    {book.targetDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Target: {book.targetDate.toLocaleDateString()}
                          {getDaysLeft(book.targetDate) !== null && (
                            <span className="ml-2">
                              ({getDaysLeft(book.targetDate)} days left)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        placeholder="Current page"
                        value={book.currentPage}
                        onChange={(e) => updateProgress(book.id, parseInt(e.target.value) || 0)}
                        className="w-32"
                        max={book.totalPages}
                      />
                      <Button variant="outline" size="sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Log Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Books */}
      {completedBooks.length > 0 && (
        <div>
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Completed ({completedBooks.length})
          </h3>
          
          <div className="grid gap-3">
            {completedBooks.map((book) => (
              <Card key={book.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(book.status)} variant="secondary">
                      Completed
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {book.totalPages} pages
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {books.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No books yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your reading journey by adding your first book.
            </p>
            <Button onClick={() => setIsAddingBook(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Book
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}