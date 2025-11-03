'use client';

import React from 'react';
import { ChecklistItemType } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onExpirationChange?: (id: string, date: string | null) => void;
  showExpirationField?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>; // Poignée sur span (meilleur contrôle inline)
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onTextChange,
  onDelete,
  isEditing,
  onExpirationChange,
  showExpirationField = false,
  dragHandleProps,
}) => {
  return (
    <div
      className="checklist-item"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      {isEditing && (
        <span
          {...dragHandleProps}
          aria-label="Drag to reorder"
          style={{
            cursor: 'grab',
            userSelect: 'none',
            fontSize: '1.2rem',
            padding: '0 4px',
            touchAction: 'none', // 👈 empêche le scroll pendant le drag
          }}
        >
          ☰
        </span>
      )}
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        aria-label={`Mark ${item.text} as ${item.checked ? 'incomplete' : 'complete'}`}
      />
      {isEditing ? (
        <input
          type="text"
          value={item.text}
          onChange={(e) => onTextChange(item.id, e.target.value)}
          className={item.checked ? 'item-text-checked' : ''}
          placeholder="Checklist item text"
        />
      ) : (
        <span className={item.checked ? 'item-text-checked' : ''}>
          {item.text}
        </span>
      )}
      {isEditing && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label={`Delete ${item.text}`}
        >
          &times;
        </button>
      )}
      {isEditing && showExpirationField && item.checked && onExpirationChange && (
        <input
          type="date"
          value={item.expirationDate ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onExpirationChange(item.id, value ? value : null);
          }}
          aria-label={`Set expiration date for ${item.text}`}
        />
      )}
    </div>
  );
};

export default ChecklistItem;