'use client';

import React from 'react';
import { ChecklistItemType } from '@/types';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onTextChange,
  onDelete,
  isEditing,
}) => {
  return (
    <div className="checklist-item">
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