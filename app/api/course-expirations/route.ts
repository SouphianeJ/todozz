import { NextResponse } from 'next/server';
import { courseExpirationsCollection, Timestamp } from '@/lib/firestoreService';

interface CourseExpirationEntry {
  id: string;
  todoId: string;
  todoTitle: string;
  itemId: string;
  itemText: string;
  expirationDate: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const toIsoString = (value: any): string | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'object' && '_seconds' in value) {
    const ts = new Timestamp(value._seconds, value._nanoseconds);
    return ts.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

export async function GET() {
  try {
    const snapshot = await courseExpirationsCollection
      .orderBy('expirationDate', 'asc')
      .get();

    const entries: CourseExpirationEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        todoId: data.todoId,
        todoTitle: data.todoTitle,
        itemId: data.itemId,
        itemText: data.itemText,
        expirationDate: data.expirationDate,
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
      };
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching course expirations:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch course expirations',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
