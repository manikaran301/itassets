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

// Custom lightweight Levenshtein Distance for typo tolerance (Tier 1 Fuzzy Search)
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

// Custom acronym generator (e.g. "Managing Director" -> "md")
function getAcronym(label: string): string {
  return label
    .split(/[\s\-_]+/)
    .map((word) => word.charAt(0))
    .join("")
    .toLowerCase();
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
  disabled?: boolean;
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
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track selection frequency in local state + localStorage (Tier 4 Usage Frequency Boost)
  const [frequencies, setFrequencies] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mams_select_frequencies");
      if (stored) {
        setFrequencies(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load search frequencies:", e);
    }
  }, []);

  const incrementFrequency = (val: string) => {
    try {
      const updated = { ...frequencies, [val]: (frequencies[val] || 0) + 1 };
      setFrequencies(updated);
      localStorage.setItem("mams_select_frequencies", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save search frequencies:", e);
    }
  };

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

  // CONTINUOUS SEARCH SCORING SYSTEM (Tiers 1, 2, 4 + Custom Token Matching)
  const sorted = useMemo(() => {
    const isExactMatch = selectedOption && search.toLowerCase() === selectedOption.label.toLowerCase();
    
    // If exact match exists (dropdown just opened with selection), sort by basic selection frequency
    if (!search.trim() || isExactMatch) {
      return [...options].sort((a, b) => {
        // Boost selected value first
        if (a.value === value && b.value !== value) return -1;
        if (b.value === value && a.value !== value) return 1;

        const freqA = frequencies[a.value] || 0;
        const freqB = frequencies[b.value] || 0;
        if (freqB !== freqA) return freqB - freqA;
        return a.label.localeCompare(b.label);
      });
    }

    const queryLower = search.toLowerCase().trim();
    const queryTokens = queryLower.split(/\s+/).filter(Boolean);

    const scoredOptions = options.map((opt) => {
      const labelLower = opt.label.toLowerCase();
      const labelWords = labelLower.split(/\s+/).filter(Boolean);
      let score = 0;

      // 1. Exact Match (Huge boost)
      if (labelLower === queryLower) {
        score += 1500;
      }

      // 2. Acronym Match (Tier 3 - e.g. "md" matches "Managing Director")
      const acronym = getAcronym(opt.label);
      if (acronym === queryLower) {
        score += 1000; // Big boost for exact initials match!
      } else if (acronym.startsWith(queryLower) && queryLower.length >= 2) {
        score += 400;  // Good boost for prefix initials match!
      }

      // 3. Starts-With Prefix Match
      if (labelLower.startsWith(queryLower)) {
        score += 800;
      }

      // 4. Substring Index (Earlier in the string is better)
      const subIdx = labelLower.indexOf(queryLower);
      if (subIdx !== -1) {
        score += Math.max(0, 300 - subIdx * 10);
      }

      // 4. Token & Word-Boundary Matching (Tier 2 Token Scoring)
      queryTokens.forEach((token) => {
        let tokenMatched = false;
        labelWords.forEach((word) => {
          if (word === token) {
            score += 150; // Exact word match
            tokenMatched = true;
          } else if (word.startsWith(token)) {
            score += 80; // Word starts with token
            tokenMatched = true;
          } else if (word.includes(token)) {
            score += 30; // Word contains token
            tokenMatched = true;
          }

          // 5. Fuzzy Match / Typo Tolerance (Tier 1 Fuzzy Levenshtein Distance)
          if (!tokenMatched && token.length >= 3 && word.length >= 3) {
            const dist = getLevenshteinDistance(token, word);
            const maxAllowedDist = token.length > 5 ? 2 : 1;
            if (dist <= maxAllowedDist) {
              score += Math.max(0, 100 - dist * 40); // Inverse penalty based on distance
            }
          }
        });
      });

      // 6. Selection Frequency Boost (Tier 4 Logarithmic Scaling)
      const freq = frequencies[opt.value] || 0;
      if (freq > 0) {
        score += Math.min(100, Math.log1p(freq) * 30);
      }

      return { option: opt, score };
    });

    // Filter out options with 0 score (no match whatsoever)
    const matches = scoredOptions.filter((item) => item.score > 0);

    // Sort descending by continuous score
    return matches
      .sort((a, b) => b.score - a.score)
      .map((item) => item.option);
  }, [options, search, selectedOption, value, frequencies]);

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
    incrementFrequency(val);
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
            isOpen && (compact ? "border-primary/40 shadow-md ring-2 ring-primary/10" : "border-primary/45 shadow-xl shadow-primary/10 ring-4 ring-primary/10"),
            disabled && "opacity-30 cursor-not-allowed pointer-events-none bg-muted/5 text-muted-foreground/30 border-border/30"
          )}
          onClick={() => {
            if (disabled) return;
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
            disabled={disabled}
            className={cn(
              "flex-1 min-w-0 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/70",
              compact ? "text-[11px] font-bold" : "text-xs font-bold"
            )}
            placeholder={placeholder}
            value={search}
            onFocus={() => {
              if (disabled) return;
              setIsOpen(true);
              inputRef.current?.select();
            }}
            onChange={(e) => {
              if (disabled) return;
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
