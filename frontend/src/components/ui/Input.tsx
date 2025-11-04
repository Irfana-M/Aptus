import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
