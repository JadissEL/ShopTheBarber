import React from "react";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/utils";

const FormError = ({ message, id }) => {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-red-500 mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1 fade-in duration-200">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
      {message}
    </p>
  );
};

export const FormField = ({
  control,
  name,
  label,
  description,
  render,
  className,
  required,
}) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className={cn("space-y-2", className)}>
          {label && (
            <Label 
              htmlFor={name} 
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                error && "text-red-500"
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          
          <div className="relative">
            {render({ 
              ...field, 
              id: name, 
              "aria-invalid": !!error,
              "aria-describedby": error ? `${name}-error` : description ? `${name}-desc` : undefined,
              className: cn(
                field.className, // Merge className from render prop if passed via styled components or whatever
                error && "border-red-500 focus-visible:ring-red-500"
              )
            })}
          </div>

          {description && !error && (
            <p id={`${name}-desc`} className="text-[0.8rem] text-muted-foreground">
              {description}
            </p>
          )}
          
          <FormError id={`${name}-error`} message={error?.message} />
        </div>
      )}
    />
  );
};

// Simple wrapper for select content to handle the onValueChange impedance mismatch
export const FormSelect = ({ field, onValueChange, children, ...props }) => {
  return React.cloneElement(children, {
    ...props,
    onValueChange: (val) => {
      field.onChange(val);
      onValueChange?.(val);
    },
    value: field.value
  });
};