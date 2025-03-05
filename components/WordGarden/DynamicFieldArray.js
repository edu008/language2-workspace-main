import React from 'react';
import Button from './Button';
import { cn } from '../../pages/api/auth/lib/utils';
import { PlusCircle, X } from 'lucide-react';

const DynamicFieldArray = ({
  items,
  onAdd,
  onRemove,
  renderItem,
  title,
  className,
  itemClassName
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-wg-neutral-800">{title}</h3>
        <Button 
          variant="subtle" 
          size="sm" 
          onClick={onAdd} 
          icon={<PlusCircle size={16} />}
        >
          Hinzufügen
        </Button>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              "relative p-4 rounded-lg border border-wg-neutral-200 bg-wg-neutral-50 animate-scale-in",
              itemClassName
            )}
          >
            {index > 0 && (
              <button
                onClick={() => onRemove(index)}
                className="absolute right-2 top-2 text-wg-neutral-500 hover:text-red-500 transition-colors"
                aria-label="Remove"
              >
                <X size={18} />
              </button>
            )}
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicFieldArray;