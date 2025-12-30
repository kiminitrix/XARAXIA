import React from 'react';
import { Conversation } from '../types';
import { MessageSquare, Plus, Trash2, Menu, X, Bot } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <Bot size={28} />
            <span>XARAXIA</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">History</h3>
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400 text-center italic">No conversations yet</p>
            ) : (
              conversations.sort((a, b) => b.lastUpdated - a.lastUpdated).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`
                    group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                    ${currentChatId === chat.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                  `}
                >
                  <MessageSquare size={18} className="shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate pr-6">{chat.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">Free Tier User</p>
              <p className="text-xs text-slate-500 truncate">xaraxia-cloud-account</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;