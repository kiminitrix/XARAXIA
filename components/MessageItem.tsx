import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role } from '../types';
import { User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageItemProps {
  message: Message;
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

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [mainCopied, setMainCopied] = useState(false);

  const handleMainCopy = () => {
    navigator.clipboard.writeText(message.content);
    setMainCopied(true);
    setTimeout(() => setMainCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group/message`}>
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300
        ${isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-blue-600 text-white shadow-blue-500/20'}
      `}>
        {isUser ? <User size={20} /> : <span className="font-black text-lg">X</span>}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-3 rounded-2xl shadow-sm leading-relaxed
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'}
        `}>
          <div className="prose-custom prose-slate dark:prose-invert max-w-none">
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

        {!isUser && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200">
            <button 
              onClick={handleMainCopy}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy response"
            >
              {mainCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
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