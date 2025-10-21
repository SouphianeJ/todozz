// File: app/api/todo/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { todosCollection, FieldValue, Timestamp } from '@/lib/firestoreService';
import { Todo, TodoApiResponse, ChecklistItemType } from '@/types';

// Helper pour convertir n'importe quel Timestamp admin (ou objet sérialisé) en ISO string
function toIsoDate(ts: any): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'object' && '_seconds' in ts) {
    return new Timestamp(ts._seconds, ts._nanoseconds).toDate().toISOString();
  }
  return new Date(ts).toISOString();
}

// Sérialise un document Firestore en TodoApiResponse
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

function serializeTodoDocument(docSnap: FirebaseFirestore.DocumentSnapshot): TodoApiResponse {
  const data = docSnap.data()!;
  const checklistWithIds: ChecklistItemType[] = (data.checklist || []).map((item: any, idx: number) => ({
    ...item,
    id: item.id || `item-${idx}-${Date.now()}`,
  }));

  return {
    id: docSnap.id,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let queryRef: FirebaseFirestore.Query = todosCollection;
    if (category) {
      queryRef = todosCollection.where('category', '==', category);
    }

    const snapshot = await queryRef.get();
    const todos: TodoApiResponse[] = [];

    snapshot.forEach((docSnap) => {
      todos.push(serializeTodoDocument(docSnap));
    });

    // Tri décroissant par position pour garder les items les plus "haut" en premier
    todos.sort((a, b) => b.position - a.position);

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ message: 'Failed to fetch todos', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const todoData = (await request.json()) as Todo;
    if (!todoData.title?.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const checklistWithIds: ChecklistItemType[] = (todoData.checklist || []).map((item, idx) => ({
      ...item,
      id: item.id || `item-${idx}-${Date.now()}`,
    }));

    const newTodo = {
      ...todoData,
      checklist: checklistWithIds,
      position: typeof todoData.position === 'number' ? todoData.position : Date.now(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await todosCollection.add(newTodo);
    return NextResponse.json({ id: docRef.id, message: 'Todo created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ message: 'Failed to create todo', error: String(error) }, { status: 500 });
  }
}