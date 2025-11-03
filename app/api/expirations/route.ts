import { NextResponse } from 'next/server';
import { fetchCourseExpirationEntries } from '@/lib/courseExpiration';

export async function GET() {
  try {
    const entries = await fetchCourseExpirationEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching course expirations:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch course expirations',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
