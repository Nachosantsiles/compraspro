"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Opciones que nunca se filtran (ej: "＋ Agregar nueva...") */
  pinnedOptions?: SearchableOption[];
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccioná...",
  disabled = false,
  required = false,
  pinnedOptions = [],
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, openUp: false });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  // Opciones filtradas y ordenadas alfabéticamente
  const filtered = options
    .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  const allVisible = [...filtered, ...pinnedOptions];

  // Montar portal solo en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcular posición al abrir
  function calcPos() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 260; // max estimado
    const spaceBelow = viewportHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setPos({
      top: openUp ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUp,
    });
  }

  // Recalcular posición al hacer scroll/resize mientras está abierto
  useEffect(() => {
    if (!open) return;
    function update() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 260;
      const spaceBelow = viewportHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setPos({
        top: openUp ? rect.top + window.scrollY - dropdownHeight - 4 : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUp,
      });
    }
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        listRef.current && !listRef.current.closest("[data-searchable-dropdown]")?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Reset highlight cuando cambia el query
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  function handleOpen() {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          handleOpen();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, allVisible.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allVisible[highlighted]) handleSelect(allVisible[highlighted].value);
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, allVisible, highlighted]
  );

  // Scroll al ítem resaltado
  useEffect(() => {
    const item = listRef.current?.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const dropdown = (
    <div
      data-searchable-dropdown
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Buscador */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar..."
            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 text-sm leading-none">×</button>
          )}
        </div>
      </div>

      {/* Lista */}
      <ul ref={listRef} className="max-h-48 overflow-y-auto py-1">
        {allVisible.length === 0 ? (
          <li className="px-3 py-2 text-xs text-gray-400 text-center">Sin resultados</li>
        ) : (
          allVisible.map((opt, idx) => {
            const isPinned = pinnedOptions.some((p) => p.value === opt.value);
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                {isPinned && idx > 0 && <div className="border-t border-gray-100 mx-2 my-1" />}
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    idx === highlighted ? "bg-gray-100" : "hover:bg-gray-50",
                    isSelected && "font-semibold text-gray-900",
                    isPinned && "text-blue-600 text-xs font-medium"
                  )}
                >
                  {isSelected && !isPinned && (
                    <span className="mr-1.5 text-gray-400">✓</span>
                  )}
                  {opt.label}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-lg border bg-white text-left flex items-center justify-between gap-2 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
          open ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-300 hover:border-gray-400",
          !value && "text-gray-400"
        )}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <svg
          className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Portal dropdown */}
      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  );
}
