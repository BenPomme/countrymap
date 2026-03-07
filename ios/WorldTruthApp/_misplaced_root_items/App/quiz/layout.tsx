import type { ReactNode } from 'react'
import QuizLayout from '../../src/app/quiz/layout'

export default function AppQuizLayout({ children }: { children: ReactNode }) {
  return <QuizLayout>{children}</QuizLayout>
}
