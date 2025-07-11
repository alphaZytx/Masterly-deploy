import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Clock, Lock } from "lucide-react";

export interface QuizQuestion {
  id: number | string;
  question: string;
  options: string[];
  correct?: number;
  explanation?: string;
}

export interface QuizProps {
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in seconds
  testType?: 'concept_quiz' | 'mock_test' | 'course_test' | 'assessment';
  passingScore?: number;
  onSubmit: (score: number, passed: boolean) => void;
  allowRetake?: boolean;
  startDisabled?: boolean;
}

export default function Quiz({
  title,
  questions,
  timeLimit = 600,
  testType = 'concept_quiz',
  passingScore = 70,
  onSubmit,
  allowRetake = true,
  startDisabled = false,
}: QuizProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  const handleAnswer = (idx: number, answerIdx: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[idx] = answerIdx;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.correct !== undefined && selectedAnswers[i] === q.correct) correct++;
    });
    const result = Math.round((correct / questions.length) * 100);
    setScore(result);
    const didPass = result >= passingScore;
    setPassed(didPass);
    setQuizSubmitted(true);
    onSubmit(result, didPass);
  };

  const handleRetake = () => {
    setQuizStarted(false);
    setQuizSubmitted(false);
    setScore(null);
    setPassed(null);
    setSelectedAnswers(new Array(questions.length).fill(-1));
  };

  const getTestTypeInfo = () => {
    switch (testType) {
      case 'concept_quiz':
        return { icon: Target, label: 'Concept Quiz', color: 'text-blue-600' };
      case 'mock_test':
        return { icon: Trophy, label: 'Mock Test', color: 'text-purple-600' };
      case 'course_test':
        return { icon: Target, label: 'Course Test', color: 'text-green-600' };
      case 'assessment':
        return { icon: Target, label: 'Assessment', color: 'text-orange-600' };
      default:
        return { icon: Target, label: 'Quiz', color: 'text-gray-600' };
    }
  };

  const testTypeInfo = getTestTypeInfo();
  const TestTypeIcon = testTypeInfo.icon;

  if (!quizStarted) {
    return (
      <div className="relative">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TestTypeIcon className={`w-6 h-6 ${testTypeInfo.color}`} />
              <CardTitle className="text-2xl">{title}</CardTitle>
            </div>
            <div className="flex items-center justify-center space-x-6 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{Math.floor(timeLimit / 60)} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>{questions.length} questions</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setQuizStarted(true)} size="lg" className="px-8" disabled={startDisabled}>
              Start Quiz
            </Button>
          </CardContent>
        </Card>
        {startDisabled && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex flex-col items-center justify-center z-10 rounded-lg cursor-not-allowed select-none">
            <Lock className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-gray-500 font-semibold">Complete all required steps to unlock the quiz.</span>
          </div>
        )}
      </div>
    );
  }

  if (quizSubmitted && score !== null && passed !== null) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>Score: {score}%</div>
          <div className="mb-4">{passed ? "Congratulations! You passed!" : "You did not pass. Please try again."}</div>
          {allowRetake && (
            <Button onClick={handleRetake}>Retake Quiz</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {questions.map((q, idx) => (
          <div key={q.id} className="mb-6">
            <div className="font-medium mb-2">Q{idx + 1}: {q.question}</div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oidx) => (
                <label key={oidx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q${idx}`}
                    checked={selectedAnswers[idx] === oidx}
                    onChange={() => handleAnswer(idx, oidx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={handleSubmit} className="mt-2">Submit Quiz</Button>
      </CardContent>
    </Card>
  );
} 