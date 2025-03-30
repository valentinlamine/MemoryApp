"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Plus, Trash, Image, FileAudio } from "lucide-react"
import type { Category, Flashcard } from "@/lib/supabase-schema"

export default function FlashcardsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newFlashcard, setNewFlashcard] = useState<Partial<Flashcard>>({
    category_id: "",
    question: "",
    answer: "",
    image_url: "",
    audio_url: "",
    difficulty: 1,
  })
  const [editFlashcard, setEditFlashcard] = useState<Flashcard | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null)
  const [activeTab, setActiveTab] = useState("front")
  const [editActiveTab, setEditActiveTab] = useState("front")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        loadCategories()
        loadFlashcards()
      }
    }

    checkUser()
  }, [supabase, router])

  const loadCategories = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.from("categories").select("*").eq("user_id", user.id).order("name")

      if (error) {
        console.error("Error loading categories:", error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error("Error in loadCategories:", error)
    }
  }

  const loadFlashcards = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase
        .from("flashcards")
        .select(`
          *,
          category:category_id(*)
        `)
        .eq("user_id", user.id)

      if (selectedCategoryId) {
        query = query.eq("category_id", selectedCategoryId)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading flashcards:", error)
        return
      }

      setFlashcards(data || [])
    } catch (error) {
      console.error("Error in loadFlashcards:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlashcards()
  }, [selectedCategoryId])

  const handleAddFlashcard = async () => {
    try {
      if (!newFlashcard.category_id) {
        toast({
          variant: "destructive",
          title: "Category is required",
          description: "Please select a category for the flashcard.",
        })
        return
      }

      if (!newFlashcard.question || !newFlashcard.answer) {
        toast({
          variant: "destructive",
          title: "Question and answer are required",
          description: "Please enter text for both sides of the flashcard.",
        })
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("flashcards")
        .insert({
          category_id: newFlashcard.category_id,
          question: newFlashcard.question.trim(),
          answer: newFlashcard.answer.trim(),
          image_url: newFlashcard.image_url || null,
          audio_url: newFlashcard.audio_url || null,
          difficulty: newFlashcard.difficulty || 1,
          user_id: user.id,
        })
        .select(`
          *,
          category:category_id(*)
        `)

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add flashcard",
          description: error.message,
        })
        return
      }

      setFlashcards([data[0], ...flashcards])
      setNewFlashcard({
        category_id: "",
        question: "",
        answer: "",
        image_url: "",
        audio_url: "",
        difficulty: 1,
      })
      setIsAddDialogOpen(false)
      setActiveTab("front")

      toast({
        title: "Flashcard added",
        description: "Your new flashcard has been created.",
      })
    } catch (error) {
      console.error("Error in handleAddFlashcard:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  const handleEditFlashcard = async () => {
    try {
      if (!editFlashcard) return

      if (!editFlashcard.category_id) {
        toast({
          variant: "destructive",
          title: "Category is required",
          description: "Please select a category for the flashcard.",
        })
        return
      }

      if (!editFlashcard.question || !editFlashcard.answer) {
        toast({
          variant: "destructive",
          title: "Question and answer are required",
          description: "Please enter text for both sides of the flashcard.",
        })
        return
      }

      const { data, error } = await supabase
        .from("flashcards")
        .update({
          category_id: editFlashcard.category_id,
          question: editFlashcard.question.trim(),
          answer: editFlashcard.answer.trim(),
          image_url: editFlashcard.image_url || null,
          audio_url: editFlashcard.audio_url || null,
          difficulty: editFlashcard.difficulty || 1,
        })
        .eq("id", editFlashcard.id)
        .select(`
          *,
          category:category_id(*)
        `)

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update flashcard",
          description: error.message,
        })
        return
      }

      setFlashcards(flashcards.map((card) => (card.id === editFlashcard.id ? data[0] : card)))
      setEditFlashcard(null)
      setIsEditDialogOpen(false)
      setEditActiveTab("front")

      toast({
        title: "Flashcard updated",
        description: "Your flashcard has been updated.",
      })
    } catch (error) {
      console.error("Error in handleEditFlashcard:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  const handleDeleteFlashcard = async () => {
    try {
      if (!flashcardToDelete) return

      const { error } = await supabase.from("flashcards").delete().eq("id", flashcardToDelete.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to delete flashcard",
          description: error.message,
        })
        return
      }

      setFlashcards(flashcards.filter((card) => card.id !== flashcardToDelete.id))
      setFlashcardToDelete(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Flashcard deleted",
        description: "Your flashcard has been deleted.",
      })
    } catch (error) {
      console.error("Error in handleDeleteFlashcard:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  const handleFileUpload = async (file: File, type: "image" | "audio") => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      // Use the bucket name
      const bucketName = "flashcard-media"

      // Check if the file is too large (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
        })
        return null
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `${type}s/${fileName}`

      // Try to upload directly without checking if bucket exists
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)

        // Provide more detailed error message
        if (uploadError.message.includes("bucket") || uploadError.message.includes("not found")) {
          toast({
            variant: "destructive",
            title: "Storage bucket error",
            description:
              "There's an issue with the 'flashcard-media' bucket. Please check bucket policies in your Supabase dashboard.",
          })
        } else if (uploadError.message.includes("permission") || uploadError.message.includes("access")) {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description: "You don't have permission to upload to this bucket. Check bucket policies in Supabase.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: uploadError.message,
          })
        }
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error in handleFileUpload:", error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "An error occurred during upload.",
      })
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await handleFileUpload(file, "image")
    if (!url) return

    if (isEdit) {
      setEditFlashcard((prev) => (prev ? { ...prev, image_url: url } : null))
    } else {
      setNewFlashcard((prev) => ({ ...prev, image_url: url }))
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await handleFileUpload(file, "audio")
    if (!url) return

    if (isEdit) {
      setEditFlashcard((prev) => (prev ? { ...prev, audio_url: url } : null))
    } else {
      setNewFlashcard((prev) => ({ ...prev, audio_url: url }))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Flashcard</DialogTitle>
              <DialogDescription>Create a new flashcard with text and multimedia content.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newFlashcard.category_id}
                    onValueChange={(value) => setNewFlashcard({ ...newFlashcard, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="no-categories" disabled>
                          No categories available
                        </SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">You need to create a category first.</p>
                  )}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="front">Front Side</TabsTrigger>
                  <TabsTrigger value="back">Back Side</TabsTrigger>
                </TabsList>
                <TabsContent value="front" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={newFlashcard.question}
                      onChange={(e) => setNewFlashcard({ ...newFlashcard, question: e.target.value })}
                      placeholder="Enter the question for the front side"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="front-image" className="block mb-2">
                        Image
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="front-image"
                          className="cursor-pointer flex items-center justify-center h-10 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Upload
                        </Label>
                        <Input
                          id="front-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e)}
                        />
                      </div>
                      {newFlashcard.image_url && (
                        <div className="mt-2">
                          <img
                            src={newFlashcard.image_url || "/placeholder.svg"}
                            alt="Front side"
                            className="max-h-20 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="front-audio" className="block mb-2">
                        Audio
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="front-audio"
                          className="cursor-pointer flex items-center justify-center h-10 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
                        >
                          <FileAudio className="h-4 w-4 mr-2" />
                          Upload
                        </Label>
                        <Input
                          id="front-audio"
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => handleAudioUpload(e)}
                        />
                      </div>
                      {newFlashcard.audio_url && (
                        <div className="mt-2">
                          <audio controls className="w-full h-8">
                            <source src={newFlashcard.audio_url} />
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="back" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      value={newFlashcard.answer}
                      onChange={(e) => setNewFlashcard({ ...newFlashcard, answer: e.target.value })}
                      placeholder="Enter the answer for the back side"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                    <Select
                      value={String(newFlashcard.difficulty)}
                      onValueChange={(value) =>
                        setNewFlashcard({ ...newFlashcard, difficulty: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Easy</SelectItem>
                        <SelectItem value="2">2 - Easy</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Hard</SelectItem>
                        <SelectItem value="5">5 - Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFlashcard} disabled={categories.length === 0}>
                Add Flashcard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Label htmlFor="category-filter" className="block mb-2">
          Filter by Category
        </Label>
        <div className="flex items-center gap-4">
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) => setSelectedCategoryId(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>No Flashcards Yet</CardTitle>
            <CardDescription>Create your first flashcard to start learning.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setIsAddDialogOpen(true)} disabled={categories.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{flashcard.question}</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full truncate max-w-[120px]">
                    {flashcard.category?.name}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-2">
                  {flashcard.image_url && (
                    <img
                      src={flashcard.image_url || "/placeholder.svg"}
                      alt="Flashcard image"
                      className="h-32 object-cover rounded-md"
                    />
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">Answer: {flashcard.answer}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditFlashcard(flashcard)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setFlashcardToDelete(flashcard)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>Update your flashcard content.</DialogDescription>
          </DialogHeader>
          {editFlashcard && (
            <div className="py-4">
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editFlashcard.category_id}
                    onValueChange={(value) => setEditFlashcard({ ...editFlashcard, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={editActiveTab} onValueChange={setEditActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="front">Front Side</TabsTrigger>
                  <TabsTrigger value="back">Back Side</TabsTrigger>
                </TabsList>
                <TabsContent value="front" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-question">Question</Label>
                    <Textarea
                      id="edit-question"
                      value={editFlashcard.question}
                      onChange={(e) => setEditFlashcard({ ...editFlashcard, question: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-image" className="block mb-2">
                        Image
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="edit-image"
                          className="cursor-pointer flex items-center justify-center h-10 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Upload
                        </Label>
                        <Input
                          id="edit-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, true)}
                        />
                      </div>
                      {editFlashcard.image_url && (
                        <div className="mt-2">
                          <img
                            src={editFlashcard.image_url || "/placeholder.svg"}
                            alt="Front side"
                            className="max-h-20 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="edit-audio" className="block mb-2">
                        Audio
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="edit-audio"
                          className="cursor-pointer flex items-center justify-center h-10 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
                        >
                          <FileAudio className="h-4 w-4 mr-2" />
                          Upload
                        </Label>
                        <Input
                          id="edit-audio"
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => handleAudioUpload(e, true)}
                        />
                      </div>
                      {editFlashcard.audio_url && (
                        <div className="mt-2">
                          <audio controls className="w-full h-8">
                            <source src={editFlashcard.audio_url} />
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="back" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-answer">Answer</Label>
                    <Textarea
                      id="edit-answer"
                      value={editFlashcard.answer}
                      onChange={(e) => setEditFlashcard({ ...editFlashcard, answer: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-difficulty">Difficulty (1-5)</Label>
                    <Select
                      value={String(editFlashcard.difficulty)}
                      onValueChange={(value) =>
                        setEditFlashcard({ ...editFlashcard, difficulty: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Easy</SelectItem>
                        <SelectItem value="2">2 - Easy</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Hard</SelectItem>
                        <SelectItem value="5">5 - Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFlashcard}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flashcard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {flashcardToDelete && (
            <div className="py-4">
              <p className="font-medium">{flashcardToDelete.question}</p>
              <p className="text-sm text-muted-foreground mt-1">{flashcardToDelete.answer}</p>
              <p className="text-sm text-muted-foreground mt-1">Category: {flashcardToDelete.category?.name}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFlashcard}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

