"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/app/_hooks/useDebounce";

interface SearchFilterProps {
  value: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "Suche...",
  className = "w-full md:max-w-[200px]",
  debounceMs = 300,
}: SearchFilterProps) {
  const [input, setInput] = useState(value);
  const debouncedInput = useDebounce(input, debounceMs);

  useEffect(() => {
    onChange(debouncedInput || null);
  }, [debouncedInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. clear all)
  useEffect(() => {
    if (value !== input && value === "") {
      setInput("");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className={`h-8 ${className}`}
    />
  );
}
