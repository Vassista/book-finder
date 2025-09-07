# BookFinder - AI-Powered Book Discovery Platform

## 🚀 New Feature: AI Book Chatbot

BookFinder now includes an intelligent AI chatbot powered by Google's Gemini API! Get personalized book recommendations through natural conversation.

### ✨ Chatbot Features
- 🤖 **AI-powered recommendations** based on your preferences and mood
- 💬 **Natural language conversations** about books
- 📚 **Interactive book cards** with direct access to book details
- 🔢 **Daily usage limits** (5 recommendations per day)
- 🔐 **Login required** for personalized experience
- 🎉 **Welcome dialog** on first visit

### 🛠️ Setup Instructions
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Start chatting! Look for the floating chat button or welcome dialog.

For detailed setup instructions, see [CHATBOT_SETUP.md](./CHATBOT_SETUP.md)

---

## Development

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

```sh
# Clone the repository
git clone https://github.com/Vassista/read-finder.git
cd read-finder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Making Changes
- Make your changes and commit them
- Push to your repository

### Using GitHub Codespaces
- Navigate to the repository main page
- Click "Code" → "Codespaces" → "New codespace"
- Edit files directly and commit your changes

## Technologies Used

- **Frontend:** Vite, TypeScript, React
- **UI:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase (Database, Auth)
- **APIs:** Google Books API, Open Library API, Gemini API

## Deployment

### CodeSandbox Deployment (Recommended)

1. **GitHub Import:**
   - Go to [CodeSandbox](https://codesandbox.io)
   - Click "Import from GitHub"
   - Enter: `https://github.com/Vassista/read-finder`

2. **Environment Variables:**
   - In CodeSandbox, go to Server Control Panel
   - Add environment variables:
     - `VITE_GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Configure Environment Variables:**
   - In your CodeSandbox, go to Server Control Panel (bottom left)
   - Click on "Environment" tab
   - Add the following variables:
     - `VITE_GEMINI_API_KEY` = your_gemini_api_key_here
     - `VITE_SUPABASE_URL` = your_supabase_url_here
     - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key_here

3. **OAuth Configuration:**
   - Update Supabase settings with your CodeSandbox URL
   - Site URL: `https://[sandbox-id].codesandbox.io`
   - Redirect URLs: `https://[sandbox-id].codesandbox.io/**`

**Benefits of CodeSandbox:**
- ✅ Instant deployment and preview
- ✅ Automatic HTTPS with custom subdomain
- ✅ Built-in environment variable management
- ✅ Real-time collaboration
- ✅ No build configuration needed
- ✅ Perfect for React/Vite projects

### Alternative: Deploying to Vercel

1. Fork or clone this repository
2. Create a new Vercel project and import the repo
3. Add the Environment Variables in Vercel Dashboard
4. Build command: `npm run build`
5. Output directory: `dist`

## Features

- 📖 **Book Search:** Search millions of books using Google Books API
- 🔍 **Advanced Filtering:** Filter by genre, author, publication year
- 📚 **Personal Library:** Save books to reading lists (wishlist, reading, completed)
- ⭐ **Rating System:** Rate and review your books
- 🤖 **Smart Chatbot:** Get personalized recommendations via chat
- 📱 **Responsive Design:** Optimized for mobile and desktop
- 🔐 **User Authentication:** Secure login with Supabase Auth
- 🎨 **Modern UI:** Clean, intuitive interface with dark/light themes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.
