# Gemini AI Chatbot

A ChatGPT-like interface powered by Google Gemini AI, built with Next.js, Tailwind CSS, and Neon database.

## Features

- 🤖 Powered by Google Gemini AI
- 💬 ChatGPT-like interface
- 🎨 Beautiful UI with Tailwind CSS
- 💾 Message persistence with Neon database
- 🔐 Secure authentication with Better Auth
- 🧠 Long-term memory with Supermemory (per-user isolation)
- 🗑️ Memory management - view and delete stored memories
- 🌙 Dark mode support
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK with Google Gemini
- **Database**: Neon (PostgreSQL) with Prisma ORM
- **Icons**: Lucide React

## Setup Instructions

### 1. Get Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new API key
4. Copy the API key

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
SUPERMEMORY_API_KEY="your-supermemory-api-key"

# Database (for message persistence)
DATABASE_URL="your-neon-database-url"

# Authentication Configuration
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://gemai.aniruddhadev.in/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your environment variables

### 4. Install Dependencies and Run

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

### 5. Optional: Database Setup (for message persistence)

If you want to save chat messages to a database:

1. Create a Neon database at [neon.tech](https://neon.tech)
2. Add your database URL to `.env.local`:
   ```env
   DATABASE_URL="your-neon-database-url"
   ```
3. Run database setup:
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment to Vercel

### 1. Environment Variables in Vercel

Set these environment variables in your Vercel dashboard:

```env
# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"
SUPERMEMORY_API_KEY="your-supermemory-api-key"

# Database
DATABASE_URL="your-neon-database-url"

# Authentication URLs (for production)
BETTER_AUTH_URL="https://gemai.aniruddhadev.in"
NEXT_PUBLIC_APP_URL="https://gemai.aniruddhadev.in"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Google OAuth Configuration

Make sure to add your production domain to Google OAuth:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to your OAuth 2.0 Client ID
- Add `https://gemai.aniruddhadev.in/api/auth/callback/google` to authorized redirect URIs

### 3. Deploy

```bash
# Deploy to Vercel
vercel --prod
```

## Usage

1. Start a new chat by clicking the "New Chat" button
2. Type your message in the input field
3. Press Enter or click Send to get a response from Gemini AI
4. Your conversations are automatically saved to the database

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts    # Authentication endpoints
│   │   └── chat/                     # Chat API endpoints
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── components/
│   ├── App.tsx                       # Main app component
│   ├── ChatView.tsx                  # Chat interface
│   ├── LoginModal.tsx                # Login modal
│   ├── ModelSelector.tsx             # AI model selector
│   ├── Sidebar.tsx                   # Sidebar component
│   └── providers/
│       └── AuthProvider.tsx          # Authentication provider
└── lib/
    ├── auth.ts                       # Authentication configuration
    ├── auth-client.ts                # Client-side auth
    └── db.ts                         # Database connection
```

## API Endpoints

- `POST /api/chat` - Handles chat messages and AI responses

## Database Schema

- **Chat**: Stores chat sessions
- **Message**: Stores individual messages with role (user/assistant) and content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License