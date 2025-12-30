import React, { useState, useRef, useEffect } from 'react';
import { Model } from '../types';
import { ChevronDown, Check, Zap, Brain, ImageIcon } from 'lucide-react';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: Model;
  onSelect: (model: Model) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (id: string) => {
    if (id.includes('flash')) return <Zap size={16} className="text-amber-500" />;
    if (id.includes('pro')) return <Brain size={16} className="text-purple-500" />;
    if (id.includes('image')) return <ImageIcon size={16} className="text-blue-500" />;
    return <Zap size={16} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          {getIcon(selectedModel.id)}
          {selectedModel.name}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 space-y-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left p-3 rounded-lg transition-colors
                  ${selectedModel.id === model.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {getIcon(model.id)}
                    {model.name}
                  </div>
                  {selectedModel.id === model.id && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {model.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {model.capabilities.map(cap => (
                    <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">
            XARAXIA automatically routes requests to the selected Gemini model provider.
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;