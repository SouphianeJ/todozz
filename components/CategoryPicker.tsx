'use client';

import React, { useEffect, useState } from 'react';

interface CategoryPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ADD_NEW_OPTION = '__category_add_new__';

const normalizeCategory = (category: string) => category.trim();

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previousSelection, setPreviousSelection] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          throw new Error('Failed to load categories');
        }
        const data: { categories: string[] } = await res.json();
        if (isMounted) {
          const uniqueCategories = Array.from(
            new Set(
              (data.categories || [])
                .map((category) => normalizeCategory(category))
                .filter((category) => category.length > 0)
            )
          ).sort((a, b) => a.localeCompare(b));
          setCategories(uniqueCategories);
        }
      } catch (error: any) {
        if (isMounted) {
          setFetchError(error.message || 'Unable to load categories');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!value) {
      return;
    }
    const normalizedValue = normalizeCategory(value);
    if (!normalizedValue) {
      return;
    }
    if (!categories.includes(normalizedValue)) {
      setIsAddingNew(true);
    }
  }, [value, categories]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (selected === ADD_NEW_OPTION) {
      setPreviousSelection(value);
      setIsAddingNew(true);
      onChange('');
      return;
    }
    setIsAddingNew(false);
    onChange(selected);
  };

  const handleStartAddingNew = () => {
    setPreviousSelection(value);
    setIsAddingNew(true);
    onChange('');
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    const fallback = previousSelection || categories[0] || '';
    onChange(fallback);
  };

  const handleNewCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const renderSelect = () => {
    if (loading) {
      return <p className="meta" role="status">Loading categories...</p>;
    }

    if (fetchError) {
      return (
        <div className="meta" role="alert">
          <p>Unable to load categories. You can still add a new one below.</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleStartAddingNew}
          >
            Add new category
          </button>
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div>
          <p className="meta">No categories yet. Create the first one:</p>
          {renderNewCategoryInput(false)}
        </div>
      );
    }

    return (
      <select id={id} value={value} onChange={handleSelectChange}>
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value={ADD_NEW_OPTION}>+ Add a new category</option>
      </select>
    );
  };

  const renderNewCategoryInput = (showCancelButton = true) => (
    <div className="category-new-input">
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleNewCategoryChange}
        placeholder={placeholder || 'Enter a new category'}
        required
      />
      {showCancelButton && categories.length > 0 && (
        <button
          type="button"
          className="button button-secondary"
          onClick={handleCancelAddNew}
        >
          Back to list
        </button>
      )}
    </div>
  );

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {isAddingNew ? renderNewCategoryInput() : renderSelect()}
    </div>
  );
};

export default CategoryPicker;
