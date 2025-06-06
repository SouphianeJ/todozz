'use client';

import React from 'react';
import { ChecklistItemType } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>; // 👈 nouveau
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onTextChange,
  onDelete,
  isEditing,
  dragHandleProps,
}) => {
  return (
    <div className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {isEditing && (
        <button
          type="button"
          {...dragHandleProps}
          aria-label="Drag to reorder"
          style={{
            cursor: 'grab',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '1.25rem',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ☰
        </button>
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
        <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.text}`}>
          &times;
        </button>
      )}
    </div>
  );
};

export default ChecklistItem;