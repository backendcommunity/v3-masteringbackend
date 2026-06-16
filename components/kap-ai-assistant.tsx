"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Plus,
  History,
  ChevronRight,
  Bot,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  mockConversations,
  suggestedQuestions,
  kapPersonality,
  type KapConversation,
  type KapMessage,
  type KapSuggestedQuestion,
} from "@/lib/kap-ai-data";

interface KapAIAssistantProps {
  onNavigate?: (path: string) => void;
}

export function KapAIAssistant({ onNavigate }: KapAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    "chat" | "conversations" | "new"
  >("new");
  const [currentConversation, setCurrentConversation] =
    useState<KapConversation | null>(null);
  const [conversations, setConversations] =
    useState<KapConversation[]>(mockConversations);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentView === "chat") {
      scrollToBottom();
    }
  }, [currentConversation?.messages, currentView]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, currentView]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: KapMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    // Create new conversation if none exists
    if (!currentConversation) {
      const newConversation: KapConversation = {
        id: Date.now().toString(),
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
        category: "general",
      };
      setCurrentConversation(newConversation);
      setConversations((prev) => [newConversation, ...prev]);
    } else {
      // Add to existing conversation
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(updatedConversation);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
    }

    setMessage("");
    setIsTyping(true);
    setCurrentView("chat");

    // Simulate Kap's response
    setTimeout(() => {
      const kapResponse = generateKapResponse(content);
      const kapMessage: KapMessage = {
        id: (Date.now() + 1).toString(),
        content: kapResponse,
        sender: "kap",
        timestamp: new Date(),
      };

      setCurrentConversation((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          messages: [...prev.messages, kapMessage],
          updatedAt: new Date(),
        };
        setConversations((convs) =>
          convs.map((conv) => (conv.id === updated.id ? updated : conv))
        );
        return updated;
      });
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateKapResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Navigation help
    if (
      lowerMessage.includes("navigate") ||
      lowerMessage.includes("find") ||
      lowerMessage.includes("where")
    ) {
      if (lowerMessage.includes("course")) {
        return `I can help you navigate to the courses section! 🎓\n\nYou can find all our courses by:\n• Clicking "Courses" in the sidebar\n• Or I can take you there directly: [View Courses](/courses)\n\nWe have courses in Node.js, Python, Database Design, System Architecture, and more. What specific technology are you interested in learning?`;
      }
      if (lowerMessage.includes("interview")) {
        return `Great! The interview preparation section is one of our most popular features. 💼\n\nHere's how to access it:\n• Click "Interviews" in the left sidebar\n• Or go directly: [Interview Prep](/interviews)\n\nYou'll find:\n🧠 Algorithm challenges\n💼 Project-based interviews\n🎯 Mock interview sessions\n📊 Performance analytics\n\nWhich type of interview prep interests you most?`;
      }
      if (lowerMessage.includes("project")) {
        return `I'll help you find the projects section! 🚀\n\nAccess your projects via:\n• "Projects" in the sidebar\n• Direct link: [My Projects](/projects)\n\nOur projects include:\n• Guided real-world applications\n• Portfolio-worthy code\n• Code review and feedback\n• Deployment assistance\n\nAre you looking to start a new project or continue an existing one?`;
      }
    }

    // Learning help
    if (
      lowerMessage.includes("learn") ||
      lowerMessage.includes("start") ||
      lowerMessage.includes("begin")
    ) {
      return `Welcome to your learning journey! 🌟\n\nAs a Level 9 Backend Engineer, I recommend this path:\n\n**1. Choose Your Track**\n• Node.js for JavaScript developers\n• Python for versatility\n• Java for enterprise development\n\n**2. Start with Fundamentals**\n• Complete the basics course\n• Practice with hands-on exercises\n\n**3. Build Projects**\n• Apply your knowledge\n• Build a portfolio\n\nWhat's your current experience level? I can create a personalized learning plan for you!`;
    }

    // Technical questions
    if (
      lowerMessage.includes("api") ||
      lowerMessage.includes("rest") ||
      lowerMessage.includes("graphql")
    ) {
      return `Excellent question about APIs! 🔧\n\nHere are the key principles I follow for API design:\n\n**RESTful Design:**\n• Use proper HTTP methods (GET, POST, PUT, DELETE)\n• Implement consistent URL patterns\n• Return appropriate status codes\n\n**Best Practices:**\n• Version your APIs (/v1/, /v2/)\n• Implement proper authentication\n• Add rate limiting and caching\n• Document everything with OpenAPI/Swagger\n\nWe have a comprehensive API Design course that covers all these topics. Would you like me to show you where to find it?`;
    }

    if (
      lowerMessage.includes("database") ||
      lowerMessage.includes("sql") ||
      lowerMessage.includes("nosql")
    ) {
      return `Database design is one of my specialties! 🗄️\n\n**Key Principles:**\n• Start with proper normalization (3NF)\n• Design for your query patterns\n• Plan for scalability from day one\n\n**Technology Choices:**\n• **SQL**: PostgreSQL, MySQL for ACID compliance\n• **NoSQL**: MongoDB for flexibility, Redis for caching\n• **NewSQL**: For distributed systems\n\n**Performance Tips:**\n• Index strategically\n• Monitor query performance\n• Consider read replicas\n\nOur Database Mastery course covers everything from basics to advanced optimization. Interested?`;
    }

    // Platform features
    if (
      lowerMessage.includes("certificate") ||
      lowerMessage.includes("completion")
    ) {
      return `Certificates are a great way to showcase your skills! 🏆\n\nHere's how our certification system works:\n\n**Earning Certificates:**\n• Complete all course modules\n• Pass quizzes with 80%+ score\n• Submit required projects\n• Get code reviewed\n\n**Accessing Certificates:**\n• Go to any completed course\n• Click "View Certificate"\n• Download as PDF or share on LinkedIn\n\nYour certificates are also displayed on your profile. Want me to show you your current progress?`;
    }

    // Default helpful response
    return `Thanks for your question! 😊\n\nAs your Level 9 Backend Engineer assistant, I'm here to help with:\n\n🎓 **Learning**: Course recommendations, study plans\n🧭 **Navigation**: Finding features, accessing content\n⚡ **Technical**: Backend development, best practices\n📊 **Platform**: Features, progress tracking\n\nCould you be more specific about what you'd like help with? I'm here to make your MasteringBackend experience amazing!`;
  };

  const handleSuggestedQuestion = (question: KapSuggestedQuestion) => {
    handleSendMessage(question.question);
  };

  const handleConversationSelect = (conversation: KapConversation) => {
    setCurrentConversation(conversation);
    setCurrentView("chat");
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setCurrentView("new");
    setMessage("");
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredSuggestions = suggestedQuestions.filter((q) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 z-50 ${
          isOpen ? "scale-0" : "scale-100 hover:scale-110"
        } bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-2 border-primary/20`}
        size="icon"
      >
        <div className="relative">
          <Bot className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 border-2 border-primary/20 bg-card">
          {/* Header */}
          <CardHeader className="pb-3 bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    K
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {kapPersonality.name}
                  </CardTitle>
                  <p className="text-xs text-white/80">
                    {kapPersonality.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {currentView !== "conversations" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setCurrentView("conversations")}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
                {currentView !== "new" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleNewConversation}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
            {/* Conversations List View */}
            {currentView === "conversations" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {filteredConversations.map((conversation) => (
                      <Card
                        key={conversation.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {conversation.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {conversation.messages.length} messages
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {conversation.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(conversation.updatedAt)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* New Conversation View */}
            {currentView === "new" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Hi! I'm Kap 👋</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Level 9 Backend Engineer assistant. How can I help you
                    today?
                  </p>
                </div>

                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suggestions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Suggested Questions
                    </h4>
                    {filteredSuggestions.map((suggestion) => (
                      <Card
                        key={suggestion.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
                        onClick={() => handleSuggestedQuestion(suggestion)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{suggestion.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {suggestion.question}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {suggestion.category}
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      placeholder="Ask me anything..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage(message)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSendMessage(message)}
                      disabled={!message.trim()}
                      size="icon"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat View */}
            {currentView === "chat" && currentConversation && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm truncate">
                    {currentConversation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentConversation.messages.length} messages •{" "}
                    {formatTime(currentConversation.updatedAt)}
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {msg.sender === "kap" && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  K
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.sender === "user"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {msg.sender === "user" && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                  U
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                K
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              />
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage(message)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSendMessage(message)}
                      disabled={!message.trim() || isTyping}
                      size="icon"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
