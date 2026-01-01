
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Mic, MicOff, AlertCircle, X, File, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
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
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        setText(prev => {
          const trimmed = prev.trimEnd();
          return trimmed + (trimmed.length > 0 ? ' ' : '') + finalTranscript.trim();
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setPermissionError('Microphone access denied.');
      }
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          type: file.type,
          data: base64,
          size: file.size
        });
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || attachments.length > 0) && !disabled) {
      if (isListening) recognitionRef.current?.stop();
      onSend(text.trim(), attachments);
      setText('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={18} />;
    if (type.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-blue-500" />;
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setPermissionError(null);
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return (
    <div 
      className="relative w-full"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 -m-4 bg-blue-600/10 border-2 border-dashed border-blue-500 rounded-3xl z-50 flex flex-col items-center justify-center backdrop-blur-[2px] pointer-events-none animate-in fade-in zoom-in duration-200">
          <UploadCloud size={48} className="text-blue-500 mb-2 animate-bounce" />
          <p className="text-blue-600 font-bold">Drop files here to analyze</p>
        </div>
      )}

      {/* Listening Aura */}
      {isListening && (
        <div className="absolute inset-0 -m-1.5 bg-blue-500/10 rounded-2xl animate-pulse pointer-events-none z-0 ring-2 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
      )}

      {/* Attachments Rail */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-1 max-h-40 overflow-y-auto animate-in slide-in-from-bottom-2 duration-300">
          {attachments.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`}
              className="group flex items-center gap-2 pl-2 pr-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all"
            >
              {file.type.startsWith('image/') ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                   <img src={`data:${file.type};base64,${file.data}`} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : getFileIcon(file.type)}
              <div className="flex flex-col pr-1">
                <span className="max-w-[120px] truncate font-semibold">{file.name}</span>
                <span className="text-[9px] opacity-50 uppercase font-bold">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button 
                type="button"
                onClick={() => removeAttachment(idx)}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <X size={14} />
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
          onChange={(e) => handleFiles(e.target.files)}
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
          placeholder={isListening ? "Listening..." : "Ask anything... (supports images/docs)"}
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
                p-2.5 rounded-xl transition-all
                ${isListening 
                  ? 'text-white bg-blue-600 shadow-lg scale-110' 
                  : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
              `}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <button
            type="submit"
            disabled={(!text.trim() && attachments.length === 0) || disabled}
            className={`
              p-2.5 rounded-xl transition-all
              ${(text.trim() || attachments.length > 0) && !disabled 
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
