"use client"

import { useSearchParams } from 'next/navigation'
import DSAQuizEngine from '@/components/DSAQuizEngine'

export default function QuizPage() {
  const searchParams = useSearchParams()
  const conceptId = searchParams.get('conceptId')

  return (
    <div className="w-full h-full">
      <DSAQuizEngine conceptId={conceptId} />
    </div>
  )
} 