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


  if (loading) return <p>Loading todos...</p>;
  if (error) return <p>Error loading todos: {error}</p>;

  return (
    <div>
      <h2>My Todos</h2>
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
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
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