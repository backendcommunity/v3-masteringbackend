"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Video, VideoOff, Mic, MicOff, MessageSquare, Clock, Send, Phone, Settings, User } from "lucide-react"
import { getMockInterviewById, getInterviewQuestions } from "@/lib/mock-interview-data"

interface MockInterviewSessionProps {
  interviewId: string
  onNavigate: (path: string) => void
}

export function MockInterviewSessionPage({ interviewId, onNavigate }: MockInterviewSessionProps) {
  const [interview] = useState(() => getMockInterviewById(interviewId))
  const [questions] = useState(() => getInterviewQuestions())
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes for demo
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "interviewer",
      message:
        "Hello! Welcome to your mock interview. I'm Kap AI, and I'll be conducting your interview today. Are you ready to begin?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [userAnswer, setUserAnswer] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (!interview) {
      onNavigate("/dashboard/mock-interviews")
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleEndInterview()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [interview, onNavigate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    const newMessage = {
      sender: "candidate" as const,
      message: chatMessage,
      timestamp: new Date().toISOString(),
    }

    setChatHistory((prev) => [...prev, newMessage])
    setChatMessage("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        sender: "interviewer" as const,
        message: "Thank you for your question. Let me help you with that...",
        timestamp: new Date().toISOString(),
      }
      setChatHistory((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setUserAnswer("")
    } else {
      handleEndInterview()
    }
  }

  const handleEndInterview = () => {
    onNavigate(`/dashboard/mock-interviews/${interviewId}/results`)
  }

  const handleStartRecording = () => {
    setIsRecording(true)
    // In a real app, this would start actual recording
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // In a real app, this would stop recording and process the answer
  }

  if (!interview) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Interview not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{interview.type.icon}</span>
              <div>
                <h1 className="text-lg font-semibold">{interview.type.title}</h1>
                <p className="text-sm text-muted-foreground">Mock Interview Session</p>
              </div>
            </div>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
            <Button variant="destructive" onClick={handleEndInterview}>
              <Phone className="h-4 w-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Interview Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
                <User className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">Kap AI Interviewer</p>
                <p className="text-sm text-gray-400">Video call in progress</p>
              </div>
            </div>

            {/* User video (small overlay) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg border-2 border-white">
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <User className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">You</p>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <Button
                size="sm"
                variant={isVideoOn ? "default" : "destructive"}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={isAudioOn ? "default" : "destructive"}
                onClick={() => setIsAudioOn(!isAudioOn)}
              >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Question Area */}
          <div className="border-t bg-card p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Question</CardTitle>
                  <Badge variant="outline">{currentQuestion?.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">{currentQuestion?.question}</p>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{currentQuestion?.difficulty}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {currentQuestion?.timeLimit} min suggested
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Answer:</label>
                  <Textarea
                    placeholder="Type your answer here or use voice recording..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                    <Button onClick={handleNextQuestion}>
                      {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with Kap AI
            </h3>
            <p className="text-xs text-muted-foreground">Ask questions anytime during the interview</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.sender === "candidate" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.sender === "candidate" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export both named and default
export const MockInterviewSession = MockInterviewSessionPage
export default MockInterviewSessionPage
