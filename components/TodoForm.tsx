'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Todo, ChecklistItemType, ASSIGNEES, Assignee, TodoDocument } from '@/types';
import ChecklistItem from './ChecklistItem';
import CategorySelector from './CategorySelector';
import CategoryPicker from './CategoryPicker';

import {
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const generateId = () => Math.random().toString(36).substr(2, 9);

const isCourseSubCategory = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === 'courses' || normalized === 'course';
};

const formatDateInput = (date: Date | null): string | null => {
  if (!(date instanceof Date)) {
    return null;
  }

  const time = date.getTime();
  if (!Number.isFinite(time)) {
    return null;
  }

  return new Date(time).toISOString().slice(0, 10);
};

const normalizeExpirationDate = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return formatDateInput(value);
  }

  if (typeof value === 'object') {
    const maybeTimestamp = value as { [key: string]: any };

    if (typeof maybeTimestamp.toDate === 'function') {
      return formatDateInput(maybeTimestamp.toDate());
    }

    const secondsField =
      typeof maybeTimestamp._seconds === 'number'
        ? maybeTimestamp._seconds
        : typeof maybeTimestamp.seconds === 'number'
        ? maybeTimestamp.seconds
        : null;

    if (secondsField !== null) {
      const nanosecondsField =
        typeof maybeTimestamp._nanoseconds === 'number'
          ? maybeTimestamp._nanoseconds
          : typeof maybeTimestamp.nanoseconds === 'number'
          ? maybeTimestamp.nanoseconds
          : 0;

      const milliseconds = secondsField * 1000 + Math.floor(nanosecondsField / 1_000_000);
      return formatDateInput(new Date(milliseconds));
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return formatDateInput(new Date(parsed));
  }

  return null;
};

const sanitizeChecklistForSave = (
  items: ChecklistItemType[],
  allowExpirationDates: boolean,
) =>
  items
    .filter((item) => item.text.trim() !== '')
    .map((item) => {
      let expirationDate: string | null = null;

      if (allowExpirationDates && item.checked) {
        expirationDate = normalizeExpirationDate(item.expirationDate);
      }

      return {
        ...item,
        expirationDate,
      };
    });

interface TodoFormProps {
  initialData?: TodoDocument | null;
}

interface ChecklistItemWrapperProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  showExpirationInput: boolean;
  onExpirationChange: (id: string, newDate: string | null) => void;
}

const SortableChecklistItem: React.FC<ChecklistItemWrapperProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'manipulation',
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f9f9f9' : undefined,
    borderRadius: '6px',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ChecklistItem
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
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

  const [lastSavedData, setLastSavedData] = useState<string | null>(null); // 👈 auto-save tracking

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setSubCategory(initialData.subCategory);
      setAssignee(initialData.assignee);
      setChecklist(
        initialData.checklist.map((item) => ({
          ...item,
          id: item.id || generateId(),
          expirationDate: normalizeExpirationDate(item.expirationDate ?? null),
        }))
      );
    }
  }, [initialData]);

  useEffect(() => {
    if (isCourseSubCategory(subCategory)) {
      return;
    }

    setChecklist((items) =>
      items.map((item) =>
        item.expirationDate
          ? {
              ...item,
              expirationDate: null,
            }
          : item
      )
    );
  }, [subCategory]);

  // ✅ Auto-save logic
  useEffect(() => {
    const interval = setInterval(() => {
      const sanitizedCategory = category.trim();
      const sanitizedSubCategory = subCategory.trim();
      const isCoursesSubCategory = isCourseSubCategory(sanitizedSubCategory);
      const currentData: Todo = {
        title,
        description,
        category: sanitizedCategory,
        subCategory: sanitizedSubCategory,
        assignee,
        checklist: sanitizeChecklistForSave(checklist, isCoursesSubCategory),
      };
      const json = JSON.stringify(currentData);
      if (json !== lastSavedData) {
        autoSave(currentData);
        setLastSavedData(json);
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [title, description, category, subCategory, assignee, checklist, lastSavedData]);

  const autoSave = async (data: Todo) => {
    if (!isEditing || !initialData?.id) return;
    try {
      await fetch(`/api/todo/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleAddChecklistItem = () => {
    setChecklist([
      ...checklist,
      { id: generateId(), text: '', checked: false, expirationDate: null },
    ]);
  };

  const handleChecklistChange = (id: string, newText: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  const handleChecklistToggle = (id: string) => {
    setChecklist(
      checklist.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextChecked = !item.checked;
        return {
          ...item,
          checked: nextChecked,
          expirationDate: nextChecked
            ? normalizeExpirationDate(item.expirationDate ?? null)
            : null,
        };
      })
    );
  };

  const handleChecklistExpirationChange = (id: string, newDate: string | null) => {
    const normalizedDate = normalizeExpirationDate(newDate);
    setChecklist(
      checklist.map((item) =>
        item.id === id
          ? {
              ...item,
              expirationDate: normalizedDate,
            }
          : item
      )
    );
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedSubCategory = subCategory.trim();

    if (!trimmedTitle) {
      setError('Title is required.');
      setIsSubmitting(false);
      return;
    }

    if (!trimmedCategory) {
      setError('Category is required.');
      setIsSubmitting(false);
      return;
    }

    const isCoursesSubCategory = isCourseSubCategory(trimmedSubCategory);
    const todoData: Todo = {
      title: trimmedTitle,
      description,
      category: trimmedCategory,
      subCategory: trimmedSubCategory,
      assignee,
      checklist: sanitizeChecklistForSave(checklist, isCoursesSubCategory),
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
    if (!initialData?.id) return;
    if (!confirm('Are you sure you want to delete this todo?')) return;

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

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = checklist.findIndex((i) => i.id === active.id);
      const newIndex = checklist.findIndex((i) => i.id === over?.id);
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

      <CategoryPicker
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
          <SortableContext
            items={checklist.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {checklist.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                onToggle={handleChecklistToggle}
                onTextChange={handleChecklistChange}
                onDelete={handleDeleteChecklistItem}
                isEditing={true}
                showExpirationInput={isCourseSubCategory(subCategory)}
                onExpirationChange={handleChecklistExpirationChange}
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
          {isSubmitting
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
            ? 'Save Changes'
            : 'Create Todo'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="button button-danger"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Delete Todo
          </button>
        )}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TodoForm;