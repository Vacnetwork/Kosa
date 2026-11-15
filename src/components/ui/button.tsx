import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * One button shape on the whole site: square corners, no shadow, no gradient.
 * The accent fill is reserved for the page's single primary action.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-[family-name:var(--font-display)] font-bold text-[15px] leading-none transition-colors disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-3 focus-visible:outline-offset-3 active:translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-gold text-navy hover:bg-gold-soft active:bg-gold-soft",
        ink: "bg-navy text-white hover:bg-navy-deep active:bg-navy-deep",
        outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white active:bg-navy-deep active:text-white",
        quiet: "text-navy underline decoration-2 underline-offset-4 hover:text-navy-deep active:text-navy-deep",
        onDark: "bg-white text-navy hover:bg-paper active:bg-paper-dim",
        danger: "bg-danger text-white hover:bg-danger-deep active:bg-danger-deep",
      },
      size: {
        sm: "h-11 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-base",
        block: "h-14 w-full px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
