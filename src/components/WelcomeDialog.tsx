import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageCircle, Sparkles, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface WelcomeDialogProps {
  onOpenChat: () => void
}

export function WelcomeDialog({ onOpenChat }: WelcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Show dialog when page loads if user is logged in
    if (user) {
      const hasSeenWelcome = localStorage.getItem('hasSeenChatWelcome')
      if (!hasSeenWelcome) {
        setIsOpen(true)
        localStorage.setItem('hasSeenChatWelcome', 'true')
      }
    }
  }, [user])

  const handleOpenChat = () => {
    setIsOpen(false)
    onOpenChat()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Discover Your Next Great Read
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Welcome dialog for the AI book recommendation assistant
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-6">
          <div className="mb-6">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-primary animate-bounce" />
            <h3 className="font-semibold text-lg mb-2">Ask me about books!</h3>
            <p className="text-sm text-muted-foreground">
              I'm your AI book companion. Tell me your mood, favorite genres, or what you're interested in,
              and I'll recommend the perfect books for you.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Try asking me:
            </div>
            <div className="grid gap-2 text-xs">
              <div className="bg-muted p-2 rounded text-muted-foreground">
                "I want something like Harry Potter"
              </div>
              <div className="bg-muted p-2 rounded text-muted-foreground">
                "Recommend a mystery novel for beginners"
              </div>
              <div className="bg-muted p-2 rounded text-muted-foreground">
                "I'm feeling sad, what should I read?"
              </div>
            </div>
          </div>

          <Button
            onClick={handleOpenChat}
            className="w-full mt-6"
            variant="hero"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Start Chatting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
