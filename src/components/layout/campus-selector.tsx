"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CampusItem, switchActiveCampus } from "@/server/actions/campus";
import { Building2, ChevronDown, Check, Plus, MapPin } from "lucide-react";
import Link from "next/link";

interface CampusSelectorProps {
  campuses: CampusItem[];
  activeCampus: CampusItem | null;
}

export function CampusSelector({ campuses, activeCampus }: CampusSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCampus = (campusId: string) => {
    if (activeCampus && activeCampus.id === campusId) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await switchActiveCampus(campusId);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const displayName = activeCampus?.name || "Main Campus";
  const displayCode = activeCampus?.code || "CAMPUS-01";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card/60 hover:bg-muted/50 text-foreground transition-all shadow-2xs group"
        title="Switch Active Campus / Branch"
      >
        <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold leading-tight truncate max-w-[140px] text-foreground">
            {displayName}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
            {displayCode} {activeCampus?.city ? `• ${activeCampus.city}` : ""}
          </p>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl border bg-popover/95 backdrop-blur-md shadow-xl z-50 p-2 text-xs font-poppins animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1.5 border-b mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Active Campus
            </span>
            <span className="text-[10px] font-medium text-primary">
              {campuses.length} {campuses.length === 1 ? "Branch" : "Branches"}
            </span>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto py-1">
            {campuses.map((c) => {
              const isSelected = activeCampus?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCampus(c.id)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span className="font-mono font-semibold">{c.code}</span>
                        {c.city && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {c.city}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 mt-1 border-t">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add / Manage Campuses</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

