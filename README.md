# Memory App - Spaced Repetition Learning Tool

A comprehensive application for memorizing information using spaced repetition techniques. Create categories, and flashcards with multimedia content to enhance your learning experience.

## Features

- **User Authentication**: Secure login and registration system
- **Categories**: Organize your learning materials hierarchically
- **Multimedia Flashcards**: Create flashcards with text, images, audio
- **Spaced Repetition**: Scientifically proven method for efficient memorization
- **Progress Tracking**: Monitor your learning progress
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React.js with Next.js App Router
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: Tailwind CSS with shadcn/ui components

## Database Schema

The application uses the following database tables:

- **categories**: Organize flashcards by subject or topic
- **flashcards**: Store the actual learning content with multimedia support
- **flashcard_progress**: Track learning progress for spaced repetition
- **user_settings**: Store user preferences for the learning experience

## Setup Supabase (Optional)

To integrate Supabase with your project, follow these steps:

1. **Create a Supabase Account:**
  - Visit [Supabase](https://supabase.com) and sign up for a free account if you don’t already have one.

2. **Create a Project:**
  - After logging in, click "Create New Project."
  - Give your project a name and set a password for your Supabase project database.
  - Select a region closest to you and click "Create Project."

3. **Set Up Database:**
  - Once your project is created, you’ll be redirected to your project dashboard.
  - Go to the **SQL Editor** from the sidebar.
  - Locate the `complete_setup.sql` file in the migrations folder of the project repository.
  - Copy all of the SQL code from the file and paste it into the SQL Editor in Supabase.
  - Click **Run** to execute the script and create the necessary tables in your Supabase database.

4. **Connect to Supabase:**
  - After running the setup script, click the **Connect** button at the top of the dashboard.
  - Go to the App Frawemework section and find the API keys. (be sure to be with Next.js selected)
    - `NEXT_PUBLIC_SUPABASE_URL` (Your Supabase project URL)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Your Supabase anonymous key)
  - Copy these keys and paste them into your `.env.local` file in the root of your project.

    Example of `.env.local` configuration:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

Now, your Supabase setup is complete and connected to the project.


## Getting Started

1. Clone the repository
2. Install dependencies with `npm install --legacy-peer-deps --verbose`
3. Set up Supabase and add environment variables or take the one i'll give you in Moodle comments
4. Run the development server with `npm run dev`


## Authors

- LAMINE Valentin
- GREDT Mathis
