'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Todo, ChecklistItemType, ASSIGNEES, Assignee, TodoDocument } from '@/types';
import ChecklistItem from './ChecklistItem';
import CategorySelector from './CategorySelector';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

interface TodoFormProps {
  initialData?: TodoDocument | null;
}

interface ChecklistItemWrapperProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
}

const SortableChecklistItem: React.FC<ChecklistItemWrapperProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChecklistItem {...props} />
    </div>
  );
};

const TodoForm: React.FC<TodoFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [assignee, setAssignee] = useState<Assignee>(ASSIGNEES[0]);
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setSubCategory(initialData.subCategory);
      setAssignee(initialData.assignee);
      setChecklist(initialData.checklist.map(item => ({ ...item, id: item.id || generateId() })));
    }
  }, [initialData]);

  const handleAddChecklistItem = () => {
    setChecklist([...checklist, { id: generateId(), text: '', checked: false }]);
  };

  const handleChecklistChange = (id: string, newText: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  const handleChecklistToggle = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      setIsSubmitting(false);
      return;
    }

    const todoData: Todo = {
      title,
      description,
      category,
      subCategory,
      assignee,
      checklist: checklist.filter(item => item.text.trim() !== ''),
    };

    try {
      const url = isEditing ? `/api/todo/${initialData?.id}` : '/api/todo';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save todo');
      }

      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !initialData.id) return;
    if (!confirm("Are you sure you want to delete this todo?")) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/todo/${initialData.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete todo');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = checklist.findIndex(i => i.id === active.id);
      const newIndex = checklist.findIndex(i => i.id === over?.id);
      setChecklist((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'var(--danger-color)' }}>Error: {error}</p>}

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <CategorySelector
        id="category"
        label="Category"
        value={category}
        onChange={setCategory}
        placeholder="e.g., Work, Personal"
      />

      <CategorySelector
        id="subCategory"
        label="Sub-Category"
        value={subCategory}
        onChange={setSubCategory}
        placeholder="e.g., Project X, Groceries"
      />

      <div className="form-group">
        <label htmlFor="assignee">Assignee</label>
        <select
          id="assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value as Assignee)}
        >
          {ASSIGNEES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <h3>Checklist</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={checklist.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {checklist.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                onToggle={handleChecklistToggle}
                onTextChange={handleChecklistChange}
                onDelete={handleDeleteChecklistItem}
                isEditing={true}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={handleAddChecklistItem}
          className="button button-secondary"
          style={{ marginTop: 'var(--spacing-unit)' }}
        >
          Add Checklist Item
        </button>
      </div>

      <div className="button-group">
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Todo')}
        </button>
        {isEditing && (
          <button type="button" className="button button-danger" onClick={handleDelete} disabled={isSubmitting}>
            Delete Todo
          </button>
        )}
        <button type="button" className="button button-secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TodoForm;