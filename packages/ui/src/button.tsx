import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        variant === "outline"
          ? "border border-input bg-background hover:bg-accent"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      } ${className}`}
      {...props}
    />
  );
}
