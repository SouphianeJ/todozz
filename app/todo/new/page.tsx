import React from 'react';
import TodoForm from '@/components/TodoForm';

// This page could pre-fetch distinct categories/subcategories if needed for CategorySelector suggestions
// async function getDistinctCategories() {
//   // const res = await fetch('/api/categories'); // Example endpoint
//   // return res.json();
//   return { categories: ['Work', 'Personal', 'Study'], subCategories: ['Project A', 'Groceries'] };
// }

export default async function NewTodoPage() {
  // const { categories, subCategories } = await getDistinctCategories();

  return (
    <div>
      <h2>Create New Todo</h2>
      <TodoForm 
        // distinctCategories={categories} 
        // distinctSubCategories={subCategories} 
      />
    </div>
  );
}