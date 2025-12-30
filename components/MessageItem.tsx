
import React from 'react';
import { Message, Role } from '../types';
import { Bot, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // Could add a toast notification here
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-500'}
      `}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-3 rounded-2xl shadow-sm leading-relaxed
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'}
        `}>
          <div className="whitespace-pre-wrap break-words text-[15px]">
            {message.content || (
              <span className="italic text-slate-400">Thinking...</span>
            )}
          </div>
        </div>

        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy to clipboard"
            >
              <Copy size={14} />
            </button>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors">
              <ThumbsUp size={14} />
            </button>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors">
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
