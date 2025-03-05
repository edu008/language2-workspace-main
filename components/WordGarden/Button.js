import React from 'react';
import { cn } from '../../pages/api/auth/lib/utils';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-wg-blue-500 text-white hover:bg-wg-blue-600',
    secondary: 'bg-wg-neutral-200 text-wg-neutral-800 hover:bg-wg-neutral-300',
    outline: 'bg-transparent border border-wg-neutral-300 text-wg-neutral-800 hover:bg-wg-neutral-100',
    subtle: 'bg-transparent text-wg-neutral-700 hover:bg-wg-neutral-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 rounded-md',
    md: 'text-base px-4 py-2 rounded-lg',
    lg: 'text-lg px-6 py-3 rounded-lg',
  };

  return (
    <button
      className={cn(
        'font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </button>
  );
};

export default Button;