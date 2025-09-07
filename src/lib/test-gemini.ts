import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

console.log('Testing Gemini API key...')
console.log('API Key present:', !!API_KEY)
console.log('API Key starts with:', API_KEY?.substring(0, 10) + '...')

export const testGeminiConnection = async () => {
  try {
    if (!API_KEY) {
      return { success: false, error: 'No API key found' }
    }

    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent('Say hello in one word.')
    const response = result.response.text()

    return { success: true, response }
  } catch (error) {
    console.error('Gemini test error:', error)

    if (error.message?.includes('404') || error.message?.includes('model')) {
      return { success: false, error: '❌ Model Error: The Gemini model is not available. Updated to use gemini-1.5-flash.' }
    }

    if (error.message?.includes('API key') || error.message?.includes('401')) {
      return { success: false, error: '🔑 Invalid API Key: Please check your VITE_GEMINI_API_KEY in .env.local' }
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return { success: false, error: '⚠️ Quota Exceeded: Please wait a few minutes and try again' }
    }

    return { success: false, error: `❌ ${error.message}` }
  }
}
