'use client'

import { useState } from 'react'
import { updateRecipeCookedWeight } from '@/app/actions/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UpdateCookedWeightFormProps {
  recipeId: string
  currentWeight?: number | null
}

export function UpdateCookedWeightForm({
  recipeId,
  currentWeight,
}: UpdateCookedWeightFormProps) {
  const [weight, setWeight] = useState(currentWeight?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const weightValue = parseFloat(weight)

    if (isNaN(weightValue) || weightValue <= 0) {
      setError('Please enter a valid weight')
      setIsSubmitting(false)
      return
    }

    const result = await updateRecipeCookedWeight(recipeId, weightValue)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setSuccess(true)
      setIsSubmitting(false)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cookedWeight">
          {currentWeight ? 'Update' : 'Set'} Cooked Weight (grams)
        </Label>
        <div className="flex gap-2">
          <Input
            id="cookedWeight"
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 650"
            disabled={isSubmitting}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          Cooked weight updated successfully!
        </div>
      )}
    </form>
  )
}
