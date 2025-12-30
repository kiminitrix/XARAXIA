import React, { useEffect, useRef, useState } from 'react';
import { Conversation, Model, Role } from '../types';
import { GEMINI_MODELS } from '../constants';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import { Settings, Sparkles, Sidebar as SidebarIcon } from 'lucide-react';

interface ChatWindowProps {
  conversation?: Conversation;
  onSendMessage: (text: string) => void;
  onRegenerate: (messageId: string) => void;
  isStreaming: boolean;
  activeModel: Model;
  onModelChange: (model: Model) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onSendMessage,
  onRegenerate,
  isStreaming,
  activeModel,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  onToggleSidebar,
  sidebarOpen
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isStreaming]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <SidebarIcon size={20} />
            </button>
          )}
          <ModelSelector 
            models={GEMINI_MODELS} 
            selectedModel={activeModel} 
            onSelect={onModelChange} 
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${showSettings ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="font-semibold mb-3">System Instruction</h3>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            className="w-full h-32 p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            placeholder="Tell the AI how to behave..."
          />
          <p className="mt-2 text-xs text-slate-500">This prompt guides the model's overall personality and behavior across all chats.</p>
        </div>
      )}

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scroll-smooth"
      >
        {!conversation || conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-3">Welcome to XARAXIA</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
              Experience the power of Gemini 3. Start a conversation to explore ideas, write code, or just chat.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {[
                "Write a Python script for web scraping",
                "Explain quantum entanglement simply",
                "Help me plan a 3-day trip to Tokyo",
                "Draft a professional email for a job application"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(suggestion)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800 text-left text-sm hover:shadow-md transition-all group"
                >
                  {suggestion}
                  <div className="mt-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Try this →</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {conversation.messages.map((message) => (
              <MessageItem key={message.id} message={message} onRegenerate={onRegenerate} isStreaming={isStreaming} />
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse ml-12">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full delay-150"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 lg:p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={onSendMessage} disabled={isStreaming} />
          <p className="mt-3 text-center text-xs text-slate-500">
            XARAXIA can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;