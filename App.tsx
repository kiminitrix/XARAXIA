import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, Role, Model } from './types';
import { GEMINI_MODELS, DEFAULT_SYSTEM_PROMPT } from './constants';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { generateTitle, streamChat } from './services/geminiService';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('xaraxia_conversations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<Model>(GEMINI_MODELS[0]);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const currentChat = conversations.find(c => c.id === currentChatId);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('xaraxia_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const createNewChat = useCallback(() => {
    const newChat: Conversation = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      modelId: activeModel.id,
      lastUpdated: Date.now(),
      systemPrompt
    };
    setConversations(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  }, [activeModel.id, systemPrompt]);

  const deleteChat = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleRegenerate = async (messageId: string) => {
    if (isStreaming || !currentChatId || !currentChat) return;

    const assistantIdx = currentChat.messages.findIndex(m => m.id === messageId);
    if (assistantIdx === -1) return;

    // Find the user message that preceded this assistant message
    const userMessageIdx = assistantIdx - 1;
    if (userMessageIdx < 0 || currentChat.messages[userMessageIdx].role !== Role.USER) return;

    const messagesToResend = currentChat.messages.slice(0, assistantIdx);
    
    // Reset assistant message content
    setConversations(prev => prev.map(c => {
      if (c.id !== currentChatId) return c;
      const msgs = [...c.messages];
      msgs[assistantIdx] = { ...msgs[assistantIdx], content: "", timestamp: Date.now() };
      return { ...c, messages: msgs };
    }));

    setIsStreaming(true);

    try {
      let accumulatedText = "";
      await streamChat(
        currentChat.modelId,
        messagesToResend,
        currentChat.systemPrompt || systemPrompt,
        (chunk) => {
          accumulatedText += chunk;
          setConversations(prev => prev.map(c => {
            if (c.id !== currentChatId) return c;
            const msgs = [...c.messages];
            msgs[assistantIdx] = { ...msgs[assistantIdx], content: accumulatedText };
            return { ...c, messages: msgs };
          }));
        }
      );
    } catch (error) {
      setConversations(prev => prev.map(c => {
        if (c.id !== currentChatId) return c;
        const msgs = [...c.messages];
        msgs[assistantIdx] = { ...msgs[assistantIdx], content: "Sorry, I encountered an error while regenerating. Please try again." };
        return { ...c, messages: msgs };
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let chatId = currentChatId;
    let targetChat = currentChat;

    // Create new chat if none selected
    if (!chatId) {
      const newId = uuidv4();
      const newChat: Conversation = {
        id: newId,
        title: 'New Conversation',
        messages: [],
        modelId: activeModel.id,
        lastUpdated: Date.now(),
        systemPrompt
      };
      setConversations(prev => [newChat, ...prev]);
      setCurrentChatId(newId);
      chatId = newId;
      targetChat = newChat;
    }

    if (!targetChat) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
      timestamp: Date.now()
    };

    // Update conversation with user message
    const updatedMessages = [...targetChat.messages, userMessage];
    setConversations(prev => prev.map(c => 
      c.id === chatId ? { ...c, messages: updatedMessages, lastUpdated: Date.now() } : c
    ));

    // Handle Title Generation if it's the first message
    if (updatedMessages.length === 1) {
      generateTitle(text).then(title => {
        setConversations(prev => prev.map(c => 
          c.id === chatId ? { ...c, title } : c
        ));
      });
    }

    // AI Response Placeholder
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: Role.MODEL,
      content: "",
      timestamp: Date.now()
    };

    setConversations(prev => prev.map(c => 
      c.id === chatId ? { ...c, messages: [...updatedMessages, assistantMessage] } : c
    ));

    setIsStreaming(true);

    try {
      let accumulatedText = "";
      await streamChat(
        targetChat.modelId,
        updatedMessages,
        targetChat.systemPrompt || systemPrompt,
        (chunk) => {
          accumulatedText += chunk;
          setConversations(prev => prev.map(c => {
            if (c.id !== chatId) return c;
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.id === assistantMessageId) {
              lastMsg.content = accumulatedText;
            }
            return { ...c, messages: msgs };
          }));
        }
      );
    } catch (error) {
      setConversations(prev => prev.map(c => {
        if (c.id !== chatId) return c;
        const msgs = [...c.messages];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.id === assistantMessageId) {
          lastMsg.content = "Sorry, I encountered an error while processing your request. Please try again.";
        }
        return { ...c, messages: msgs };
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ChatWindow 
          conversation={currentChat}
          onSendMessage={handleSendMessage}
          onRegenerate={handleRegenerate}
          isStreaming={isStreaming}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          sidebarOpen={isSidebarOpen}
        />
      </main>
    </div>
  );
};

export default App;