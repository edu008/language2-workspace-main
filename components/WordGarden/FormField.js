import React from 'react';
import { cn } from '../../pages/api/auth/lib/utils';
const FormField = ({ id, label, children, className, helpText }) => {
  return (
    <div className={cn("mb-5 animate-float-in", className)}>
      <label htmlFor={id} className="block text-base font-medium text-wg-neutral-800 mb-1.5">
        {label}
      </label>
      {children}
      {helpText && (
        <p className="mt-1 text-sm text-wg-neutral-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;