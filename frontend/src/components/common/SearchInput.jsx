import React, { useState, useEffect, useRef } from 'react';

/**
 * A compact, toggleable search component that expands from an icon.
 */
export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen && !localValue) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (!localValue) {
        setIsOpen(false);
      }
      inputRef.current.blur();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="flex items-center">
      <div className={`relative flex items-center transition-all duration-300 ${isOpen ? 'w-48 sm:w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="form-input text-xs py-1.5 pl-8 pr-8 w-full shadow-sm"
        />
        <div className="absolute left-2.5 text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {localValue && (
          <button
            onClick={() => { setLocalValue(''); onChange(''); inputRef.current.focus(); }}
            className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        onClick={handleToggle}
        className={`p-2 rounded-md transition-colors ${isOpen ? 'text-blue-600 bg-blue-50 ml-1' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title="Search"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );
}
