import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Lightbulb,
  Search,
  Building2,
  MapPin,
  Briefcase
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  companyResults?: CompanyResult[];
}

interface CompanyResult {
  id: number;
  name: string;
  industry: string;
  location: string;
  openPositions: number;
  rating: number;
  isHiringNow: boolean;
  matchScore: number;
}

const CompanySearchAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm here to help you find entry-level job opportunities. I can help you discover companies that hire people with no experience and provide training. Try asking me something like 'Which companies hire general workers?' or 'Show me retail companies in my area'.",
      timestamp: new Date(),
      suggestions: [
        "Companies hiring general workers",
        "Retail jobs with training",
        "Security companies near me",
        "Entry-level jobs with benefits"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(message);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Mock AI responses based on keywords
    if (lowerMessage.includes('general worker') || lowerMessage.includes('general')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: "I found several companies actively hiring general workers with no experience required! Here are the top matches:",
        timestamp: new Date(),
        companyResults: [
          {
            id: 1,
            name: 'Shoprite Holdings',
            industry: 'Retail',
            location: 'Multiple Locations',
            openPositions: 245,
            rating: 4.1,
            isHiringNow: true,
            matchScore: 95
          },
          {
            id: 3,
            name: 'Transnet SOC Ltd',
            industry: 'Transport & Logistics',
            location: 'Durban, KZN',
            openPositions: 156,
            rating: 3.8,
            isHiringNow: true,
            matchScore: 88
          }
        ],
        suggestions: [
          "What training does Shoprite provide?",
          "Tell me about Transnet benefits",
          "Show me more general worker jobs",
          "Companies with transport allowance"
        ]
      };
    }

    if (lowerMessage.includes('retail') || lowerMessage.includes('shop')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: "Here are retail companies that offer great entry-level opportunities with training:",
        timestamp: new Date(),
        companyResults: [
          {
            id: 2,
            name: 'Pick n Pay',
            industry: 'Retail',
            location: 'Johannesburg',
            openPositions: 189,
            rating: 4.2,
            isHiringNow: true,
            matchScore: 92
          },
          {
            id: 7,
            name: 'Clicks Group',
            industry: 'Health & Beauty Retail',
            location: 'Cape Town',
            openPositions: 98,
            rating: 4.4,
            isHiringNow: true,
            matchScore: 88
          }
        ],
        suggestions: [
          "What benefits does Pick n Pay offer?",
          "Tell me about Clicks training programs",
          "Show me more retail companies",
          "Entry-level cashier positions"
        ]
      };
    }

    if (lowerMessage.includes('security') || lowerMessage.includes('guard')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: "I found security companies that provide full training and equipment:",
        timestamp: new Date(),
        companyResults: [
          {
            id: 8,
            name: 'ADT Security',
            industry: 'Security Services',
            location: 'Pretoria',
            openPositions: 278,
            rating: 3.7,
            isHiringNow: true,
            matchScore: 90
          }
        ],
        suggestions: [
          "What training does ADT provide?",
          "Security guard shift patterns",
          "More security companies",
          "Armed vs unarmed positions"
        ]
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: "I understand you're looking for job opportunities. I can help you find entry-level positions that don't require experience. You could ask me about:\n\n• Types of work (retail, security, cleaning, warehouse)\n• Location preferences (your city or area)\n• Work schedule (full-time, part-time, shifts)\n• Benefits you need (transport, medical aid, training)\n\nWhat kind of work interests you most?",
      timestamp: new Date(),
      suggestions: [
        "General worker positions",
        "Retail jobs with training",
        "Security guard opportunities",
        "Companies near me"
      ]
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 bg-gradient-to-r from-[#1a365d] to-[#2a4365] hover:from-[#2a4365] hover:to-[#2d3748] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-12 right-0 bg-black text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
          Ask AI about companies
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className={`w-96 shadow-2xl border-0 bg-card ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all duration-300`}>
        {/* Header */}
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#1a365d] to-[#2a4365] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">AI Company Assistant</CardTitle>
                <p className="text-xs text-white/70">Powered by WorkWise AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 w-8 h-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 w-8 h-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'assistant' && (
                      <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500">
                        <AvatarFallback className="text-white text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                      
                      {/* Company Results */}
                      {message.companyResults && (
                        <div className="mt-3 space-y-2">
                          {message.companyResults.map((company) => (
                            <Card key={company.id} className="border border-border hover:border-primary/50 transition-colors cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-sm">{company.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {company.matchScore}% match
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {company.industry}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {company.location}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {company.openPositions} open positions
                                  </div>
                                </div>
                                {company.isHiringNow && (
                                  <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                                    Actively Hiring
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs h-7 px-2 hover:bg-primary/10 hover:border-primary/50"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {message.type === 'user' && (
                      <Avatar className="w-8 h-8 bg-gray-300 order-1">
                        <AvatarFallback className="text-gray-600 text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500">
                        <AvatarFallback className="text-white text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about companies..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Lightbulb className="h-3 w-3" />
                Try: "Companies hiring general workers near me"
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default CompanySearchAssistant;