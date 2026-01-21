'use client'

import { useState } from 'react'
import { createDayPlan, updateDayPlan } from '@/app/actions/day-plans'
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

interface Recipe {
  id: string
  name: string
  cookedWeight: number | null
  ingredients: {
    weight: number
    ingredient: {
      protein: number
      fat: number
      carbs: number
      kcal: number
    }
  }[]
}

interface Meal {
  recipeId: string
  portionSize: number
}

interface DayPlanFormProps {
  dayPlan?: {
    id: string
    name: string
    description: string | null
    meals: {
      recipeId: string
      portionSize: number
    }[]
  }
  availableRecipes: Recipe[]
  mode: 'create' | 'edit'
}

export function DayPlanForm({
  dayPlan,
  availableRecipes,
  mode,
}: DayPlanFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [meals, setMeals] = useState<Meal[]>(
    dayPlan?.meals || [{ recipeId: '', portionSize: 0 }]
  )

  // Calculate total macros
  const calculateMacros = () => {
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0
    let totalKcal = 0

    meals.forEach((meal) => {
      const recipe = availableRecipes.find((r) => r.id === meal.recipeId)
      if (recipe && meal.portionSize > 0) {
        // Calculate recipe totals
        let recipeTotalRawWeight = 0
        let recipeProtein = 0
        let recipeFat = 0
        let recipeCarbs = 0
        let recipeKcal = 0

        recipe.ingredients.forEach((recipeIngredient) => {
          const weight = recipeIngredient.weight
          const ingredient = recipeIngredient.ingredient

          recipeTotalRawWeight += weight
          recipeProtein += (ingredient.protein / 100) * weight
          recipeFat += (ingredient.fat / 100) * weight
          recipeCarbs += (ingredient.carbs / 100) * weight
          recipeKcal += (ingredient.kcal / 100) * weight
        })

        // Calculate portion macros based on cooked weight or raw weight
        const baseWeight = recipe.cookedWeight || recipeTotalRawWeight
        const portionRatio = meal.portionSize / baseWeight

        totalProtein += recipeProtein * portionRatio
        totalFat += recipeFat * portionRatio
        totalCarbs += recipeCarbs * portionRatio
        totalKcal += recipeKcal * portionRatio
      }
    })

    return { totalProtein, totalFat, totalCarbs, totalKcal }
  }

  const macros = calculateMacros()

  const addMeal = () => {
    setMeals([...meals, { recipeId: '', portionSize: 0 }])
  }

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  const updateMeal = (
    index: number,
    field: 'recipeId' | 'portionSize',
    value: string | number
  ) => {
    const updated = [...meals]
    updated[index] = { ...updated[index], [field]: value }
    setMeals(updated)
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    // Validate at least one meal
    if (meals.length === 0 || !meals.some(m => m.recipeId && m.portionSize > 0)) {
      setError('Please add at least one meal with a portion size')
      setIsSubmitting(false)
      return
    }

    const result =
      mode === 'edit' && dayPlan
        ? await updateDayPlan(dayPlan.id, formData)
        : await createDayPlan(formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'edit' ? 'Edit Day Plan' : 'Create New Day Plan'}
        </CardTitle>
        <CardDescription>
          Select recipes and specify portion sizes for each meal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Day Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Day Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., High Protein Day, Waffle + Chicken + Potato"
              defaultValue={dayPlan?.name}
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
              placeholder="Brief description of this day plan"
              defaultValue={dayPlan?.description || ''}
              disabled={isSubmitting}
            />
          </div>

          {/* Meals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Meals <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMeal}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Meal
              </Button>
            </div>

            <div className="space-y-3">
              {meals.map((meal, index) => {
                const recipe = availableRecipes.find((r) => r.id === meal.recipeId)
                let rawWeight = 0
                if (recipe) {
                  recipe.ingredients.forEach((ri) => {
                    rawWeight += ri.weight
                  })
                }
                const cookedWeight = recipe?.cookedWeight

                return (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1 space-y-2">
                      <select
                        name={`meals[${index}][recipeId]`}
                        value={meal.recipeId}
                        onChange={(e) =>
                          updateMeal(index, 'recipeId', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="">Select recipe...</option>
                        {availableRecipes.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </option>
                        ))}
                      </select>
                      {recipe && (
                        <div className="text-xs text-gray-500 px-1">
                          Raw: {rawWeight.toFixed(0)}g
                          {cookedWeight && (
                            <> • Cooked: {cookedWeight.toFixed(0)}g</>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="w-40 space-y-2">
                      <Input
                        type="number"
                        name={`meals[${index}][portionSize]`}
                        value={meal.portionSize || ''}
                        onChange={(e) =>
                          updateMeal(
                            index,
                            'portionSize',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Portion (g)"
                        step="0.1"
                        min="0"
                        required
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500 text-center">
                        {cookedWeight ? 'cooked' : 'raw'} weight
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMeal(index)}
                      disabled={isSubmitting || meals.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {meals.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No meals added. Click &quot;Add Meal&quot; to get started.
              </p>
            )}
          </div>

          {/* Calculated Total Macros */}
          {macros.totalKcal > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-sm mb-3">
                Total Daily Macros
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-blue-600">Protein</p>
                  <p className="font-bold text-blue-900 text-lg">
                    {macros.totalProtein.toFixed(1)}g
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-amber-600">Fat</p>
                  <p className="font-bold text-amber-900 text-lg">
                    {macros.totalFat.toFixed(1)}g
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-green-600">Carbs</p>
                  <p className="font-bold text-green-900 text-lg">
                    {macros.totalCarbs.toFixed(1)}g
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-red-600">Calories</p>
                  <p className="font-bold text-red-900 text-lg">
                    {macros.totalKcal.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                ? 'Update Day Plan'
                : 'Create Day Plan'}
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
