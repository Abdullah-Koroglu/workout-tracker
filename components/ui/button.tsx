import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-[4px] px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "default" &&
            "bg-gradient-to-br from-primary to-[hsl(24_95%_60%)] text-primary-foreground shadow-[0_10px_28px_-18px_rgba(249,115,22,0.95)] hover:brightness-105",
          variant === "outline" &&
            "border border-[color:color-mix(in_oklab,hsl(var(--border))_40%,transparent)] bg-card/90 text-foreground hover:bg-accent/70",
          variant === "ghost" && "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
