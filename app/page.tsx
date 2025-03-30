import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { LandingHero } from "@/components/landing-hero"
import { Features } from "@/components/features"
import { BookOpen, Layers } from "lucide-react"

export default function Home() {
  return (
    <div>
      <LandingHero />
      <Features />

      <div className="container mx-auto px-4 py-16 bg-background">
        <h2 className="text-3xl font-bold text-center mb-4">Get Started</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Begin your learning journey with our powerful flashcard system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border border-border/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center text-primary mb-4">
                <Layers className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Categories</CardTitle>
              <CardDescription className="text-base">Organize your learning materials</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Create categories to organize your learning materials by subject, course, or any other classification.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard/categories">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border border-border/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center text-primary mb-4">
                <BookOpen className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Flashcards</CardTitle>
              <CardDescription className="text-base">Create and review flashcards</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Create flashcards with text, images, audio, and video to help you memorize information effectively.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard/flashcards">Create Flashcards</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

