import React from 'react';
import { cn } from '../../pages/api/auth/lib/utils';
const CheckboxGroup = ({
  options,
  selectedValues,
  onChange,
  className,
  columns = 1,
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn(
      "grid gap-2",
      gridCols[columns],
      "animate-fade-in",
      className
    )}>
      {options.map((option) => (
        <div key={option.id} className="flex items-center">
          <input
            type="checkbox"
            id={option.id}
            value={option.value}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => onChange(option.value, e.target.checked)}
            className="w-4 h-4 text-wg-blue-500 rounded border-wg-neutral-300 focus:ring-wg-blue-400"
          />
          <label 
            htmlFor={option.id} 
            className="ml-2 text-base text-wg-neutral-800"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default CheckboxGroup;