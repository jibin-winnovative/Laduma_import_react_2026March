import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
}

export const MultiSelect = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  label,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const getLabel = (value: string) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white cursor-pointer focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent"
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {selectedValues.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            selectedValues.map(value => (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-black rounded text-xs font-medium"
                style={{ backgroundColor: 'rgb(219 234 254 / var(--tw-bg-opacity, 1))' }}
              >
                {getLabel(value)}
                <button
                  onClick={(e) => removeValue(value, e)}
                  className="hover:opacity-70 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                style={isSelected ? { backgroundColor: 'rgb(219 234 254 / var(--tw-bg-opacity, 1))' } : {}}
              >
                <span className="text-sm text-black">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-black" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
