import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm md:text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-canvas hover:opacity-90",
        secondary: "bg-surface-lavender text-ink hover:opacity-90",
        outline: "border border-ink bg-canvas text-ink hover:opacity-90",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            size,
            className,
          })
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span
            className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-label="Loading"
          />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
