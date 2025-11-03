'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface CourseExpirationEntry {
  id: string;
  todoId: string;
  todoTitle: string;
  itemId: string;
  itemText: string;
  expirationDate: string;
  updatedAt?: string | null;
}

const formatDate = (value: string) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

export default function CourseExpirationsPage() {
  const [entries, setEntries] = useState<CourseExpirationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch('/api/course-expirations');
        if (!response.ok) {
          throw new Error('Failed to load expiration data');
        }
        const data: CourseExpirationEntry[] = await response.json();
        setEntries(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load expiration data');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div>
      <h2>Course Expiration Dates</h2>
      <p>
        <Link href="/" className="button button-secondary">
          ← Back to todos
        </Link>
      </p>
      {loading && <p>Loading expiration dates...</p>}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && entries.length === 0 && (
        <p>No course checklist items with expiration dates yet.</p>
      )}
      {!loading && !error && entries.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Expiration Date</th>
                <th>Todo</th>
                <th>Checklist Item</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.expirationDate)}</td>
                  <td>{entry.todoTitle}</td>
                  <td>{entry.itemText}</td>
                  <td>{entry.updatedAt ? formatDate(entry.updatedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
