import { NextResponse, NextRequest } from 'next/server';
import { db, todosCollection, serverTimestamp, FieldValue } from '@/lib/firebase';
import { addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Todo, TodoDocument, ChecklistItemType } from '@/types';

// Helper to convert Firestore Timestamps to ISO strings
function serializeTodoDocument(doc: TodoDocument): Omit<TodoDocument, 'createdAt' | 'updatedAt'> & { createdAt: string, updatedAt: string } {
  return {
    ...doc,
    createdAt: doc.createdAt.toDate().toISOString(),
    updatedAt: doc.updatedAt.toDate().toISOString(),
  };
}


// GET /api/todo - List all todos, optionally filter by category
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let q = query(todosCollection);
    if (category) {
      q = query(todosCollection, where('category', '==', category));
    }

    const querySnapshot = await getDocs(q);
    const todos: TodoDocument[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure checklist items have IDs if they were missing (for older data perhaps)
      const data = doc.data() as Omit<TodoDocument, 'id'>;
      const checklistWithIds: ChecklistItemType[] = (data.checklist || []).map((item, index) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}`, // Fallback id generation
      }));

      todos.push({ id: doc.id, ...data, checklist: checklistWithIds } as TodoDocument);
    });

    // Sort by createdAt descending (newest first)
    todos.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    return NextResponse.json(todos.map(serializeTodoDocument));
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json({ message: 'Failed to fetch todos', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/todo - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const todoData = (await request.json()) as Todo;

    if (!todoData.title) {
        return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }
    
    // Ensure checklist items have IDs
    const checklistWithIds: ChecklistItemType[] = (todoData.checklist || []).map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${Date.now()}` // Generate ID if missing
    }));

    const newTodo = {
      ...todoData,
      checklist: checklistWithIds,
      createdAt: serverTimestamp() as FieldValue,
      updatedAt: serverTimestamp() as FieldValue,
    };

    const docRef = await addDoc(todosCollection, newTodo);
    
    // For the response, we can't directly return serverTimestamp.
    // We'd ideally fetch the doc again, or return a representation.
    // For simplicity, returning the ID and a success message.
    return NextResponse.json({ id: docRef.id, message: 'Todo created successfully' }, { status: 201 });

  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ message: 'Failed to create todo', error: (error as Error).message }, { status: 500 });
  }
}