
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role } from '../types';
import { User, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, File, FileText, Image as ImageIcon, Download } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  isStreaming?: boolean;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group/code rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          {match ? match[1] : 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        {...props}
        style={vscDarkPlus}
        language={match ? match[1] : 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          backgroundColor: '#0f172a',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, onRegenerate, isStreaming }) => {
  const isUser = message.role === Role.USER;
  const [mainCopied, setMainCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleMainCopy = () => {
    navigator.clipboard.writeText(message.content);
    setMainCopied(true);
    setTimeout(() => setMainCopied(false), 2000);
  };

  const handleRegenerateClick = () => {
    if (isStreaming || !onRegenerate) return;
    setIsRotating(true);
    onRegenerate(message.id);
    setTimeout(() => setIsRotating(false), 1000);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-blue-500" />;
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group/message relative`}>
      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-slate-800 dark:bg-slate-700 text-blue-400 shadow-blue-500/10'}
      `}>
        {isUser ? <User size={20} /> : <span className="font-black text-lg tracking-tighter">XA</span>}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Attachments (If User) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 mb-2">
            {message.attachments.map((file, i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-2 max-w-[200px] shadow-sm">
                 {file.type.startsWith('image/') ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <img src={`data:${file.type};base64,${file.data}`} alt="preview" className="w-full h-full object-cover" />
                    </div>
                 ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                 )}
                 <span className="text-[10px] font-medium truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div className={`
          relative px-4 py-3 rounded-2xl shadow-sm leading-relaxed transition-all duration-200
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none group-hover/message:border-blue-400/50 dark:group-hover/message:border-blue-500/30'}
        `}>
          <div className="prose-custom prose-slate dark:prose-invert max-w-none min-w-[20px]">
            {message.content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock,
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></span>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/message:opacity-100 transition-all duration-200 -ml-1">
            <button 
              onClick={handleMainCopy}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Copy response"
            >
              {mainCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
            
            <button 
              onClick={handleRegenerateClick}
              disabled={isStreaming}
              className={`
                group/reg p-1.5 flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all
                ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Regenerate response"
            >
              <RotateCcw 
                size={14} 
                className={`transition-transform duration-500 ${isRotating ? 'rotate-180' : ''}`} 
              />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover/reg:block animate-in fade-in slide-in-from-left-1">
                Regenerate
              </span>
            </button>

            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1" />

            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ThumbsUp size={14} />
            </button>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
