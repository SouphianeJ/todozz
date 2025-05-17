'use client';

import React from 'react';

interface CategorySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[]; // Optional list of existing categories/subcategories
  placeholder?: string;
  id: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
  id
}) => {
  const datalistId = `${id}-suggestions`;

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={suggestions.length > 0 ? datalistId : undefined}
        placeholder={placeholder || `Enter or select ${label.toLowerCase()}`}
      />
      {suggestions.length > 0 && (
        <datalist id={datalistId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default CategorySelector;