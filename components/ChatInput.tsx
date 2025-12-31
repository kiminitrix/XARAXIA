
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
    recognition.interimResults = false; // Only take final chunks for stability
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
          const trimmed = prev.trimEnd();
          const space = trimmed.length > 0 ? ' ' : '';
          return trimmed + space + finalTranscript.trim();
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
      // Auto-focus textarea when done speaking
      textareaRef.current?.focus();
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
      {/* Visual Indicator of Listening State */}
      {isListening && (
        <div className="absolute inset-0 -m-1.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-2xl animate-pulse pointer-events-none z-0 ring-2 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
      )}

      {/* Floating Permission Error */}
      {permissionError && (
        <div className="absolute -top-14 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 duration-300 z-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-800 shadow-xl backdrop-blur-sm">
            <AlertCircle size={16} />
            {permissionError}
            <button 
              onClick={() => setPermissionError(null)}
              className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* "Listening" Badge */}
      {isListening && !permissionError && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-2xl flex items-center gap-2 z-20 uppercase tracking-[0.1em] border-2 border-white/20 animate-bounce">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </div>
          Listening Live
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {files.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`}
              className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-blue-500">{getFileIcon(file)}</span>
              <span className="max-w-[150px] truncate font-semibold">{file.name}</span>
              <button 
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
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
          className="p-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all shrink-0"
          title="Attach files"
        >
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening to your voice..." : "Ask XARAXIA anything..."}
          disabled={disabled}
          className="flex-1 max-h-48 py-2.5 px-1 bg-transparent border-none focus:ring-0 outline-none resize-none text-slate-800 dark:text-slate-100 disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
        />

        <div className="flex items-center gap-1 shrink-0 pb-0.5">
          {isSupported && (
            <button 
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`
                p-2.5 rounded-xl transition-all relative group
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
              p-2.5 rounded-xl transition-all
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
