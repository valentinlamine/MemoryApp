# Memory App - Spaced Repetition Learning Tool

A comprehensive application for memorizing information using spaced repetition techniques. Create categories, themes, and flashcards with multimedia content to enhance your learning experience.

## Features

- **User Authentication**: Secure login and registration system
- **Categories & Themes**: Organize your learning materials hierarchically
- **Multimedia Flashcards**: Create flashcards with text, images, audio, and video
- **Spaced Repetition**: Scientifically proven method for efficient memorization
- **Progress Tracking**: Monitor your learning progress
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React.js with Next.js App Router
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel

## Database Schema

The application uses the following database tables:

- **categories**: Organize flashcards by subject or topic
- **themes**: Group related flashcards within categories
- **flashcards**: Store the actual learning content with multimedia support
- **flashcard_progress**: Track learning progress for spaced repetition
- **user_settings**: Store user preferences for the learning experience

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up Supabase and add environment variables
4. Run the development server with `npm run dev`

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

The application can be easily deployed to Vercel:

1. Connect your GitHub repository to Vercel
2. Add the required environment variables
3. Deploy the application

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

