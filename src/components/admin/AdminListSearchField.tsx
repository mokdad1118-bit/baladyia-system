"use client";

import { cn } from "@/lib/cn";

export function AdminListSearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("max-w-md", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="gov-input w-full px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--gov-primary)]"
        dir="auto"
        autoComplete="off"
      />
    </div>
  );
}
