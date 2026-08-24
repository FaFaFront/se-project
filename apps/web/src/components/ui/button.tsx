import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center h-10 gap-2.5 rounded-full px-6 py-2 font-inter font-semibold text-sm md:text-base transition-colors cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/[0.8]",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink-black/[0.07]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant }), disabled && "opacity-50", className)}
      aria-busy={isLoading ?? undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
