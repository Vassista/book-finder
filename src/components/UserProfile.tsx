import { useState, useEffect } from "react"
import { User, Heart, BookOpen, Clock, Settings, Star, LogOut, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useUserBooks } from "@/hooks/useUserBooks"

interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  favorite_genres: string[] | null
  reading_goal_year: number
  reading_goal_target: number
  reading_streak: number
  created_at: string
  updated_at: string
}

interface BookStatus {
  id: string
  title: string
  author: string
  cover_url?: string
  status: 'reading' | 'completed' | 'wishlist'
  progress?: number
  rating?: number
  google_books_id?: string
}

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [books, setBooks] = useState<BookStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [removingBookId, setRemovingBookId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    reading_goal_target: 50
  })

  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const { removeBook } = useUserBooks()

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchBooks()
    }
  }, [user])

  useEffect(() => {
    const handleBookCollectionUpdate = () => {
      if (user) {
        fetchBooks()
        fetchProfile() // Also refresh profile stats
      }
    }

    window.addEventListener('bookCollectionUpdated', handleBookCollectionUpdate)

    return () => {
      window.removeEventListener('bookCollectionUpdated', handleBookCollectionUpdate)
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    if (data) {
      setProfile(data)
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        reading_goal_target: data.reading_goal_target
      })
    }
    setLoading(false)
  }

  const fetchBooks = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching books:', error)
      return
    }

    setBooks((data || []) as BookStatus[])
  }

  const updateProfile = async () => {
    if (!user || !profile) return

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
        reading_goal_target: editForm.reading_goal_target
      })
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      })
      setIsEditing(false)
      fetchProfile()
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  if (!user) {
    return null
  }

  const booksRead = books.filter(book => book.status === 'completed').length
  const currentYear = new Date().getFullYear()
  const readingGoalProgress = profile ? (booksRead / profile.reading_goal_target) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reading': return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'completed': return <Star className="w-4 h-4 text-yellow-500" />
      case 'wishlist': return <Heart className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
      case 'completed': return 'bg-green-500/20 text-green-700 dark:text-green-300'
      case 'wishlist': return 'bg-red-500/20 text-red-700 dark:text-red-300'
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
    }
  }

  const handleRemoveBook = async (bookId: string) => {
    try {
      setRemovingBookId(bookId)
      await removeBook(bookId)
      // Refresh the books list
      fetchBooks()
    } catch (error) {
      console.error('Failed to remove book:', error)
    } finally {
      setRemovingBookId(null)
    }
  }

  if (loading && !profile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="w-4 h-4" />
            <span className="sr-only">User profile</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-96 overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <User className="w-4 h-4" />
          <span className="sr-only">User profile</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-96 overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || user.email || ''} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle>{profile?.display_name || user.email}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(profile?.created_at || '').getFullYear()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Reading Goal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {currentYear} Reading Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{booksRead} books</span>
                    <span>{profile?.reading_goal_target || 50} books</span>
                  </div>
                  <Progress
                    value={readingGoalProgress}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {Math.max(0, (profile?.reading_goal_target || 50) - booksRead)} books to go
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{booksRead}</div>
                    <p className="text-xs text-muted-foreground">Books Read</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile?.reading_streak || 0}</div>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Favorite Genres */}
            {profile?.favorite_genres && profile.favorite_genres.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Favorite Genres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reading" className="space-y-4">
            <div className="space-y-3">
              {books.length === 0 ? (
                <Card className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No books in your collection yet</p>
                  <p className="text-sm text-muted-foreground">Start by searching for books!</p>
                </Card>
              ) : (
                books.map((book) => (
                  <Card key={book.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        {book.cover_url && (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{book.title}</h4>
                          <p className="text-xs text-muted-foreground">{book.author}</p>

                          {book.progress && book.progress > 0 && (
                            <div className="mt-2">
                              <Progress value={book.progress} className="h-1" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {book.progress}% complete
                              </p>
                            </div>
                          )}

                          {book.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: book.rating }, (_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusIcon(book.status)}
                        <Badge
                          className={`text-xs ${getStatusColor(book.status)}`}
                          variant="secondary"
                        >
                          {book.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBook(book.id)}
                          disabled={removingBookId === book.id}
                          className="h-6 w-6 p-0 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500 transition-all duration-300"
                        >
                          {removingBookId === book.id ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reading Statistics</CardTitle>
                <CardDescription>Your reading journey over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">
                      {books.filter(b => b.rating).length > 0
                        ? (books.filter(b => b.rating).reduce((acc, b) => acc + (b.rating || 0), 0) / books.filter(b => b.rating).length).toFixed(1)
                        : '0'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{books.filter(b => b.status === 'reading').length}</div>
                    <p className="text-xs text-muted-foreground">Currently Reading</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{books.filter(b => b.status === 'wishlist').length}</div>
                    <p className="text-xs text-muted-foreground">Wishlist</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{books.length}</div>
                    <p className="text-xs text-muted-foreground">Total Books</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reading_goal">Reading Goal ({currentYear})</Label>
                    <Input
                      id="reading_goal"
                      type="number"
                      value={editForm.reading_goal_target}
                      onChange={(e) => setEditForm({ ...editForm, reading_goal_target: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={updateProfile} disabled={loading} className="flex-1">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email || ''} disabled />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
