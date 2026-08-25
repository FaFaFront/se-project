import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      errorMessage,
      className,
      wrapperClassName,
      id,
      disabled,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = useId();
    const describedByIds = [error && errorMessage ? errorId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={cn("flex flex-col gap-1", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-inter text-ink-black text-sm leading-[23px] font-semibold md:text-base md:leading-[26px]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error || ariaInvalid || undefined}
          aria-describedby={describedByIds || undefined}
          className={cn(
            "border-hairline bg-canvas font-inter text-ink-black placeholder:text-placeholder flex h-10 w-full rounded-lg border px-3 text-sm leading-[23px] transition-colors outline-none md:text-base md:leading-[26px]",
            "hover:border-primary focus:border-primary",
            "disabled:border-surface-disabled disabled:bg-surface-disabled disabled:text-placeholder disabled:hover:border-surface-disabled disabled:cursor-not-allowed",
            error && "border-error hover:border-error focus:border-error",
            className
          )}
          {...props}
        />
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
Input.displayName = "Input";

export { Input };
