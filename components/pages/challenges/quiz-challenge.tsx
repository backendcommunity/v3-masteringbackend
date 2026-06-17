"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, FileQuestion, Clock } from "lucide-react"
import type { QuizChallenge, QuizQuestion } from "@/lib/lands-data"
import { DEFAULT_QUIZ_PASSING_SCORE } from "@/lib/constants"

interface QuizChallengeComponentProps {
  challenge: QuizChallenge
  onComplete: () => void
}

export function QuizChallengeComponent({ challenge, onComplete }: QuizChallengeComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit || 600) // 10 minutes default
  const [quizStarted, setQuizStarted] = useState(false)

  // Mock quiz questions since they're not in the data
  const mockQuestions: QuizQuestion[] = [
    {
      id: "q1",
      question: "What is the correct way to declare a variable in JavaScript?",
      type: "multiple-choice",
      options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
      correctAnswer: "var myVar;",
      explanation: "In JavaScript, variables can be declared using 'var', 'let', or 'const' keywords.",
      points: 100,
    },
    {
      id: "q2",
      question: "JavaScript is a statically typed language.",
      type: "true-false",
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "JavaScript is a dynamically typed language, meaning variable types are determined at runtime.",
      points: 100,
    },
    {
      id: "q3",
      question: "What does 'typeof null' return in JavaScript?",
      type: "fill-blank",
      correctAnswer: "object",
      explanation: "This is a well-known quirk in JavaScript where 'typeof null' returns 'object' instead of 'null'.",
      points: 150,
    },
  ]

  const questions = mockQuestions
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const startQuiz = () => {
    setQuizStarted(true)
    // Start timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          submitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      submitQuiz()
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const submitQuiz = () => {
    setShowResults(true)

    // Calculate score
    let correctAnswers = 0
    let totalPoints = 0

    questions.forEach((question) => {
      const userAnswer = answers[question.id]
      if (userAnswer === question.correctAnswer) {
        correctAnswers++
        totalPoints += question.points
      }
    })

    const percentage = (correctAnswers / questions.length) * 100

    if (percentage >= (challenge.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE)) {
      onComplete()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Quiz Challenge
          </CardTitle>
          <CardDescription>Test your knowledge with {questions.length} questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
              <div className="text-sm text-muted-foreground">Time Limit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{challenge.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE}%</div>
              <div className="text-sm text-muted-foreground">Passing Score</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Quiz Rules:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You have {formatTime(timeLeft)} to complete all questions</li>
              <li>• You need {challenge.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE}% to pass</li>
              <li>• You can navigate between questions</li>
              <li>• Your progress is saved automatically</li>
            </ul>
          </div>

          <Button onClick={startQuiz} className="w-full">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showResults) {
    const correctAnswers = questions.filter((q) => answers[q.id] === q.correctAnswer).length
    const percentage = (correctAnswers / questions.length) * 100
    const passed = percentage >= (challenge.passingScore ?? DEFAULT_QUIZ_PASSING_SCORE)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${passed ? "text-green-500" : "text-red-500"}`}>
              {percentage.toFixed(0)}%
            </div>
            <div className="text-muted-foreground">
              {correctAnswers} out of {questions.length} correct
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="mt-2">
              {passed ? "Passed" : "Failed"}
            </Badge>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Question Review:</h4>
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = userAnswer === question.correctAnswer

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  <p className="font-medium mb-2">{question.question}</p>

                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Your answer:</strong>
                      <span className={isCorrect ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                        {userAnswer || "Not answered"}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <strong>Correct answer:</strong>
                        <span className="text-green-600 ml-1">{question.correctAnswer}</span>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!passed && (
            <Button
              onClick={() => {
                setShowResults(false)
                setQuizStarted(false)
                setCurrentQuestionIndex(0)
                setAnswers({})
                setTimeLeft(challenge.timeLimit || 600)
              }}
              className="w-full"
            >
              Retake Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>

          {currentQuestion.type === "multiple-choice" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "true-false" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false">False</Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === "fill-blank" && (
            <Input
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={previousQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </Button>

          <Button onClick={nextQuestion}>
            {currentQuestionIndex === questions.length - 1 ? "Submit Quiz" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
