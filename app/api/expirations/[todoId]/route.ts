import { NextResponse, NextRequest } from 'next/server';
import { fetchTodoExpirationDates } from '@/lib/courseExpiration';

interface RouteParams {
  params: { todoId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const expirationDates = await fetchTodoExpirationDates(params.todoId);
    return NextResponse.json(expirationDates);
  } catch (error) {
    console.error(`Error fetching expiration dates for todo ${params.todoId}:`, error);
    return NextResponse.json(
      {
        message: 'Failed to fetch expiration dates',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
