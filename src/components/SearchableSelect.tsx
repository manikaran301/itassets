'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
  allowCustom?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  icon,
  label,
  allowCustom = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || value || '';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div className="group/field space-y-2">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-muted/20 border rounded-[22px] px-6 py-4 text-xs outline-none transition-all font-black text-left flex items-center gap-3",
            isOpen ? "border-primary/40 shadow-sm" : "border-white/5 hover:border-white/10"
          )}
        >
          {icon && <span className="text-muted-foreground/20 shrink-0">{icon}</span>}
          <span className={cn("flex-1 truncate", !displayLabel && "text-muted-foreground/30 font-normal")}>
            {displayLabel || placeholder}
          </span>
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground/30 hover:text-foreground shrink-0"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground/30 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#0A0A0A] border border-black/10 dark:border-white/10 rounded-[20px] shadow-md overflow-hidden animate-fade-in">
            {/* Search Input */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-muted/30 pl-9 pr-3 py-2.5 rounded-xl text-[11px] border border-transparent focus:border-primary/20 outline-none transition-all font-bold placeholder:font-normal placeholder:text-muted-foreground/20"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-[240px] overflow-y-auto py-1.5 scrollbar-hide">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">No matches</p>
                  {allowCustom && search.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(search.trim())}
                      className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Use &ldquo;{search.trim()}&rdquo;
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-[11px] font-bold flex items-center gap-3 transition-all hover:bg-white/5",
                      value === opt.value && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {value === opt.value && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
