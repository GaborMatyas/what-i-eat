'use client'

import { useState } from 'react'
import { createRecipe, updateRecipe } from '@/app/actions/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  protein: number
  fat: number
  carbs: number
  kcal: number
}

interface RecipeIngredient {
  ingredientId: string
  weight: number
}

interface RecipeFormProps {
  recipe?: {
    id: string
    name: string
    description: string | null
    cookedWeight: number | null
    ingredients: {
      ingredientId: string
      weight: number
    }[]
  }
  availableIngredients: Ingredient[]
  mode: 'create' | 'edit'
}

export function RecipeForm({
  recipe,
  availableIngredients,
  mode,
}: RecipeFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(
    recipe?.ingredients || [{ ingredientId: '', weight: 0 }]
  )

  // Calculate total macros
  const calculateMacros = () => {
    let totalRawWeight = 0
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalKcal = 0

    recipeIngredients.forEach((ri) => {
      const ingredient = availableIngredients.find((i) => i.id === ri.ingredientId)
      if (ingredient && ri.weight > 0) {
        totalRawWeight += ri.weight
        totalProtein += (ingredient.protein / 100) * ri.weight
        totalFat += (ingredient.fat / 100) * ri.weight
        totalCarbs += (ingredient.carbs / 100) * ri.weight
        totalKcal += (ingredient.kcal / 100) * ri.weight
      }
    })

    return { totalRawWeight, totalProtein, totalFat, totalCarbs, totalKcal }
  }

  const macros = calculateMacros()

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', weight: 0 }])
  }

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (
    index: number,
    field: 'ingredientId' | 'weight',
    value: string | number
  ) => {
    const updated = [...recipeIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setRecipeIngredients(updated)
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    // Validate at least one ingredient
    if (recipeIngredients.length === 0 || !recipeIngredients.some(ri => ri.ingredientId && ri.weight > 0)) {
      setError('Please add at least one ingredient with a weight')
      setIsSubmitting(false)
      return
    }

    const result =
      mode === 'edit' && recipe
        ? await updateRecipe(recipe.id, formData)
        : await createRecipe(formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? 'Edit Recipe' : 'Create New Recipe'}
        </CardTitle>
        <CardDescription>
          Select ingredients and specify their raw weights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Recipe Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Grilled Chicken with Rice"
              defaultValue={recipe?.name}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Brief description of the recipe"
              defaultValue={recipe?.description || ''}
              disabled={isSubmitting}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Ingredients <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-3">
              {recipeIngredients.map((recipeIngredient, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <select
                      name={`ingredients[${index}][ingredientId]`}
                      value={recipeIngredient.ingredientId}
                      onChange={(e) =>
                        updateIngredient(index, 'ingredientId', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select ingredient...</option>
                      {availableIngredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      name={`ingredients[${index}][weight]`}
                      value={recipeIngredient.weight || ''}
                      onChange={(e) =>
                        updateIngredient(
                          index,
                          'weight',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Weight (g)"
                      step="0.1"
                      min="0"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    disabled={isSubmitting || recipeIngredients.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {recipeIngredients.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No ingredients added. Click &quot;Add Ingredient&quot; to get started.
              </p>
            )}
          </div>

          {/* Calculated Macros (Raw) */}
          {macros.totalRawWeight > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-sm mb-2">
                Total (Raw Ingredients)
              </h3>
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Weight</p>
                  <p className="font-bold">{macros.totalRawWeight.toFixed(0)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Protein</p>
                  <p className="font-bold">{macros.totalProtein.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Fat</p>
                  <p className="font-bold">{macros.totalFat.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Carbs</p>
                  <p className="font-bold">{macros.totalCarbs.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-gray-600">Calories</p>
                  <p className="font-bold">{macros.totalKcal.toFixed(0)} kcal</p>
                </div>
              </div>
            </div>
          )}

          {/* Cooked Weight */}
          <div className="space-y-2">
            <Label htmlFor="cookedWeight">
              Cooked Weight (optional)
            </Label>
            <Input
              id="cookedWeight"
              name="cookedWeight"
              type="number"
              step="0.1"
              min="0"
              placeholder="Total weight after cooking (grams)"
              defaultValue={recipe?.cookedWeight || ''}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              If you enter cooked weight, the app will calculate macros per 100g
              of cooked food. Leave empty to use raw weight basis.
            </p>
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
                ? 'Update Recipe'
                : 'Create Recipe'}
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
