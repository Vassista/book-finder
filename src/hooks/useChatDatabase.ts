import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  books?: any[]
  timestamp: Date
}

export function useChatDatabase() {
  const { user } = useAuth()
  const [isTableMissing, setIsTableMissing] = useState(false)

  const checkDailyUsage = async (): Promise<number> => {
    if (!user || isTableMissing) return 0

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('chat_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code === '42P01') {
        // Table doesn't exist
        setIsTableMissing(true)
        return 0
      }

      return data?.count || 0
    } catch (error) {
      console.warn('Could not check daily usage:', error)
      return 0
    }
  }

  const updateDailyUsage = async (currentCount: number): Promise<number> => {
    if (!user || isTableMissing) return currentCount

    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase
        .from('chat_usage')
        .upsert(
          {
            user_id: user.id,
            date: today,
            count: currentCount + 1
          },
          {
            onConflict: 'user_id,date'
          }
        )

      if (error && error.code === '42P01') {
        setIsTableMissing(true)
        return currentCount
      }

      return currentCount + 1
    } catch (error) {
      console.warn('Could not update daily usage:', error)
      return currentCount
    }
  }

  const loadChatHistory = async (): Promise<Message[]> => {
    if (!user || isTableMissing) return []

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (error && error.code === '42P01') {
        // Table doesn't exist
        setIsTableMissing(true)
        return []
      }

      if (!error && data) {
        return data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          books: msg.books ? JSON.parse(msg.books) : undefined,
          timestamp: new Date(msg.created_at)
        }))
      }

      return []
    } catch (error) {
      console.warn('Could not load chat history:', error)
      return []
    }
  }

  const saveChatMessage = async (message: Message): Promise<void> => {
    if (!user || isTableMissing) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          user_id: user.id,
          role: message.role,
          content: message.content,
          books: message.books ? JSON.stringify(message.books) : null
        })

      if (error && error.code === '42P01') {
        setIsTableMissing(true)
      }
    } catch (error) {
      console.warn('Could not save chat message:', error)
    }
  }

  return {
    checkDailyUsage,
    updateDailyUsage,
    loadChatHistory,
    saveChatMessage,
    isTableMissing
  }
}
