'use client'; // For useEffect, useState

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TodoForm from '@/components/TodoForm';
import { TodoApiResponse, TodoDocument } from '@/types'; // Using ApiResponse for fetch, then converting

// Helper to convert API response (string dates) to TodoDocument (Timestamp objects)
// For the form, we might not strictly need Timestamp objects if the form handles strings,
// but initialData for TodoForm expects TodoDocument which has Timestamps.
// However, TodoForm currently consumes string dates fine from TodoApiResponse,
// because it doesn't directly use the Timestamp objects, only their string representations if passed.
// For consistency, let's assume TodoForm is robust enough or we ensure data compatibility.
// The current TodoForm implementation actually expects initialData as TodoDocument,
// but its useEffect only uses fields that are common or easily convertible.
// Let's simplify and pass TodoApiResponse directly, form will adapt or we adjust form.
// The current form uses initialData: TodoDocument. Let's stick to that.

// The form expects TodoDocument, which has Firestore Timestamps.
// API returns TodoApiResponse with string dates.
// We'll fetch the data and pass it to the form.
// The form itself doesn't re-serialize dates to Timestamps, that's an API concern.

async function getTodoById(id: string): Promise<TodoApiResponse | null> {
  try {
    const res = await fetch(`/api/todo/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch todo');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching todo for edit:", error);
    return null; // Or rethrow to be caught by component
  }
}


// The TodoForm expects `initialData` of type `TodoDocument | null`.
// `TodoApiResponse` has string dates, `TodoDocument` has `Timestamp` objects.
// For simplicity within this generation, the `TodoForm` has been made robust
// to handle string dates from an API response if `initialData` were of `TodoApiResponse` type.
// However, to strictly match the type, one would convert string dates to `Timestamp` objects
// or adjust `TodoForm`'s `initialData` prop type.
// Given current `TodoForm` logic, it primarily reads string values and `checklist`.
// Dates are not directly manipulated in the form in a way that requires `Timestamp` objects.

export default function EditTodoPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const [todoData, setTodoData] = useState<TodoDocument | null | undefined>(undefined); // undefined for loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchTodo = async () => {
        try {
          const data = await getTodoById(id);
          if (data) {
            // Convert TodoApiResponse to TodoDocument for the form
            // This is a simplified conversion; real Timestamps are complex objects.
            // For form usage, string dates are often sufficient.
            // The form's initialData type is TodoDocument, so we make a best effort.
            // The crucial part for the form is having the data. Firestore Timestamps
            // are mainly for DB interaction.
            const initialFormData: TodoDocument = {
                ...data,
                createdAt: new Date(data.createdAt) as any, // Casting for simplicity
                updatedAt: new Date(data.updatedAt) as any, // Casting for simplicity
            };
            setTodoData(initialFormData);
          } else {
            setError('Todo not found.');
            setTodoData(null); // Explicitly set to null if not found
          }
        } catch (err: any) {
          setError(err.message);
          setTodoData(null);
        }
      };
      fetchTodo();
    }
  }, [id]);

  if (todoData === undefined) { // Loading state
    return <p>Loading todo details...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!todoData) { // Not found or other critical error preventing data load
    return <p>Todo not found or could not be loaded.</p>;
  }
  

  return (
    <div>
      <h2>Edit Todo</h2>
      <TodoForm initialData={todoData} />
    </div>
  );
}