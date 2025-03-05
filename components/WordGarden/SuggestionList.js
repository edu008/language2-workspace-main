import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../pages/api/auth/lib/utils';

const SuggestionList = ({
  suggestions,
  onSelect,
  onCancel,
  className,
  maxHeight = "max-h-80"
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-30 w-full mt-1 animate-float-in">
      <div 
        className={cn(
          "flex flex-wrap bg-white border border-wg-neutral-200 rounded-lg shadow-lg p-3 overflow-y-auto relative",
          maxHeight,
          className
        )}
      >
        {/* Cancel button */}
        <button 
          onClick={onCancel}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-wg-neutral-100 transition-colors duration-200"
          aria-label="Close suggestions"
        >
          <X size={16} className="text-wg-neutral-500" />
        </button>
        
        {suggestions.map((item, index) => (
          <div
            key={index}
            onClick={() => onSelect(item)}
            className="cursor-pointer m-1 px-3 py-2 border border-wg-neutral-200 rounded-lg bg-wg-neutral-50 hover:bg-wg-blue-50 hover:border-wg-blue-200 transition-colors duration-200"
          >
            {item.Word}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionList;