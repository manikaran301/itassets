"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  image?: string;
  initials?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  allowCustom?: boolean;
  showAvatars?: boolean;
  limit?: number;
  compact?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  icon,
  allowCustom = false,
  showAvatars = false,
  limit,
  compact = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Synchronize search text with selection, but only when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      const displayValue = selectedOption?.label ?? (value || "");
      setSearch(displayValue);
    }
  }, [value, selectedOption, isOpen, options]);

  // ADVANCED SEARCH & RELEVANCE LOGIC
  const searchLower = search.toLowerCase();
  
  const sorted = useMemo(() => {
    // If we have a selected option and the search text matches it exactly, 
    // we want to show all options but keep the selection at the top.
    const isExactMatch = selectedOption && searchLower === selectedOption.label.toLowerCase();
    
    let baseList = isExactMatch ? [...options] : options.filter(opt => 
      opt.label.toLowerCase().includes(searchLower)
    );

    return baseList.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      
      // 1. Exact matches first
      const aExact = aLabel === searchLower;
      const bExact = bLabel === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // 2. Starts with search term
      const aStarts = aLabel.startsWith(searchLower);
      const bStarts = bLabel.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // 3. Prioritize currently selected value if showing all
      if (isExactMatch) {
        if (a.value === value) return -1;
        if (b.value === value) return 1;
      }

      return 0;
    });
  }, [options, searchLower, selectedOption, value]);

  // Cap rendering to prevent DOM bloat
  const displayLimit = limit ? Math.max(limit, 50) : 50;
  const filtered = sorted.slice(0, displayLimit);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val: string, label: string) => {
    onChange(val);
    setSearch(label);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setIsOpen(true);
  };

  return (
    <div className={cn("group/field", !compact && "space-y-2")}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Trigger Input Area */}
        <div
          className={cn(
            "relative w-full transition-all flex items-center gap-3 cursor-text",
            compact 
              ? "bg-muted/30 border border-border px-4 py-2.5 rounded-xl" 
              : "bg-muted/35 border border-border/70 rounded-[22px] px-6 py-4 hover:border-border",
            isOpen && (compact ? "border-primary/40 shadow-md ring-2 ring-primary/10" : "border-primary/45 shadow-xl shadow-primary/10 ring-4 ring-primary/10")
          )}
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          {icon && (
            <span
              className={cn(
                "shrink-0 transition-colors",
                compact ? "w-3.5 h-3.5" : "w-4 h-4",
                isOpen ? "text-primary" : "text-muted-foreground/70",
              )}
            >
              {icon}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            className={cn(
              "flex-1 min-w-0 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/70",
              compact ? "text-[11px] font-bold" : "text-xs font-bold"
            )}
            placeholder={placeholder}
            value={search}
            onFocus={() => {
              setIsOpen(true);
              inputRef.current?.select();
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-muted-foreground/40 hover:text-foreground"
            >
              <X className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            </button>
          )}
          <ChevronDown
            className={cn(
              "text-primary/30 shrink-0 transition-transform duration-300",
              compact ? "w-3.5 h-3.5" : "w-4 h-4",
              isOpen && "rotate-180 text-primary",
            )}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-[300] mt-3 w-full bg-[#12141a] border border-white/10 rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark">
            <div className="max-h-[320px] overflow-y-auto py-3 scrollbar-hide">
              {filtered.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                    No Identity Matches
                  </p>
                  {allowCustom && search.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(search.trim(), search.trim())}
                      className="mt-4 px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all"
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
                    onClick={() => handleSelect(opt.value, opt.label)}
                    className={cn(
                      "w-[calc(100%-16px)] mx-2 px-4 py-2.5 text-left text-[11px] font-bold flex items-center gap-3 transition-all hover:bg-white/5 group/opt rounded-2xl mb-1 last:mb-0",
                      value === opt.value
                        ? "bg-primary/20 text-primary"
                        : "text-slate-300 hover:text-white",
                    )}
                  >
                    {showAvatars && (
                      <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-white/5 bg-white/5 flex items-center justify-center relative group-hover/opt:border-primary/30 transition-colors">
                        {opt.image ? (
                          <img src={opt.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-black text-slate-500 group-hover/opt:text-primary transition-colors">
                            {opt.initials || opt.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {value === opt.value && (
                      <Check className="w-4 h-4 text-primary shrink-0 mr-2" />
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
