-- COMPLETE SETUP FILE WITH AUTHENTICATION
-- This single file contains everything needed for your flashcard system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AUTHENTICATION SETUP
-- Note: Most auth tables are created automatically by Supabase
-- This just adds any custom auth settings needed

-- Set up email authentication (already enabled by default in Supabase)
-- You can uncomment this if you need to modify default settings
/*
ALTER SYSTEM SET auth.email.enable_signup = true;
ALTER SYSTEM SET auth.email.enable_confirmations = false;
*/

-- FLASHCARD SYSTEM TABLES

-- Categories table (for organizing flashcards by subject)
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own categories"
  ON public.categories
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Flashcards table with card_number and simplified fields
CREATE TABLE public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  card_number SERIAL NOT NULL, -- Added card number for easy identification
  question TEXT NOT NULL, -- Recto (front side)
  answer TEXT NOT NULL,   -- Verso (back side)
  image_url TEXT,         -- Optional image
  audio_url TEXT,         -- Optional audio
  difficulty INT DEFAULT 1 NOT NULL, -- 1-5 scale for difficulty
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- Create a unique constraint for user_id + card_number
  UNIQUE(user_id, card_number)
);

-- Enable RLS on flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own flashcards"
  ON public.flashcards
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Review history table for spaced repetition
CREATE TABLE public.review_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  score INT NOT NULL, -- 1-5 scale (1=hard, 5=easy)
  next_review_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on review_history
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own review history"
  ON public.review_history
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User settings table (simplified)
CREATE TABLE public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cards_per_day INT DEFAULT 20 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own settings"
  ON public.user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to create default user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to calculate next review date based on score
CREATE OR REPLACE FUNCTION public.calculate_next_review_date(score INT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  next_date := NOW();
  
  -- Simple spaced repetition algorithm
  -- 1 = Again (1 day)
  -- 2 = Hard (3 days)
  -- 3 = Good (7 days)
  -- 4 = Easy (14 days)
  -- 5 = Very Easy (30 days)
  CASE score
    WHEN 1 THEN next_date := next_date + INTERVAL '1 day';
    WHEN 2 THEN next_date := next_date + INTERVAL '3 days';
    WHEN 3 THEN next_date := next_date + INTERVAL '7 days';
    WHEN 4 THEN next_date := next_date + INTERVAL '14 days';
    WHEN 5 THEN next_date := next_date + INTERVAL '30 days';
    ELSE next_date := next_date + INTERVAL '1 day';
  END CASE;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cards due for review
CREATE OR REPLACE FUNCTION public.get_cards_due_for_review(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  card_number INT,
  category_id UUID,
  question TEXT,
  answer TEXT,
  image_url TEXT,
  audio_url TEXT,
  difficulty INT,
  category_name TEXT,
  last_review_date TIMESTAMP WITH TIME ZONE,
  review_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_reviews AS (
    SELECT 
      rh.flashcard_id,
      MAX(rh.review_date) AS last_review,
      COUNT(rh.id) AS review_count
    FROM 
      public.review_history rh
    WHERE 
      rh.user_id = user_uuid
    GROUP BY 
      rh.flashcard_id
  )
  SELECT 
    f.id,
    f.card_number,
    f.category_id,
    f.question,
    f.answer,
    f.image_url,
    f.audio_url,
    f.difficulty,
    c.name AS category_name,
    lr.last_review AS last_review_date,
    COALESCE(lr.review_count, 0) AS review_count
  FROM 
    public.flashcards f
    JOIN public.categories c ON f.category_id = c.id
    LEFT JOIN latest_reviews lr ON f.id = lr.flashcard_id
    LEFT JOIN public.review_history rh ON f.id = rh.flashcard_id AND rh.review_date = lr.last_review
  WHERE 
    f.user_id = user_uuid
    AND (
      -- Include cards that are due for review
      (rh.next_review_date IS NOT NULL AND rh.next_review_date <= NOW())
      -- Or cards that have never been reviewed
      OR rh.id IS NULL
    )
  ORDER BY 
    COALESCE(rh.next_review_date, NOW()) ASC,
    f.created_at ASC
  LIMIT 
    (SELECT cards_per_day FROM public.user_settings WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('flashcard-media', 'flashcard-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flashcard-media');

CREATE POLICY "Individual User Upload Access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'flashcard-media' AND auth.uid() = owner);

CREATE POLICY "Individual User Update Access"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'flashcard-media' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'flashcard-media' AND auth.uid() = owner);

CREATE POLICY "Individual User Delete Access"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'flashcard-media' AND auth.uid() = owner);

-- Create indexes for better performance
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_category_id ON public.flashcards(category_id);
CREATE INDEX idx_flashcards_card_number ON public.flashcards(card_number);
CREATE INDEX idx_review_history_user_id ON public.review_history(user_id);
CREATE INDEX idx_review_history_next_review ON public.review_history(next_review_date);

-- Add a rollback function in case you need to reset everything
CREATE OR REPLACE FUNCTION public.rollback_flashcard_system()
RETURNS void AS $$
BEGIN
  -- Drop indexes
  DROP INDEX IF EXISTS idx_flashcards_user_id;
  DROP INDEX IF EXISTS idx_flashcards_category_id;
  DROP INDEX IF EXISTS idx_flashcards_card_number;
  DROP INDEX IF EXISTS idx_review_history_user_id;
  DROP INDEX IF EXISTS idx_review_history_next_review;
  
  -- Drop policies
  DROP POLICY IF EXISTS "Users can CRUD their own categories" ON public.categories;
  DROP POLICY IF EXISTS "Users can CRUD their own flashcards" ON public.flashcards;
  DROP POLICY IF EXISTS "Users can CRUD their own review history" ON public.review_history;
  DROP POLICY IF EXISTS "Users can CRUD their own settings" ON public.user_settings;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Upload Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Update Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual User Delete Access" ON storage.objects;
  
  -- Drop trigger
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS public.handle_new_user();
  DROP FUNCTION IF EXISTS public.calculate_next_review_date(INT);
  DROP FUNCTION IF EXISTS public.get_cards_due_for_review(UUID);
  
  -- Drop tables
  DROP TABLE IF EXISTS public.review_history;
  DROP TABLE IF EXISTS public.flashcards;
  DROP TABLE IF EXISTS public.categories;
  DROP TABLE IF EXISTS public.user_settings;
END;
$$ LANGUAGE plpgsql;

