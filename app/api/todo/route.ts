import { NextResponse, NextRequest } from 'next/server';
import { todosCollection, FieldValue, Timestamp } from '@/lib/firestoreService';
import { Todo, TodoDocument, ChecklistItemType } from '@/types';

// Helper to serialize Firestore Timestamp
function serializeTodoDocument(doc: FirebaseFirestore.DocumentSnapshot): TodoDocument {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const snapshot = await todosCollection.get();
    const todos: TodoDocument[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const checklistWithIds: ChecklistItemType[] = (data.checklist || []).map((item: any, index: number) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}`
      }));

      todos.push({
        ...serializeTodoDocument(doc),
        checklist: checklistWithIds,
      } as TodoDocument);
    });

    todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    const checklistWithIds: ChecklistItemType[] = (todoData.checklist || []).map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${Date.now()}`
    }));

    const newTodo = {
      ...todoData,
      checklist: checklistWithIds,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await todosCollection.add(newTodo);
    return NextResponse.json({ id: docRef.id, message: 'Todo created successfully' }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ message: 'Failed to create todo', error: String(error) }, { status: 500 });
  }
}