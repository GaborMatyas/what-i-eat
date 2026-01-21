'use client'

import { useState } from 'react'
import { duplicateDayPlan } from '@/app/actions/day-plans'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

interface DuplicateDayPlanButtonProps {
  id: string
  name: string
}

export function DuplicateDayPlanButton({
  id,
  name,
}: DuplicateDayPlanButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false)

  async function handleDuplicate() {
    setIsDuplicating(true)
    await duplicateDayPlan(id)
    // Redirect is handled in the action
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDuplicate}
      disabled={isDuplicating}
      title={`Duplicate ${name}`}
    >
      <Copy className="h-4 w-4" />
    </Button>
  )
}
