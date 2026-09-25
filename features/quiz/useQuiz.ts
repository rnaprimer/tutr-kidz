import { useState, useCallback, useMemo } from 'react';
import { QuizQuestion, QuizState } from '../../types/quiz';

export interface UseQuizReturn extends QuizState {
  currentQuestion: QuizQuestion | null;
  totalQuestions: number;
  progressText: string;
  isLastQuestion: boolean;
  selectOption: (optionId: string) => void;
  nextQuestion: () => boolean; // returns true if finished, false if advanced
  resetQuiz: () => void;
}

export function useQuiz(questions: readonly QuizQuestion[]): UseQuizReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < totalQuestions) {
      return questions[currentIndex];
    }
    return null;
  }, [questions, currentIndex]);

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const progressText = useMemo(() => {
    if (totalQuestions === 0) return '0 / 0';
    return `${Math.min(currentIndex + 1, totalQuestions)} / ${totalQuestions}`;
  }, [currentIndex, totalQuestions]);

  const selectOption = useCallback(
    (optionId: string) => {
      // Prevent multiple submissions, changes after locking, or clicking when no question
      if (isAnswered || !currentQuestion) {
        return;
      }

      const correct = optionId === currentQuestion.correctOptionId;
      setSelectedOptionId(optionId);
      setIsAnswered(true);
      setIsCorrect(correct);

      if (correct) {
        setScore((prev) => prev + 1);
      }
    },
    [isAnswered, currentQuestion]
  );

  const nextQuestion = useCallback((): boolean => {
    // Cannot proceed before answering
    if (!isAnswered) {
      return false;
    }

    if (isLastQuestion) {
      setIsCompleted(true);
      return true;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    return false;
  }, [isAnswered, isLastQuestion]);

  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setScore(0);
    setIsCompleted(false);
  }, []);

  return {
    currentIndex,
    selectedOptionId,
    isAnswered,
    isCorrect,
    score,
    isCompleted,
    currentQuestion,
    totalQuestions,
    progressText,
    isLastQuestion,
    selectOption,
    nextQuestion,
    resetQuiz,
  };
}
