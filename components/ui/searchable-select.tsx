"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string[];
};

type SearchableSelectProps = {
  label: string;
  name?: string;
  options: SearchableSelectOption[];
  value?: string;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
};

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function SearchableSelect({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Search...",
  emptyLabel = "No matches found",
  required,
  disabled,
  helperText,
}: SearchableSelectProps) {
  const generatedId = React.useId();
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const selectedValue = isControlled ? value ?? "" : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(selectedOption?.label ?? "");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  const matches = React.useMemo(() => {
    const needle = normalized(query);
    if (!needle) return options.slice(0, 8);
    return options
      .filter((option) =>
        [option.label, ...(option.keywords ?? [])]
          .map(normalized)
          .some((candidate) => candidate.includes(needle)),
      )
      .slice(0, 8);
  }, [options, query]);

  function commit(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    inputRef.current?.setCustomValidity("");
  }

  function clearSelection(nextQuery: string) {
    setQuery(nextQuery);
    if (selectedValue) commit("");
  }

  return (
    <label className="relative flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
      <span>{label}</span>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <span className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden />
        <input
          id={generatedId}
          ref={inputRef}
          value={query}
          required={required}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          className="w-full rounded-brand-md border border-neutral-300 bg-white py-2 pl-9 pr-3"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${generatedId}-options`}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            clearSelection(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            inputRef.current?.setCustomValidity(
              required && query && !selectedValue ? "Choose a contact from the search results." : "",
            );
            window.setTimeout(() => setOpen(false), 120);
          }}
        />
      </span>
      {helperText ? <span className="text-sm text-neutral-600">{helperText}</span> : null}
      {open ? (
        <div
          id={`${generatedId}-options`}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-brand-md border border-neutral-300 bg-white p-1 shadow-lg"
        >
          {matches.length > 0 ? (
            matches.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "block w-full rounded px-3 py-2 text-left text-sm hover:bg-brand-gold-pale/50",
                  option.value === selectedValue && "bg-brand-gold-pale text-brand-navy",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  commit(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-neutral-600">{emptyLabel}</p>
          )}
        </div>
      ) : null}
    </label>
  );
}
