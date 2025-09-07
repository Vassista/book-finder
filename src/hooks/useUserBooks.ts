import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface UserBook {
  id: string
  google_books_id: string | null
  title: string
  author: string
  cover_url: string | null
  description: string | null
  genre: string | null
  status: 'reading' | 'completed' | 'wishlist'
  progress: number
  rating: number | null
  started_at: string | null
  completed_at: string | null
}

export function useUserBooks() {
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchBooks = async () => {
    if (!user) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching books:', error)
    } else {
      setBooks((data || []) as UserBook[])
    }
    setLoading(false)
  }

  const addBook = async (bookData: {
    google_books_id?: string
    title: string
    author: string
    cover_url?: string
    description?: string
    genre?: string
    status?: 'reading' | 'completed' | 'wishlist'
  }) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add books to your collection.",
        variant: "destructive"
      })
      return null
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        ...bookData,
        status: bookData.status || 'wishlist'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Book already in collection",
          description: "This book is already in your collection.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error adding book",
          description: error.message,
          variant: "destructive"
        })
      }
      return null
    }

    toast({
      title: "Book added",
      description: `"${bookData.title}" has been added to your collection.`
    })
    
    fetchBooks() // Refresh the list
    return data
  }

  const updateBook = async (id: string, updates: Partial<UserBook>) => {
    if (!user) return

    const { error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: "Error updating book",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Book updated",
        description: "Your book has been updated successfully."
      })
      fetchBooks()
    }
  }

  const removeBook = async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast({
        title: "Error removing book",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Book removed",
        description: "The book has been removed from your collection."
      })
      fetchBooks()
    }
  }

  const isBookInCollection = (googleBooksId: string) => {
    return books.some(book => book.google_books_id === googleBooksId)
  }

  useEffect(() => {
    if (user) {
      fetchBooks()
    } else {
      setBooks([])
    }
  }, [user])

  return {
    books,
    loading,
    addBook,
    updateBook,
    removeBook,
    isBookInCollection,
    fetchBooks
  }
}