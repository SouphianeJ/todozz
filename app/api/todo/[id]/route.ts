// File: app/api/todo/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { todosCollection, FieldValue, Timestamp } from '@/lib/firestoreService';
import { Todo, TodoApiResponse, ChecklistItemType } from '@/types';

interface RouteParams {
  params: { id: string };
}

// Convert any Firestore-admin Timestamp (ou objet sérialisé) en ISO string
function toIsoDate(ts: any): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  // cas où le timestamp est déjà sérialisé en objet { _seconds, _nanoseconds }
  if (typeof ts === 'object' && '_seconds' in ts) {
    return new Timestamp(ts._seconds, ts._nanoseconds).toDate().toISOString();
  }
  // fallback si c’est déjà une string ou autre
  return new Date(ts).toISOString();
}

function resolvePosition(data: any): number {
  if (typeof data.position === 'number') {
    return data.position;
  }

  const createdAtSource = data.createdAt;

  if (createdAtSource instanceof Timestamp) {
    return createdAtSource.toDate().getTime();
  }

  if (typeof createdAtSource === 'object' && createdAtSource && '_seconds' in createdAtSource) {
    return new Timestamp(createdAtSource._seconds, createdAtSource._nanoseconds).toDate().getTime();
  }

  const createdAtDate = createdAtSource ? new Date(createdAtSource) : null;
  if (createdAtDate && !Number.isNaN(createdAtDate.getTime())) {
    return createdAtDate.getTime();
  }

  return Date.now();
}

function formatDateInput(date: Date | null): string | null {
  if (!(date instanceof Date)) {
    return null;
  }

  const time = date.getTime();
  if (!Number.isFinite(time)) {
    return null;
  }

  return new Date(time).toISOString().slice(0, 10);
}

function normalizeExpirationDate(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Timestamp) {
    return formatDateInput(value.toDate());
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return formatDateInput(value.toDate());
    }

    if (typeof value._seconds === 'number') {
      const nanos = typeof value._nanoseconds === 'number' ? value._nanoseconds : 0;
      return formatDateInput(new Timestamp(value._seconds, nanos).toDate());
    }

    if (typeof value.seconds === 'number') {
      const milliseconds =
        value.seconds * 1000 + Math.floor((typeof value.nanoseconds === 'number' ? value.nanoseconds : 0) / 1_000_000);
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
}

// On retourne désormais un TodoApiResponse (ISO strings) et non un TodoDocument
function serializeTodoDocument(data: any, id: string): TodoApiResponse {
  const checklistWithIds: ChecklistItemType[] = (data.checklist || []).map((item: any, index: number) => ({
    ...item,
    id: item.id || `item-${index}-${Date.now()}`,
    expirationDate: normalizeExpirationDate(item.expirationDate),
  }));

  return {
    id,
    title: data.title,
    description: data.description,
    category:
      typeof data.category === 'string' ? data.category.trim() : data.category,
    subCategory:
      typeof data.subCategory === 'string'
        ? data.subCategory.trim()
        : data.subCategory,
    assignee: data.assignee,
    checklist: checklistWithIds,
    position: resolvePosition(data),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const docRef = todosCollection.doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    const data = docSnap.data()!;
    return NextResponse.json(serializeTodoDocument(data, params.id));
  } catch (error) {
    console.error(`Error fetching todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch todo', error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const todoData = (await request.json()) as Partial<Todo>;
    if (!todoData || Object.keys(todoData).length === 0) {
      return NextResponse.json({ message: 'No data provided for update' }, { status: 400 });
    }
    if (todoData.title !== undefined && !todoData.title.trim()) {
      return NextResponse.json({ message: 'Title cannot be empty' }, { status: 400 });
    }

    let checklistWithIds: ChecklistItemType[] | undefined;
    if (todoData.checklist) {
      checklistWithIds = todoData.checklist.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}`,
      }));
    }

    const docRef = todosCollection.doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    const existingData = docSnap.data() || {};

    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (todoData.title !== undefined) {
      updatePayload.title = todoData.title.trim();
    }

    if (todoData.description !== undefined) {
      updatePayload.description = todoData.description;
    }

    if (todoData.assignee !== undefined) {
      updatePayload.assignee = todoData.assignee;
    }

    if (checklistWithIds) {
      updatePayload.checklist = checklistWithIds;
    }

    let positionOverride: number | undefined;

    if (todoData.category !== undefined) {
      const trimmedCategory = todoData.category.trim();
      updatePayload.category = trimmedCategory;

      const previousCategory =
        typeof existingData.category === 'string'
          ? existingData.category.trim()
          : '';

      if (
        trimmedCategory &&
        trimmedCategory.length > 0 &&
        trimmedCategory !== previousCategory
      ) {
        positionOverride = -Date.now();
      }
    }

    if (todoData.subCategory !== undefined) {
      updatePayload.subCategory = todoData.subCategory.trim();
    }

    if (todoData.position !== undefined) {
      updatePayload.position = todoData.position;
    }

    if (positionOverride !== undefined) {
      updatePayload.position = positionOverride;
    }

    await docRef.update(updatePayload);

    return NextResponse.json({ id: params.id, message: 'Todo updated successfully' });
  } catch (error) {
    console.error(`Error updating todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update todo', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const docRef = todosCollection.doc(params.id);
    await docRef.delete();
    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error(`Error deleting todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete todo', error: String(error) }, { status: 500 });
  }
}