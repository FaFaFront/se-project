import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label content; may include links. Clicking non-link text toggles the box. */
  label: ReactNode;
  error?: boolean;
  errorMessage?: string;
  wrapperClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      errorMessage,
      className,
      wrapperClassName,
      id,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = useId();
    const describedBy = [error && errorMessage ? errorId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("flex flex-col gap-1", wrapperClassName)}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error || ariaInvalid || undefined}
            aria-describedby={describedBy || undefined}
            className={cn(
              "border-hairline accent-primary mt-[3px] size-4 shrink-0 cursor-pointer rounded-sm border",
              "disabled:cursor-not-allowed",
              error && "outline-error outline outline-1",
              className
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className="font-inter text-ink-black text-sm leading-[23px] md:text-base md:leading-[26px]"
          >
            {label}
          </label>
        </div>
        {error && errorMessage && (
          <span
            id={errorId}
            role="alert"
            className="font-inter text-error text-xs leading-[23px] sm:text-sm"
          >
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
