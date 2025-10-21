'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { TodoApiResponse } from '@/types'; // Using ApiResponse type for client display

interface TodoItemProps {
  todo: TodoApiResponse;
  onMove: (direction: 'up' | 'down') => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onMove, disableMoveUp = false, disableMoveDown = false }) => {
  const completedTasks = todo.checklist.filter(item => item.checked).length;
  const totalTasks = todo.checklist.length;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleMove = (direction: 'up' | 'down') => {
    if ((direction === 'up' && disableMoveUp) || (direction === 'down' && disableMoveDown)) {
      return;
    }
    onMove(direction);
    setMenuOpen(false);
  };

  return (
    <li className="todo-item-card">
      <div className="todo-item-card-header">
        <Link href={`/todo/${todo.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
          <h3>{todo.title}</h3>
        </Link>
        <div className="todo-item-card-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="todo-item-card-menu-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Open actions for ${todo.title}`}
            onClick={() => setMenuOpen(prev => !prev)}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="todo-item-card-menu" role="menu">
              <button
                type="button"
                className="todo-item-card-menu-item"
                onClick={() => handleMove('up')}
                disabled={disableMoveUp}
                role="menuitem"
              >
                <span aria-hidden="true">▲</span>
                <span className="todo-item-card-menu-item-label">Move up</span>
              </button>
              <button
                type="button"
                className="todo-item-card-menu-item"
                onClick={() => handleMove('down')}
                disabled={disableMoveDown}
                role="menuitem"
              >
                <span aria-hidden="true">▼</span>
                <span className="todo-item-card-menu-item-label">Move down</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="meta">
        <strong>Category:</strong> {todo.category}
        {todo.subCategory && ` / ${todo.subCategory}`}
      </p>
      <p className="meta"><strong>Assignee:</strong> {todo.assignee}</p>
      {totalTasks > 0 && (
        <p className="meta">
          <strong>Checklist:</strong> {completedTasks} / {totalTasks} completed
        </p>
      )}
      <p className="meta">
        <strong>Last Updated:</strong> {new Date(todo.updatedAt).toLocaleDateString()}
      </p>
      <div className="actions">
        <Link href={`/todo/${todo.id}`} className="button">
          View / Edit
        </Link>
      </div>
    </li>
  );
};

export default TodoItem;