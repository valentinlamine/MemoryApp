"use client"

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
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Plus, Trash, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function CategoriesPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [editCategory, setEditCategory] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        loadCategories()
      }
    }

    checkUser()
  }, [supabase, router])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading categories:", error)
        setError(error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error("Error in loadCategories:", error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        toast({
          variant: "destructive",
          title: "Name is required",
          description: "Please enter a name for the category.",
        })
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          user_id: user.id,
        })
        .select()

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add category",
          description: error.message,
        })
        return
      }

      setCategories([data[0], ...categories])
      setNewCategory({ name: "", description: "" })
      setIsAddDialogOpen(false)

      toast({
        title: "Category added",
        description: "Your new category has been created.",
      })
    } catch (error) {
      console.error("Error in handleAddCategory:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  const handleEditCategory = async () => {
    try {
      if (!editCategory.name.trim()) {
        toast({
          variant: "destructive",
          title: "Name is required",
          description: "Please enter a name for the category.",
        })
        return
      }

      const { data, error } = await supabase
        .from("categories")
        .update({
          name: editCategory.name.trim(),
          description: editCategory.description.trim(),
        })
        .eq("id", editCategory.id)
        .select()

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update category",
          description: error.message,
        })
        return
      }

      setCategories(categories.map((cat) => (cat.id === editCategory.id ? data[0] : cat)))
      setEditCategory(null)
      setIsEditDialogOpen(false)

      toast({
        title: "Category updated",
        description: "Your category has been updated.",
      })
    } catch (error) {
      console.error("Error in handleEditCategory:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  const handleDeleteCategory = async () => {
    try {
      if (!categoryToDelete) return

      const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to delete category",
          description: error.message,
        })
        return
      }

      setCategories(categories.filter((cat) => cat.id !== categoryToDelete.id))
      setCategoryToDelete(null)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Category deleted",
        description: "Your category has been deleted.",
      })
    } catch (error) {
      console.error("Error in handleDeleteCategory:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later.",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
        </div>
        <Card className="text-center p-8">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Database Error</CardTitle>
            <CardDescription>
              {error.message.includes("does not exist")
                ? "The database tables have not been set up yet."
                : "An error occurred while loading categories."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {error.message.includes("does not exist")
                ? "You need to set up the database schema before using this feature."
                : error.message}
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/setup">Go to Setup Page</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Create a new category to organize your flashcards.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Mathematics, Languages, Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Describe what this category is about"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>No Categories Yet</CardTitle>
            <CardDescription>Create your first category to start organizing your flashcards.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditCategory(category)
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
                    setCategoryToDelete(category)
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update your category details.</DialogDescription>
          </DialogHeader>
          {editCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editCategory.description || ""}
                  onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {categoryToDelete && (
            <div className="py-4">
              <p className="font-medium">{categoryToDelete.name}</p>
              {categoryToDelete.description && (
                <p className="text-sm text-muted-foreground mt-1">{categoryToDelete.description}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

