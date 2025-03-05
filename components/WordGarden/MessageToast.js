import React, { useEffect } from 'react';
import { cn } from '../../pages/api/auth/lib/utils';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const MessageToast = ({
  message,
  type = 'success',
  onClose,
  duration = 5000,
  className,
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-wg-blue-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-wg-blue-50 border-wg-blue-200';
      default:
        return 'bg-white border-wg-neutral-200';
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg border animate-float-in',
        getBgColor(),
        className
      )}
    >
      <div className="flex items-center">
        {getIcon()}
        <p className="mx-3 font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-wg-neutral-500 hover:text-wg-neutral-700"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MessageToast;