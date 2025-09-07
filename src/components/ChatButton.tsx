import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface ChatButtonProps {
  onClick: () => void
}

export function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="hero"
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-glow hover:scale-105 transition-all duration-300 z-50"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}
