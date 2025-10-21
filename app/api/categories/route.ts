import { NextResponse } from 'next/server';
import { todosCollection } from '@/lib/firestoreService';

export async function GET() {
  try {
    const snapshot = await todosCollection.select('category').get();
    const categories = new Set<string>();

    snapshot.forEach((doc) => {
      const category = doc.get('category');
      if (typeof category === 'string') {
        const trimmed = category.trim();
        if (trimmed.length > 0) {
          categories.add(trimmed);
        }
      }
    });

    const sortedCategories = Array.from(categories).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({ categories: sortedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch categories',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
