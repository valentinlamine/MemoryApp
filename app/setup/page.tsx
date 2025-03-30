"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Check, Copy, Database, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState({
    categories: false,
    themes: false,
    flashcards: false,
    flashcard_progress: false,
    user_settings: false,
  })
  const [activeTab, setActiveTab] = useState("manual")

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkTableExists = async (tableName) => {
    try {
      const { error } = await supabase.from(tableName).select("*").limit(1)
      return !error || !error.message.includes("does not exist")
    } catch (error) {
      return false
    }
  }

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const categories = await checkTableExists("categories")
      const themes = await checkTableExists("themes")
      const flashcards = await checkTableExists("flashcards")
      const flashcard_progress = await checkTableExists("flashcard_progress")
      const user_settings = await checkTableExists("user_settings")

      setSetupStatus({
        categories,
        themes,
        flashcards,
        flashcard_progress,
        user_settings,
      })
    } catch (error) {
      console.error("Error checking database status:", error)
      toast({
        variant: "destructive",
        title: "Error checking database status",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const setupDatabase = async () => {
    setLoading(true)
    try {
      // Execute the SQL directly since stored procedures might not be available
      const sql = `
      -- Categories table
      create table if not exists public.categories (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        name text not null,
        description text,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null
      );

      -- Enable RLS on categories
      alter table public.categories enable row level security;

      -- Create policy for categories
      drop policy if exists "Users can CRUD their own categories" on public.categories;
      create policy "Users can CRUD their own categories"
        on public.categories
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      -- Themes table
      create table if not exists public.themes (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        category_id uuid references public.categories(id) on delete cascade not null,
        name text not null,
        description text,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null
      );

      -- Enable RLS on themes
      alter table public.themes enable row level security;

      -- Create policy for themes
      drop policy if exists "Users can CRUD their own themes" on public.themes;
      create policy "Users can CRUD their own themes"
        on public.themes
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      -- Flashcards table
      create table if not exists public.flashcards (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        theme_id uuid references public.themes(id) on delete cascade not null,
        front_text text not null,
        back_text text not null,
        front_image_url text,
        back_image_url text,
        front_audio_url text,
        back_audio_url text,
        front_video_url text,
        back_video_url text,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null
      );

      -- Enable RLS on flashcards
      alter table public.flashcards enable row level security;

      -- Create policy for flashcards
      drop policy if exists "Users can CRUD their own flashcards" on public.flashcards;
      create policy "Users can CRUD their own flashcards"
        on public.flashcards
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      -- Flashcard progress table for spaced repetition
      create table if not exists public.flashcard_progress (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        flashcard_id uuid references public.flashcards(id) on delete cascade not null,
        level int default 0 not null,
        last_review_date timestamp with time zone default now() not null,
        next_review_date timestamp with time zone default now() not null,
        review_count int default 0 not null,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null,
        unique(user_id, flashcard_id)
      );

      -- Enable RLS on flashcard_progress
      alter table public.flashcard_progress enable row level security;

      -- Create policy for flashcard_progress
      drop policy if exists "Users can CRUD their own flashcard progress" on public.flashcard_progress;
      create policy "Users can CRUD their own flashcard progress"
        on public.flashcard_progress
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      -- User settings table
      create table if not exists public.user_settings (
        id uuid default uuid_generate_v4() primary key,
        user_id uuid references auth.users(id) on delete cascade not null,
        new_cards_per_day int default 10 not null,
        max_reviews_per_day int default 50 not null,
        levels jsonb default '[{"days":0},{"days":1},{"days":3},{"days":7},{"days":14},{"days":30},{"days":90},{"days":180}]'::jsonb not null,
        notifications_enabled boolean default true not null,
        created_at timestamp with time zone default now() not null,
        updated_at timestamp with time zone default now() not null,
        unique(user_id)
      );

      -- Enable RLS on user_settings
      alter table public.user_settings enable row level security;

      -- Create policy for user_settings
      drop policy if exists "Users can CRUD their own settings" on public.user_settings;
      create policy "Users can CRUD their own settings"
        on public.user_settings
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);

      -- Create function to create default user settings on signup
      create or replace function public.handle_new_user()
      returns trigger as $$
      begin
        insert into public.user_settings (user_id)
        values (new.id);
        return new;
      end;
      $$ language plpgsql security definer;

      -- Create trigger for new user signup
      drop trigger if exists on_auth_user_created on auth.users;
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
      `

      // Execute the SQL directly
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

      if (error) {
        console.error("Error executing SQL:", error)
        toast({
          variant: "destructive",
          title: "Error setting up database",
          description: "Please try the manual setup method instead.",
        })
        setActiveTab("manual")
      } else {
        // Check status again
        await checkDatabaseStatus()

        toast({
          title: "Database setup complete",
          description: "The database tables have been created successfully.",
        })
      }
    } catch (error) {
      console.error("Error setting up database:", error)
      toast({
        variant: "destructive",
        title: "Error setting up database",
        description: "Please run the SQL scripts manually in the Supabase SQL editor.",
      })
      setActiveTab("manual")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The SQL script has been copied to your clipboard.",
    })
  }

  const allTablesExist = Object.values(setupStatus).every(Boolean)

  return (
    <div className="container mx-auto px-4 py-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-8">Database Setup</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Automatic Setup</TabsTrigger>
          <TabsTrigger value="manual">Manual Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Check if the required database tables exist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="categories" checked={setupStatus.categories} disabled />
                  <Label htmlFor="categories" className={setupStatus.categories ? "text-muted-foreground" : ""}>
                    Categories Table
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="themes" checked={setupStatus.themes} disabled />
                  <Label htmlFor="themes" className={setupStatus.themes ? "text-muted-foreground" : ""}>
                    Themes Table
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="flashcards" checked={setupStatus.flashcards} disabled />
                  <Label htmlFor="flashcards" className={setupStatus.flashcards ? "text-muted-foreground" : ""}>
                    Flashcards Table
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="flashcard_progress" checked={setupStatus.flashcard_progress} disabled />
                  <Label
                    htmlFor="flashcard_progress"
                    className={setupStatus.flashcard_progress ? "text-muted-foreground" : ""}
                  >
                    Flashcard Progress Table
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="user_settings" checked={setupStatus.user_settings} disabled />
                  <Label htmlFor="user_settings" className={setupStatus.user_settings ? "text-muted-foreground" : ""}>
                    User Settings Table
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={checkDatabaseStatus} variant="outline" disabled={loading}>
                <Database className="h-4 w-4 mr-2" />
                Check Status
              </Button>
              <Button onClick={setupDatabase} disabled={loading || allTablesExist}>
                {loading ? "Setting up..." : "Setup Database"}
              </Button>
            </CardFooter>
          </Card>

          {allTablesExist && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Check className="h-6 w-6 text-primary" />
                  <CardTitle>Setup Complete</CardTitle>
                </div>
                <CardDescription>All required database tables have been created.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <CardTitle>Manual Setup Instructions</CardTitle>
              </div>
              <CardDescription>
                Follow these steps to manually set up the database tables in your Supabase project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-4">
                <li>
                  <p>Go to your Supabase project dashboard</p>
                </li>
                <li>
                  <p>Navigate to the SQL Editor</p>
                </li>
                <li>
                  <p>Create a new query and paste the following SQL script:</p>
                  <div className="relative mt-2">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                      {`-- Create tables for the Memory App

-- Categories table
create table public.categories (
id uuid default uuid_generate_v4() primary key,
user_id uuid references auth.users(id) on delete cascade not null,
name text not null,
description text,
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- Create policy for categories
create policy "Users can CRUD their own categories"
on public.categories
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Themes table
create table public.themes (
id uuid default uuid_generate_v4() primary key,
user_id uuid references auth.users(id) on delete cascade not null,
category_id uuid references public.categories(id) on delete cascade not null,
name text not null,
description text,
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null
);

-- Enable RLS on themes
alter table public.themes enable row level security;

-- Create policy for themes
create policy "Users can CRUD their own themes"
on public.themes
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Flashcards table
create table public.flashcards (
id uuid default uuid_generate_v4() primary key,
user_id uuid references auth.users(id) on delete cascade not null,
theme_id uuid references public.themes(id) on delete cascade not null,
front_text text not null,
back_text text not null,
front_image_url text,
back_image_url text,
front_audio_url text,
back_audio_url text,
front_video_url text,
back_video_url text,
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null
);

-- Enable RLS on flashcards
alter table public.flashcards enable row level security;

-- Create policy for flashcards
create policy "Users can CRUD their own flashcards"
on public.flashcards
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Flashcard progress table for spaced repetition
create table public.flashcard_progress (
id uuid default uuid_generate_v4() primary key,
user_id uuid references auth.users(id) on delete cascade not null,
flashcard_id uuid references public.flashcards(id) on delete cascade not null,
level int default 0 not null,
last_review_date timestamp with time zone default now() not null,
next_review_date timestamp with time zone default now() not null,
review_count int default 0 not null,
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null,
unique(user_id, flashcard_id)
);

-- Enable RLS on flashcard_progress
alter table public.flashcard_progress enable row level security;

-- Create policy for flashcard_progress
create policy "Users can CRUD their own flashcard progress"
on public.flashcard_progress
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- User settings table
create table public.user_settings (
id uuid default uuid_generate_v4() primary key,
user_id uuid references auth.users(id) on delete cascade not null,
new_cards_per_day int default 10 not null,
max_reviews_per_day int default 50 not null,
levels jsonb default '[{"days":0},{"days":1},{"days":3},{"days":7},{"days":14},{"days":30},{"days":90},{"days":180}]'::jsonb not null,
notifications_enabled boolean default true not null,
created_at timestamp with time zone default now() not null,
updated_at timestamp with time zone default now() not null,
unique(user_id)
);

-- Enable RLS on user_settings
alter table public.user_settings enable row level security;

-- Create policy for user_settings
create policy "Users can CRUD their own settings"
on public.user_settings
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create function to create default user settings on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
insert into public.user_settings (user_id)
values (new.id);
return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Create a function to execute SQL directly (for automatic setup)
create or replace function exec_sql(sql_query text) returns void as $$
begin
execute sql_query;
end;
$$ language plpgsql security definer;`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(document.querySelector("pre").textContent)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
                <li>
                  <p>Run the SQL script by clicking the "Run" button</p>
                </li>
                <li>
                  <p>Return to this page and click "Check Status" to verify the tables were created</p>
                </li>
              </ol>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("setup")}>
                Back to Automatic Setup
              </Button>
              <Button onClick={checkDatabaseStatus} disabled={loading}>
                <Database className="h-4 w-4 mr-2" />
                Check Status
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

