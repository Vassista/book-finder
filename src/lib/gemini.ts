import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Chat functionality will be limited.')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

export interface ChatRequest {
  message: string
  chatHistory?: Array<{ role: string; content: string }>
}

export interface ChatResponse {
  response: string
}

export async function callGeminiAPI({ message, chatHistory = [] }: ChatRequest): Promise<ChatResponse> {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Build context from chat history
    const context = chatHistory
      .slice(-5) // Only use last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')

    // Create a comprehensive prompt for book recommendations
    const prompt = `You are a friendly AI book companion. You can have conversations about books, reading, and literature, but also provide book recommendations when appropriate.

Guidelines:
1. Be conversational and engaging - don't always recommend books
2. When the user asks general questions, have a natural conversation
3. Only recommend specific books when the user explicitly asks for recommendations or mentions wanting something to read
4. When recommending books, use this format: **"Book Title" by Author Name**: Brief description
5. Keep responses concise and engaging
6. Use markdown formatting for better readability
7. Recommend 2-3 books maximum when giving recommendations

Previous conversation:
${context}

Current user message: ${message}

Instructions:
- If the user is asking for book recommendations, provide 2-3 specific books with titles and authors
- If the user is asking questions about reading, books, or literature, have a conversation without necessarily recommending specific books
- If the user is greeting or having casual conversation, respond naturally
- Always be helpful and book-focused, but don't force recommendations when not asked

Respond naturally and conversationally:`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    return {
      response: text
    }

  } catch (error) {
    console.error('Gemini API error:', error)

    if (error.message?.includes('404') || error.message?.includes('model')) {
      throw new Error('Model not available. Please check the Gemini API model configuration.')
    }

    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key configuration.')
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error('API quota exceeded. Please wait and try again later.')
    }

    throw new Error('Failed to get response from AI assistant')
  }
}
