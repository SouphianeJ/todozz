import { NextResponse, NextRequest } from 'next/server';
import { db, todosCollection, doc, serverTimestamp, FieldValue } from '@/lib/firebase';
import { getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Todo, TodoDocument, ChecklistItemType } from '@/types';

interface RouteParams {
  params: { id: string };
}

// Helper to convert Firestore Timestamps to ISO strings
function serializeTodoDocument(docData: Omit<TodoDocument, 'id'>, id: string): Omit<TodoDocument, 'createdAt' | 'updatedAt'> & { id:string, createdAt: string, updatedAt: string } {
  return {
    id,
    title: docData.title,
    description: docData.description,
    category: docData.category,
    subCategory: docData.subCategory,
    assignee: docData.assignee,
    checklist: docData.checklist,
    createdAt: (docData.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (docData.updatedAt as Timestamp).toDate().toISOString(),
  };
}


// GET /api/todo/[id] - Get a single todo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Todo ID is required' }, { status: 400 });
    }

    const todoDocRef = doc(todosCollection, id);
    const docSnap = await getDoc(todoDocRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }
    
    const todoData = docSnap.data() as Omit<TodoDocument, 'id'>;
     // Ensure checklist items have IDs
    const checklistWithIds: ChecklistItemType[] = (todoData.checklist || []).map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${Date.now()}`, 
    }));


    return NextResponse.json(serializeTodoDocument({...todoData, checklist: checklistWithIds}, id));
  } catch (error) {
    console.error(`Error fetching todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch todo', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/todo/[id] - Update a todo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Todo ID is required' }, { status: 400 });
    }

    const todoData = (await request.json()) as Partial<Todo>;
    
    if (Object.keys(todoData).length === 0) {
        return NextResponse.json({ message: 'No data provided for update' }, { status: 400 });
    }
    if (todoData.title !== undefined && !todoData.title.trim()) {
        return NextResponse.json({ message: 'Title cannot be empty' }, { status: 400 });
    }
    
    // Ensure checklist items have IDs if checklist is part of the update
    let checklistWithIds: ChecklistItemType[] | undefined = undefined;
    if (todoData.checklist) {
      checklistWithIds = (todoData.checklist || []).map((item, index) => ({
        ...item,
        id: item.id || `item-${index}-${Date.now()}` 
      }));
    }

    const updatedTodo = {
      ...todoData,
      ...(checklistWithIds && { checklist: checklistWithIds }),
      updatedAt: serverTimestamp() as FieldValue,
    };

    const todoDocRef = doc(todosCollection, id);
    // Check if doc exists before update (optional, updateDoc won't fail if it doesn't exist but won't create it)
    // const docSnap = await getDoc(todoDocRef);
    // if (!docSnap.exists()) {
    //   return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    // }

    await updateDoc(todoDocRef, updatedTodo);

    return NextResponse.json({ id, message: 'Todo updated successfully' });
  } catch (error) {
    console.error(`Error updating todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update todo', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/todo/[id] - Delete a todo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Todo ID is required' }, { status: 400 });
    }

    const todoDocRef = doc(todosCollection, id);
    // Optional: Check if doc exists before delete
    // const docSnap = await getDoc(todoDocRef);
    // if (!docSnap.exists()) {
    //   return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    // }
    await deleteDoc(todoDocRef);

    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting todo ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete todo', error: (error as Error).message }, { status: 500 });
  }
}