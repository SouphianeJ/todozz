import Link from 'next/link';
import { fetchCourseExpirationEntries } from '@/lib/courseExpiration';

export const revalidate = 0;

export default async function ExpirationsPage() {
  const entries = await fetchCourseExpirationEntries();

  return (
    <main>
      <div className="header">
        <h1>Course Expiration Dates</h1>
        <Link href="/" className="button button-secondary">
          ← Back to dashboard
        </Link>
      </div>

      {entries.length === 0 ? (
        <p>No completed course checklist items have expiration dates yet.</p>
      ) : (
        <div className="table-container">
          <table className="course-expiration-table">
            <thead>
              <tr>
                <th scope="col">Expiration date</th>
                <th scope="col">Checklist item</th>
                <th scope="col">Todo</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.todoId}-${entry.itemId}`}>
                  <td>{new Date(entry.expirationDate).toLocaleDateString()}</td>
                  <td>{entry.itemText || 'Untitled item'}</td>
                  <td>
                    <Link href={`/todo/${entry.todoId}`}>
                      {entry.todoTitle || 'Untitled todo'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
