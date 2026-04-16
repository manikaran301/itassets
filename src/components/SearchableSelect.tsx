"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
  allowCustom?: boolean;
  limit?: number; // New prop to limit displayed items
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  icon,
  label,
  allowCustom = false,
  limit,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Sync search display with selected value whenever value or options change
  // This handles: initial mount, value changes from parent/API, options loading, and dropdown closing
  useEffect(() => {
    if (!isOpen) {
      const displayValue = selectedOption?.label ?? (value || "");
      setSearch(displayValue);
    }
  }, [value, selectedOption, isOpen, options]);

  // Filter options based on search (only filter when user is actively searching)
  let filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  // If a limit is provided and no specific search term matches more explicitly, limit the display
  if (limit && !search) {
    filtered = filtered.slice(0, limit);
  } else if (limit) {
    // Optionally still cap search results to keep UI clean, or let it show all matches up to say 20.
    filtered = filtered.slice(0, 50); // cap max rendering to prevent DOM bloat
  }

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
    <div className="group/field space-y-2">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85 ml-1">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Trigger Input Area */}
        <div
          className={cn(
            "relative w-full bg-muted/35 border rounded-[22px] px-6 py-4 transition-all flex items-center gap-3 cursor-text",
            isOpen
              ? "border-primary/45 shadow-xl shadow-primary/10 ring-4 ring-primary/10"
              : "border-border/70 hover:border-border",
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
                isOpen ? "text-primary" : "text-muted-foreground/70",
              )}
            >
              {icon}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs font-black text-foreground placeholder:font-semibold placeholder:text-muted-foreground/70"
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground/70 hover:text-primary shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground/70 shrink-0 transition-transform duration-300",
              isOpen && "rotate-180 text-primary",
            )}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-[200] mt-3 w-full bg-card border border-border rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-[280px] overflow-y-auto py-2 scrollbar-hide">
              {filtered.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.2em]">
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
                      "w-[calc(100%-16px)] mx-2 px-6 py-3 text-left text-[11px] font-bold flex items-center justify-between transition-all hover:bg-primary/5 group/opt rounded-2xl",
                      value === opt.value
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/90 hover:text-foreground",
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {value === opt.value && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
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
