import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, fullWidth = false, options, ...props }, ref) => {
    return (
      <div className={clsx("space-y-1", { "w-full": fullWidth })}>
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <select
          className={clsx(
            // Base styles - mobile-first with large touch targets
            "block rounded-lg border border-gray-300 px-4 py-3",
            "text-base bg-white",
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "disabled:bg-gray-50 disabled:text-gray-500",
            "min-h-[44px]", // Minimum 44px for mobile touch targets

            // Error state
            {
              "border-red-300 focus:border-red-500 focus:ring-red-500": error,
            },

            // Full width
            {
              "w-full": fullWidth,
            },

            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
