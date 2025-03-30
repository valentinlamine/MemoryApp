import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Layers, Repeat, Bell, Image } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Layers className="h-10 w-10" />,
      title: "Organize Your Learning",
      description: "Create categories, themes, and flashcards to organize your learning materials.",
    },
    {
      icon: <Brain className="h-10 w-10" />,
      title: "Spaced Repetition",
      description: "Use spaced repetition to memorize information more effectively and efficiently.",
    },
    {
      icon: <Image className="h-10 w-10" />,
      title: "Multimedia Support",
      description: "Add images, audio, and video to your flashcards for enhanced learning.",
    },
    {
      icon: <Repeat className="h-10 w-10" />,
      title: "Customizable Review",
      description: "Customize the number of levels and new cards per day to fit your learning style.",
    },
    // {
    //   icon: <Bell className="h-10 w-10" />,
    //   title: "Daily Reminders",
    //   description: "Get daily notifications to remind you to review your flashcards.",
    // },
    // {
    //   icon: <Wifi className="h-8 w-8 text-primary" />,
    //   title: "Offline Support",
    //   description: "Use the app even without an internet connection.",
    // },
  ]

  return (
    <div className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Key Features</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Our spaced repetition system helps you learn and retain information more effectively
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border border-border/40 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-1"
            >
              <CardHeader className="pb-2 text-center">
                <div className="mx-auto rounded-full bg-primary/10 p-4 mb-4 w-20 h-20 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

