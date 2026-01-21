'use client'

import { useState } from 'react'
import { createIngredient, updateIngredient } from '@/app/actions/ingredients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface IngredientFormProps {
  ingredient?: {
    id: string
    name: string
    protein: number
    fat: number
    carbs: number
    kcal: number
  }
  mode: 'create' | 'edit'
}

export function IngredientForm({ ingredient, mode }: IngredientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    const result =
      mode === 'edit' && ingredient
        ? await updateIngredient(ingredient.id, formData)
        : await createIngredient(formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? 'Edit Ingredient' : 'Add New Ingredient'}
        </CardTitle>
        <CardDescription>
          Enter nutritional information per 100g of raw ingredient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Ingredient Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Chicken Breast, Brown Rice, Broccoli"
              defaultValue={ingredient?.name}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">
                Protein (g/100g) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="protein"
                name="protein"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                defaultValue={ingredient?.protein}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">
                Fat (g/100g) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fat"
                name="fat"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                defaultValue={ingredient?.fat}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">
                Carbs (g/100g) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="carbs"
                name="carbs"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                defaultValue={ingredient?.carbs}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kcal">
                Calories (kcal/100g) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="kcal"
                name="kcal"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                defaultValue={ingredient?.kcal}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : mode === 'edit'
                ? 'Update Ingredient'
                : 'Add Ingredient'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
