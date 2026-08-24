import { useId, useState } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const textSize = "text-sm leading-[23px] md:text-base md:leading-[26px]";

export interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: string[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  name?: string;
  className?: string;
  triggerClassName?: string;
}

const MultiSelect = ({
  label,
  placeholder,
  options,
  value,
  defaultValue,
  onValueChange,
  defaultOpen,
  open,
  onOpenChange,
  disabled,
  error,
  errorMessage,
  name,
  className,
  triggerClassName,
}: MultiSelectProps) => {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const selected = value ?? internalValue;

  const labelId = useId();
  const triggerId = useId();
  const errorId = useId();

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((v) => v !== option)
      : [...selected, option];
    if (value === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <span id={labelId} className={cn("font-ibm-plex text-foreground font-medium", textSize)}>
          {label}
        </span>
      )}
      <DropdownMenuPrimitive.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
        <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
          {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- error state still needs to be exposed on the trigger; upgrading to a full combobox role/aria-controls/aria-expanded contract is out of scope here */}
          <button
            type="button"
            id={triggerId}
            disabled={disabled}
            aria-invalid={error}
            aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
            aria-describedby={error && errorMessage ? errorId : undefined}
            className={cn(
              "border-border font-ibm-plex group flex h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border bg-white px-3 py-0 transition-colors outline-none",
              textSize,
              selected.length > 0 ? "text-foreground" : "text-placeholder",
              "hover:border-primary-light data-[state=open]:border-primary",
              "disabled:bg-border disabled:text-placeholder disabled:hover:border-border disabled:cursor-not-allowed",
              error && "border-error hover:border-error data-[state=open]:border-error",
              triggerClassName
            )}
          >
            <span className="truncate">
              {selected.length > 0 ? `เลือกแล้ว ${selected.length}` : placeholder}
            </span>
            <ChevronDown className="text-placeholder size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            sideOffset={4}
            className="border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 w-[var(--radix-dropdown-menu-trigger-width,12.5rem)] rounded-lg border bg-white p-1.5 shadow-black"
          >
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <DropdownMenuPrimitive.CheckboxItem
                  key={option}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => toggle(option)}
                  onSelect={(e) => e.preventDefault()}
                  className={cn(
                    "group font-ibm-plex text-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 outline-none select-none",
                    textSize,
                    "data-[highlighted]:bg-primary-lighter",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[2px] border",
                      checked
                        ? "border-primary bg-primary"
                        : "border-foreground-secondary/30 group-data-[highlighted]:border-primary"
                    )}
                  >
                    {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  {option}
                </DropdownMenuPrimitive.CheckboxItem>
              );
            })}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
      {name &&
        selected.map((option) => <input key={option} type="hidden" name={name} value={option} />)}
      {error && errorMessage && (
        <span id={errorId} className="font-ibm-plex text-error text-xs leading-[23px] sm:text-sm">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export { MultiSelect };
