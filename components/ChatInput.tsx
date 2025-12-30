
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all"
    >
      <button 
        type="button"
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <Paperclip size={20} />
      </button>
      
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 max-h-48 py-2 px-1 bg-transparent border-none focus:ring-0 outline-none resize-none text-slate-800 dark:text-slate-100 disabled:opacity-50"
      />

      <div className="flex items-center gap-1">
        <button 
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Mic size={20} />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`
            p-2 rounded-xl transition-all
            ${text.trim() && !disabled 
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 transform active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}
          `}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
