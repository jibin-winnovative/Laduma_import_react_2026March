import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: number | string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: number | string | null;
  onChange: (value: number | string | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  disabled = false,
  id,
  name,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission and browser autofill */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value ?? ''}
      />
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white hover:border-gray-400'
        } ${error ? 'border-red-400' : 'border-gray-300'} ${
          isOpen ? 'ring-2 ring-[var(--color-primary)] border-transparent' : ''
        }`}
      >
        <span
          className={`truncate ${selectedOption ? 'text-[var(--color-text)]' : 'text-gray-400'}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    option.value === value
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'hover:bg-gray-50 text-[var(--color-text)]'
                  }`}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
