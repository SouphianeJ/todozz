'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TodoItem from '@/components/TodoItem';
import { TodoApiResponse } from '@/types';

const CATEGORY_ALL = 'All';
const CATEGORY_UNCATEGORIZED = 'Uncategorized';

const getCategoryLabel = (category?: string | null) => {
  if (typeof category !== 'string') {
    return CATEGORY_UNCATEGORIZED;
  }
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : CATEGORY_UNCATEGORIZED;
};

function TodoListComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [todos, setTodos] = useState<TodoApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORY_ALL);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/todo');
        if (!res.ok) {
          throw new Error('Failed to fetch todos');
        }
        const data: TodoApiResponse[] = await res.json();

        const sanitizedTodos = data.map((todo) => ({
          ...todo,
          category:
            typeof todo.category === 'string' ? todo.category.trim() : todo.category,
          subCategory:
            typeof todo.subCategory === 'string'
              ? todo.subCategory.trim()
              : todo.subCategory,
        }));

        setTodos(sanitizedTodos);
        setActionError(null);

        const categorySet = new Set<string>();
        sanitizedTodos.forEach((todo) => {
          categorySet.add(getCategoryLabel(todo.category));
        });
        const sortedCategories = Array.from(categorySet).sort((a, b) =>
          a.localeCompare(b)
        );
        setCategories(sortedCategories);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch todos');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (!categoryFromUrl) {
      setActiveCategory(CATEGORY_ALL);
      return;
    }

    const normalized = categoryFromUrl.trim();
    if (!normalized) {
      setActiveCategory(CATEGORY_ALL);
      return;
    }

    if (normalized === CATEGORY_UNCATEGORIZED) {
      setActiveCategory(CATEGORY_UNCATEGORIZED);
      return;
    }

    if (categories.includes(normalized)) {
      setActiveCategory(normalized);
      return;
    }

    setActiveCategory(CATEGORY_ALL);
  }, [searchParams, categories]);

  const todosByCategory = useMemo(() => {
    const grouped = new Map<string, TodoApiResponse[]>();
    const sortedTodos = [...todos].sort((a, b) => b.position - a.position);
    sortedTodos.forEach((todo) => {
      const categoryKey = getCategoryLabel(todo.category);
      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, []);
      }
      grouped.get(categoryKey)!.push(todo);
    });
    return grouped;
  }, [todos]);

  const handleTabChange = (categoryName: string) => {
    if (categoryName === activeCategory) {
      return;
    }
    setActiveCategory(categoryName);
    setActionError(null);

    if (categoryName === CATEGORY_ALL) {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleMoveTodo = async (todoId: string, direction: 'up' | 'down') => {
    setActionError(null);

    if (activeCategory === CATEGORY_ALL) {
      setActionError('Select a category tab to reorder todos.');
      return;
    }

    const categoryTodos = (todosByCategory.get(activeCategory) || []).slice();
    const currentIndex = categoryTodos.findIndex((todo) => todo.id === todoId);
    if (currentIndex === -1) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= categoryTodos.length) {
      return;
    }

    const currentTodo = categoryTodos[currentIndex];
    const swapTodo = categoryTodos[swapIndex];
    const previousTodos = [...todos];

    const updatedTodos = todos.map((todo) => {
      if (todo.id === currentTodo.id) {
        return { ...todo, position: swapTodo.position };
      }
      if (todo.id === swapTodo.id) {
        return { ...todo, position: currentTodo.position };
      }
      return todo;
    });

    setTodos(updatedTodos);

    try {
      const [updateCurrent, updateSwap] = await Promise.all([
        fetch(`/api/todo/${currentTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: swapTodo.position }),
        }),
        fetch(`/api/todo/${swapTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: currentTodo.position }),
        }),
      ]);

      if (!updateCurrent.ok || !updateSwap.ok) {
        throw new Error('Failed to persist reorder');
      }
    } catch (persistError) {
      console.error('Failed to reorder todo:', persistError);
      setTodos(previousTodos);
      setActionError('Failed to reorder todo. Please try again.');
    }
  };

  if (loading) return <p>Loading todos...</p>;
  if (error) return <p>Error loading todos: {error}</p>;

  const tabCategories = [CATEGORY_ALL, ...categories.filter((name) => name !== CATEGORY_ALL)];

  const renderTodosForCategory = (categoryName: string) => {
    if (categoryName === CATEGORY_ALL) {
      if (todos.length === 0) {
        return (
          <p>
            No todos found. <Link href="/todo/new">Create one?</Link>
          </p>
        );
      }

      return categories.map((category) => {
        const items = todosByCategory.get(category) || [];
        if (items.length === 0) {
          return null;
        }
        return (
          <section key={category} className="category-section">
            <h3>{category}</h3>
            <ul className="todo-list">
              {items.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onMove={(direction) => handleMoveTodo(todo.id, direction)}
                  disableMoveUp
                  disableMoveDown
                />
              ))}
            </ul>
          </section>
        );
      });
    }

    const items = todosByCategory.get(categoryName) || [];
    if (items.length === 0) {
      return (
        <p>
          No todos in this category yet.{' '}
          <Link href="/todo/new">Create one?</Link>
        </p>
      );
    }

    return (
      <ul className="todo-list">
        {items.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onMove={(direction) => handleMoveTodo(todo.id, direction)}
            disableMoveUp={index === 0}
            disableMoveDown={index === items.length - 1}
          />
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h2>My Todos</h2>
      <div style={{ marginBottom: 'var(--spacing-unit)' }}>
        <Link href="/course-expirations" className="button button-secondary">
          View Course Expirations
        </Link>
      </div>
      {actionError && (
        <p className="error-message" role="alert">
          {actionError}
        </p>
      )}
      <div className="category-tabs" role="tablist" aria-label="Todo categories">
        {tabCategories.map((categoryName) => {
          const isActive = activeCategory === categoryName;
          return (
            <button
              key={categoryName}
              type="button"
              className={`category-tab${isActive ? ' is-active' : ''}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(categoryName)}
            >
              {categoryName}
            </button>
          );
        })}
      </div>

      <div className="category-content" role="tabpanel">
        {renderTodosForCategory(activeCategory)}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<p>Loading page...</p>}>
      <TodoListComponent />
    </Suspense>
  );
}
