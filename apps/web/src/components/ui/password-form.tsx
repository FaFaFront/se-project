"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordFormProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  size?: "desktop" | "mobile";
}

const PasswordForm = React.forwardRef<HTMLInputElement, PasswordFormProps>(
  (
    {
      label = "รหัสผ่าน",
      placeholder = "กรอกรหัสผ่าน",
      error = false,
      errorMessage = "เกิดข้อผิดพลาด",
      size = "desktop",
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isDesktop = size === "desktop";

    return (
      <div
        className={cn(
          "flex w-[400px] flex-col items-start justify-center gap-1 rounded-[10px]",
          className
        )}
      >
        {label && (
          <label
            className={cn(
              "font-medium text-ink-black",
              isDesktop ? "text-base leading-[26px]" : "text-sm leading-[23px]"
            )}
            style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "flex h-10 w-full flex-row items-center justify-between gap-2.5 rounded-[10px] border px-3 transition-colors",
            error
              ? "border-error bg-canvas"
              : disabled
                ? "border-[rgba(221,221,221,0.5)] bg-[rgba(221,221,221,0.5)]"
                : "border-hairline bg-canvas hover:border-primary focus-within:border-primary"
          )}
        >
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent font-normal text-ink-black outline-none placeholder:text-placeholder disabled:cursor-not-allowed",
              isDesktop ? "text-base leading-[26px]" : "text-sm leading-[23px]"
            )}
            style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
            {...props}
          />

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <Eye className={cn("h-4 w-4", disabled ? "text-placeholder" : "text-ink-black")} />
            ) : (
              <EyeOff className={cn("h-4 w-4", disabled ? "text-placeholder" : "text-ink-black")} />
            )}
          </button>
        </div>

        {error && errorMessage && (
          <span
            className={cn(
              "font-medium text-error",
              isDesktop ? "text-sm leading-[23px]" : "text-xs leading-[20px]"
            )}
            style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          >
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);
PasswordForm.displayName = "PasswordForm";

export { PasswordForm };
