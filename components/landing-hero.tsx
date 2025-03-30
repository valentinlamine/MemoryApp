import { Button } from "@/components/ui/button"
import Link from "next/link"

export function LandingHero() {
  return (
    <div className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">Memorize Anything with Spaced Repetition</h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-[800px] mb-8">
        Create flashcards, organize them into themes and categories, and use the power of spaced repetition to memorize
        them effectively.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/dashboard">Get Started</Link>
        </Button>
        {/* <Button asChild size="lg" variant="outline">
          <Link href="/">Learn More</Link>
        </Button> */}
      </div>
    </div>
  )
}

