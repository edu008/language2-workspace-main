import React from 'react';
import { cn } from '../../pages/api/auth/lib/utils';
const TextField = ({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  maxLength,
  type = 'text'
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={cn(
        "w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-300",
        disabled && "bg-wg-neutral-100 cursor-not-allowed opacity-75",
        className
      )}
    />
  );
};

export default TextField;