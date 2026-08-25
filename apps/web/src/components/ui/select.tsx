"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: Array<string | SelectOption>;
  value?: string;
  defaultValue?: string;
  defaultOpen?: boolean;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  name?: string;
  className?: string;
}

const Select = ({
  label,
  placeholder = "เลือกคณะ",
  options,
  value,
  defaultValue = "",
  defaultOpen = false,
  onValueChange,
  disabled = false,
  error = false,
  errorMessage,
  name,
  className,
}: SelectProps) => {
  const id = useId();
  const errorId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const items = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const [highlighted, setHighlighted] = useState(-1);
  const currentValue = value ?? internalValue;
  const selected = items.find((item) => item.value === currentValue);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const choose = (item: SelectOption) => {
    if (item.disabled) return;
    if (value === undefined) setInternalValue(item.value);
    onValueChange?.(item.value);
    setOpen(false);
  };

  const nextEnabled = (start: number, direction: 1 | -1) => {
    for (let step = 1; step <= items.length; step += 1) {
      const index = (start + step * direction + items.length) % items.length;
      if (!items[index]?.disabled) return index;
    }
    return -1;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((index) => nextEnabled(index, event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && highlighted >= 0) choose(items[highlighted]);
      else setOpen((state) => !state);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("font-inter relative flex w-[200px] flex-col gap-1", className)}
    >
      {label && (
        <label htmlFor={id} className="text-ink-black text-sm leading-[23px]">
          {label}
        </label>
      )}
      {name && <input type="hidden" name={name} value={currentValue} />}

      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-invalid={error || undefined}
        aria-describedby={error && errorMessage ? errorId : undefined}
        disabled={disabled}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={handleKeyDown}
        className={cn(
          "border-hairline text-ink-black flex h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-[10px] border bg-white px-3 text-left text-base leading-[26px] outline-none transition-colors",
          "hover:border-primary focus-visible:border-primary",
          "disabled:border-surface-disabled disabled:bg-surface-disabled disabled:text-placeholder disabled:cursor-not-allowed",
          open && "border-primary",
          error && "border-error hover:border-error focus-visible:border-error"
        )}
      >
        <span className={cn("truncate", !selected && "text-placeholder")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "text-placeholder size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && !disabled && (
        <ul
          id={`${id}-options`}
          role="listbox"
          className="border-hairline absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-auto rounded-[10px] border bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
        >
          {items.map((item, index) => (
            <li
              key={item.value}
              role="option"
              aria-selected={item.value === currentValue}
              aria-disabled={item.disabled || undefined}
              onMouseEnter={() => !item.disabled && setHighlighted(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
              className={cn(
                "text-ink-black cursor-pointer select-none rounded-md px-2 py-1.5 text-base leading-[26px]",
                highlighted === index && "bg-primary/10 text-primary",
                item.value === currentValue && "bg-primary text-white",
                item.disabled && "pointer-events-none opacity-50"
              )}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {error && errorMessage && (
        <span id={errorId} role="alert" className="text-error text-xs leading-[18px]">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export { Select };
