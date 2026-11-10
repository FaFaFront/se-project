import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  wrapperClassName?: string;
  /** Show a `current / maxLength` counter under the field. Needs `maxLength`. */
  showCount?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      errorMessage,
      className,
      wrapperClassName,
      showCount,
      id,
      disabled,
      maxLength,
      value,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = useId();
    const countId = useId();
    const counting = Boolean(showCount && maxLength !== undefined);
    const length = String(value ?? "").length;
    const atLimit = counting && length >= (maxLength ?? 0);
    const describedByIds = [
      error && errorMessage ? errorId : undefined,
      counting ? countId : undefined,
      ariaDescribedBy,
    ]
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
          maxLength={maxLength}
          value={value}
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
        {((error && errorMessage) || counting) && (
          <div className="flex items-start justify-between gap-2">
            {error && errorMessage ? (
              <span
                id={errorId}
                role="alert"
                className="font-inter text-error text-xs leading-[23px] sm:text-sm"
              >
                {errorMessage}
              </span>
            ) : (
              <span />
            )}
            {counting && (
              <span
                id={countId}
                className={cn(
                  "font-inter shrink-0 text-xs leading-[23px] tabular-nums",
                  atLimit ? "text-error font-semibold" : "text-placeholder"
                )}
              >
                {length} / {maxLength}
                {atLimit && " — character limit reached"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
