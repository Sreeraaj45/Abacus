import type { Level } from '../types';

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface GeneratedExercise {
  num1: number;
  num2: number;
  operation: Operation;
  correctAnswer: number;
  display: string;
}

const operationSymbols: Record<Operation, string> = {
  addition: '+',
  subtraction: '-',
  multiplication: '×',
  division: '÷',
};

export function generateExercise(level: Level): GeneratedExercise {
  const operations = getOperationsForLevel(level.level_order);
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const { min, max } = getNumberRange(level.level_order, operation);

  let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
  let num2 = Math.floor(Math.random() * (max - min + 1)) + min;
  let correctAnswer: number;

  // Ensure subtraction results are non-negative for lower levels
  if (operation === 'subtraction' && num1 < num2) {
    [num1, num2] = [num2, num1];
  }

  // For division, ensure clean division for lower levels
  if (operation === 'division') {
    correctAnswer = Math.floor(Math.random() * 12) + 1;
    num2 = correctAnswer;
    num1 = num2 * Math.floor(Math.random() * 12 + 1);
  }

  switch (operation) {
    case 'addition':
      correctAnswer = num1 + num2;
      break;
    case 'subtraction':
      correctAnswer = num1 - num2;
      break;
    case 'multiplication':
      correctAnswer = num1 * num2;
      break;
    case 'division':
      correctAnswer = Math.floor(num1 / num2);
      break;
  }

  return {
    num1,
    num2,
    operation,
    correctAnswer,
    display: `${num1} ${operationSymbols[operation]} ${num2}`,
  };
}

function getOperationsForLevel(levelOrder: number): Operation[] {
  if (levelOrder <= 2) return ['addition'];
  if (levelOrder <= 4) return ['addition', 'subtraction'];
  if (levelOrder <= 6) return ['addition', 'subtraction', 'multiplication'];
  return ['addition', 'subtraction', 'multiplication', 'division'];
}

function getNumberRange(levelOrder: number, operation: Operation): { min: number; max: number } {
  // Base ranges for single digit
  if (levelOrder <= 2) {
    return { min: 1, max: 9 };
  }

  // Double digit
  if (levelOrder <= 4) {
    if (operation === 'multiplication' || operation === 'division') {
      return { min: 1, max: 9 };
    }
    return { min: 10, max: 99 };
  }

  // Triple digit
  if (levelOrder <= 6) {
    if (operation === 'multiplication' || operation === 'division') {
      return { min: 2, max: 12 };
    }
    return { min: 100, max: 999 };
  }

  // Advanced
  if (operation === 'multiplication' || operation === 'division') {
    return { min: 2, max: 15 };
  }
  return { min: 100, max: 999 };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateAverageTime(attempts: { time_taken_seconds: number }[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);
  return Math.round(total / attempts.length);
}
