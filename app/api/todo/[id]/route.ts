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

// On retourne désormais un TodoApiResponse (ISO strings) et non un TodoDocument
function serializeTodoDocument(data: any, id: string): TodoApiResponse {
  const checklistWithIds: ChecklistItemType[] = (data.checklist || []).map((item: any, index: number) => ({
    ...item,
    id: item.id || `item-${index}-${Date.now()}`,
  }));

  return {
    id,
    title: data.title,
    description: data.description,
    category: data.category,
    subCategory: data.subCategory,
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

    const updatePayload = {
      ...todoData,
      ...(checklistWithIds && { checklist: checklistWithIds }),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = todosCollection.doc(params.id);
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