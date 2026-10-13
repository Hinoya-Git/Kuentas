import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  content: string;
  tip?: string;
  itemCode?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  content,
  tip,
  itemCode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`Learn more about ${title}`}
        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full -left-2 sm:left-auto sm:-right-4 mb-2 w-[calc(100vw-48px)] max-w-[280px] sm:max-w-none sm:w-80 p-3.5 bg-slate-900 text-slate-100 rounded-lg shadow-xl text-xs border border-slate-700 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              {itemCode && (
                <span className="font-mono text-[10px] bg-emerald-900 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  {itemCode}
                </span>
              )}
              <span className="font-bold text-slate-200 text-xs">{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
            {content}
          </p>

          {/* Practical tip */}
          {tip && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 flex items-start gap-1">
              <span className="font-bold text-emerald-300">💡 Pro Tip:</span>
              <span>{tip}</span>
            </div>
          )}

          {/* Little arrow */}
          <div className="absolute top-full left-3 sm:left-auto sm:right-6 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
