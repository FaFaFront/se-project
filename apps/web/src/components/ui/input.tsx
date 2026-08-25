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
      <div className={cn("flex flex-col gap-2", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-ibm-plex-sans-thai text-ink text-lg leading-[27px] font-semibold md:text-xl md:leading-[27px]"
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
            "border-hairline bg-canvas font-ibm-plex-sans-thai text-ink placeholder:text-placeholder flex h-[52px] w-full rounded-xl border px-4 text-lg leading-[27px] transition-colors outline-none md:text-xl md:leading-[30px]",
            "hover:border-primary focus:border-primary",
            "disabled:border-hairline disabled:bg-[#eeeeee] disabled:text-placeholder disabled:cursor-not-allowed disabled:hover:border-hairline",
            error && "border-error hover:border-error focus:border-error",
            className
          )}
          {...props}
        />
        {error && errorMessage && (
          <span
            id={errorId}
            role="alert"
            className="font-ibm-plex-sans-thai text-error text-base leading-6 md:text-lg md:leading-[27px]"
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
