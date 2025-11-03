'use client';

import React from 'react';
import { ChecklistItemType } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>; // Poignée sur span (meilleur contrôle inline)
  showExpirationInput?: boolean;
  onExpirationChange?: (id: string, newDate: string | null) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onTextChange,
  onDelete,
  isEditing,
  dragHandleProps,
  showExpirationInput = false,
  onExpirationChange,
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
      {showExpirationInput && item.checked && (
        <input
          type="date"
          value={item.expirationDate ?? ''}
          onChange={(event) =>
            onExpirationChange?.(
              item.id,
              event.target.value ? event.target.value : null,
            )
          }
          aria-label={`Set expiration date for ${item.text}`}
        />
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
    </div>
  );
};

export default ChecklistItem;