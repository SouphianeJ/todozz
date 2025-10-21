'use client'; // For useState, useEffect, and event handlers

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import TodoItem from '@/components/TodoItem';
import { TodoApiResponse } from '@/types';
import CategorySelector from '@/components/CategorySelector';


function TodoListComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [todos, setTodos] = useState<TodoApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [distinctCategories, setDistinctCategories] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentCategory = searchParams.get('category') || '';
        setFilterCategory(currentCategory); // Sync state with URL

        const res = await fetch(`/api/todo${currentCategory ? `?category=${currentCategory}` : ''}`);
        if (!res.ok) {
          throw new Error('Failed to fetch todos');
        }
        const data: TodoApiResponse[] = await res.json();
        setTodos(data);
        setActionError(null);

        // Extract distinct categories for the filter selector
        // Fetch all todos once to populate categories, or make a separate endpoint
        // For simplicity, deriving from current full list if no filter, or from filtered list
        if (!currentCategory) { // if no filter is active, all todos are fetched
            const allCategories = Array.from(new Set(data.map(todo => todo.category).filter(Boolean)));
            setDistinctCategories(allCategories);
        } else {
            // If a category is filtered, we might want to show all available categories.
            // This requires a separate fetch or fetching all initially and then filtering client-side
            // For now, let's fetch all categories if distinctCategories is empty
            if (distinctCategories.length === 0) {
                const allTodosRes = await fetch('/api/todo');
                if (allTodosRes.ok) {
                    const allTodosData: TodoApiResponse[] = await allTodosRes.json();
                    const allCategories = Array.from(new Set(allTodosData.map(todo => todo.category).filter(Boolean)));
                    setDistinctCategories(allCategories);
                }
            }
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [searchParams, distinctCategories.length]); // Re-fetch if searchParams change

  const handleCategoryFilterChange = (category: string) => {
    setFilterCategory(category);
    if (category) {
      router.push(`/?category=${encodeURIComponent(category)}`);
    } else {
      router.push('/');
    }
  };
  
  const clearFilter = () => {
    setFilterCategory('');
    router.push('/');
  };

  const handleMoveTodo = async (todoId: string, direction: 'up' | 'down') => {
    setActionError(null);

    const currentIndex = todos.findIndex((todo) => todo.id === todoId);
    if (currentIndex === -1) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= todos.length) {
      return;
    }

    const currentTodo = todos[currentIndex];
    const swapTodo = todos[swapIndex];
    const previousTodos = [...todos];

    const currentPosition = currentTodo.position;
    const swapPosition = swapTodo.position;

    const optimisticTodos = todos.map((todo, index) => {
      if (index === currentIndex) {
        return { ...swapTodo, position: currentPosition };
      }
      if (index === swapIndex) {
        return { ...currentTodo, position: swapPosition };
      }
      return todo;
    });

    setTodos(optimisticTodos);

    try {
      const [updateCurrent, updateSwap] = await Promise.all([
        fetch(`/api/todo/${currentTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: swapPosition }),
        }),
        fetch(`/api/todo/${swapTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: currentPosition }),
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

  return (
    <div>
      <h2>My Todos</h2>
      {actionError && (
        <p className="error-message" role="alert">{actionError}</p>
      )}
      <div style={{ marginBottom: 'var(--spacing-unit)', display: 'flex', gap: 'var(--spacing-unit)', alignItems: 'center' }}>
        <CategorySelector
            id="categoryFilter"
            label="Filter by Category:"
            value={filterCategory}
            onChange={handleCategoryFilterChange}
            suggestions={distinctCategories}
            placeholder="All Categories"
        />
        {filterCategory && (
            <button onClick={clearFilter} className="button button-secondary" style={{alignSelf: 'flex-end', marginBottom:'calc(var(--spacing-unit) * 0.25)'}}>
                Clear Filter
            </button>
        )}
      </div>

      {todos.length === 0 ? (
        <p>No todos found. <Link href="/todo/new">Create one?</Link></p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onMove={(direction) => handleMoveTodo(todo.id, direction)}
              disableMoveUp={index === 0}
              disableMoveDown={index === todos.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}


export default function HomePage() {
    return (
        // Suspense boundary for useSearchParams
        <Suspense fallback={<p>Loading page...</p>}>
            <TodoListComponent />
        </Suspense>
    );
}