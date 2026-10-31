import React, { useState } from 'react';
import type { ComparisonSiteData } from '../../types/comparison';
import type { AiComparisonInsights } from '../../types/ai';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { askAiComparisonQuestion } from '../../services/aiService';

interface AiComparisonChatProps {
  siteA: ComparisonSiteData;
  siteB: ComparisonSiteData;
  insights?: AiComparisonInsights;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  provider?: string;
}

const QUICK_QUESTIONS = [
  'Why is the weaker website slower?',
  'How can we optimize Largest Contentful Paint (LCP)?',
  'What are the top 3 priorities to fix first?',
  'What key accessibility improvements should be made?',
  'How can we reduce Total Blocking Time (TBT)?'
];

export const AiComparisonChat: React.FC<AiComparisonChatProps> = ({
  siteA,
  siteB,
  insights
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I have analyzed the audit comparison between **${siteA.url}** and **${siteB.url}**. Ask me any question about bottlenecks, Core Web Vitals, or how to implement fixes!`,
      timestamp: new Date().toLocaleTimeString(),
      provider: insights?.meta.provider || 'rules-engine'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await askAiComparisonQuestion(text, {
        siteA,
        siteB,
        insights
      });

      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString(),
        provider: response.provider
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('AI chat failed:', err);
      const fallbackMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'I could not process your query at this moment. Please check backend connectivity or try another question.',
        timestamp: new Date().toLocaleTimeString(),
        provider: 'fallback'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              ASK AI ABOUT YOUR WEBSITE
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Interactive engineering Q&A grounded in your real comparison audit metrics
            </p>
          </div>
        </div>

        <Badge variant="default" className="bg-gray-900 border-gray-700 text-gray-300 text-xs">
          Audit-Grounded Responses
        </Badge>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="space-y-1.5">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          Suggested Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-gray-300 transition text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message History Container */}
      <div className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 p-4 rounded-xl bg-gray-950/60 border border-gray-800/80 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-xl ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-gray-900/90 border border-gray-800 text-gray-200 rounded-tl-none space-y-2'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              <div
                className={`text-[10px] mt-1 flex items-center justify-between gap-2 ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.provider && (
                  <span className="uppercase text-[9px] tracking-wider font-mono">
                    [{m.provider}]
                  </span>
                )}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="p-1.5 rounded-lg bg-gray-800 text-gray-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-3 text-xs text-indigo-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing comparison audit data...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about performance, Core Web Vitals, or code fixes..."
          disabled={isSending}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <Button
          variant="primary"
          onClick={() => handleSendMessage()}
          disabled={isSending || !inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </Card>
  );
};
