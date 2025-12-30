
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Mic, MicOff, AlertCircle, X, File, FileText, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => {
          const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + space + finalTranscript.trim();
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setPermissionError('Microphone access denied. Please enable it in your browser settings.');
      } else if (event.error === 'network') {
        setPermissionError('Network error occurred during speech recognition.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setPermissionError(null);

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || files.length > 0) && !disabled) {
      if (isListening) {
        recognitionRef.current?.stop();
      }
      
      // Note: File handling is currently a placeholder. 
      // In a real implementation, we would upload these or send as base64 parts.
      if (files.length > 0) {
        console.log('Sending files (placeholder):', files.map(f => f.name));
      }

      onSend(text.trim());
      setText('');
      setFiles([]);
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

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={14} />;
    if (file.type.includes('pdf') || file.type.includes('text')) return <FileText size={14} />;
    return <File size={14} />;
  };

  return (
    <div className="relative w-full">
      {/* Listening Aura */}
      {isListening && (
        <div className="absolute inset-0 -m-1 bg-blue-500/10 dark:bg-blue-400/5 rounded-2xl animate-pulse pointer-events-none z-0" />
      )}

      {/* Floating Status / Error */}
      {permissionError && (
        <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border border-red-100 dark:border-red-800 shadow-sm">
            <AlertCircle size={14} />
            {permissionError}
            <button onClick={() => setPermissionError(null)} className="ml-1 hover:underline">Dismiss</button>
          </div>
        </div>
      )}

      {isListening && !permissionError && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full animate-bounce shadow-lg flex items-center gap-2 z-10 uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          Listening...
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {files.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`}
              className="group flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <span className="text-blue-500">{getFileIcon(file)}</span>
              <span className="max-w-[120px] truncate font-medium">{file.name}</span>
              <button 
                type="button"
                onClick={() => removeFile(idx)}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit}
        className={`
          relative flex items-end gap-2 bg-white dark:bg-slate-800 border rounded-2xl p-2 shadow-sm transition-all duration-300 z-10
          ${isListening 
            ? 'border-blue-500 ring-4 ring-blue-500/10' 
            : 'border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all shrink-0"
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "I'm listening..." : "Ask me anything..."}
          disabled={disabled}
          className="flex-1 max-h-48 py-2 px-1 bg-transparent border-none focus:ring-0 outline-none resize-none text-slate-800 dark:text-slate-100 disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <div className="flex items-center gap-1 shrink-0">
          {isSupported && (
            <button 
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`
                p-2 rounded-xl transition-all relative group
                ${isListening 
                  ? 'text-white bg-blue-600 shadow-lg scale-110 active:scale-95' 
                  : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
              `}
              title={isListening ? "Stop listening" : "Dictate message"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {permissionError && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}
            </button>
          )}
          
          <button
            type="submit"
            disabled={(!text.trim() && files.length === 0) || disabled}
            className={`
              p-2 rounded-xl transition-all
              ${(text.trim() || files.length > 0) && !disabled 
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 transform active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}
            `}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
