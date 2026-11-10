import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  wrapperClassName?: string;
  /** Show a `current / maxLength` counter under the field. Needs `maxLength`. */
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
    const errorId = useId();
    const countId = useId();
    const textareaId = id ?? generatedId;
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
    const mergedAriaInvalid = error || ariaInvalid;

    return (
      <div className={cn("font-inter flex flex-col gap-1", wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-ink-black text-sm font-semibold leading-[23px] md:text-base md:leading-[26px]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          aria-invalid={mergedAriaInvalid}
          aria-describedby={describedByIds || undefined}
          className={cn(
            "border-hairline bg-canvas text-ink-black placeholder:text-placeholder flex min-h-24 w-full resize-y items-start rounded-[10px] border p-3 text-sm leading-[23px] outline-none transition-colors md:text-base md:leading-[26px]",
            "hover:border-primary focus:border-primary",
            "disabled:border-surface-disabled disabled:bg-surface-disabled disabled:text-placeholder disabled:hover:border-surface-disabled disabled:cursor-not-allowed disabled:resize-none",
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
                className="text-error text-xs leading-[20px] md:text-sm md:leading-[23px]"
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
                  "shrink-0 text-xs leading-[20px] tabular-nums",
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
Textarea.displayName = "Textarea";

export { Textarea };
