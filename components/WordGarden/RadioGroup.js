import React from 'react';
import { cn } from '../../pages/api/auth/lib/utils';
const RadioGroup = ({
  name,
  options,
  selectedValue,
  onChange,
  className,
  inline = false,
}) => {
  return (
    <div className={cn(
      "flex flex-col gap-2 animate-fade-in",
      inline && "flex-row flex-wrap gap-4",
      className
    )}>
      {options.map((option) => (
        <div key={option.id} className="flex items-center">
          <input
            type="radio"
            id={option.id}
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => onChange(option.value)}
            className="w-4 h-4 text-wg-blue-500 border-wg-neutral-300 focus:ring-wg-blue-400"
          />
          <label htmlFor={option.id} className="ml-2 text-base text-wg-neutral-800">
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default RadioGroup;