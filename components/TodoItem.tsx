'use client';

import Link from 'next/link';
import { TodoApiResponse } from '@/types'; // Using ApiResponse type for client display

interface TodoItemProps {
  todo: TodoApiResponse;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const completedTasks = todo.checklist.filter(item => item.checked).length;
  const totalTasks = todo.checklist.length;

  return (
    <li className="todo-item-card">
      <Link href={`/todo/${todo.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3>{todo.title}</h3>
      </Link>
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