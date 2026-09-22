"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { globalQuickSearch, SearchResultItem } from "@/server/actions/search";
import {
  Search,
  Users,
  Layers,
  Receipt,
  ArrowRight,
  Command,
  X,
  Loader2,
} from "lucide-react";

export function GlobalSearchModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalQuickSearch(query);
        setResults(res);
        setSelectedIndex(0);
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "STUDENT":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "BATCH":
        return <Layers className="h-4 w-4 text-amber-500" />;
      case "RECEIPT":
        return <Receipt className="h-4 w-4 text-emerald-500" />;
      default:
        return <Search className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <>
      {/* ── Header Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-9 pl-3 pr-2.5 rounded-xl border border-input bg-muted/40 hover:bg-muted/70 text-xs text-muted-foreground flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs select-none"
        title="Search ERP (Ctrl + K)"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate">Search students, batches, receipts...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md bg-background border text-muted-foreground shadow-2xs">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* ── Modal Dialog Overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a student name, roll no, batch code, or receipt #..."
                className="w-full h-12 px-3 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
              />
              {isPending && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />}
              {query && !isPending && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {query.length >= 2 && results.length === 0 && !isPending && (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">No records matched &quot;{query}&quot;</p>
                  <p>Try searching by student name, roll number, or voucher ID.</p>
                </div>
              )}

              {query.length < 2 && (
                <div className="p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Quick Search: Type at least 2 characters to search live database</span>
                  <span className="font-mono text-[10px]">ESC to close</span>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-white/20" : "bg-muted"}`}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                            <p className={`text-[11px] truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight className={`h-3.5 w-3.5 ${isSelected ? "opacity-100" : "opacity-40"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Shortcut Bar */}
            <div className="px-4 py-2 bg-muted/40 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-background border font-mono text-[9px]">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-background border font-mono text-[9px]">↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-background border font-mono text-[9px]">↵</kbd> to select
                </span>
              </div>
              <span className="font-mono text-[10px]">Instant Live Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

