import { todosCollection } from './firestoreService';

export interface CourseExpirationEntry {
  todoId: string;
  todoTitle: string;
  itemId: string;
  itemText: string;
  expirationDate: string;
}

const isCoursesSubCategory = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === 'courses' || normalized === 'course';
};

const isValidDateString = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
};

export const fetchCourseExpirationEntries = async (): Promise<CourseExpirationEntry[]> => {
  const snapshot = await todosCollection.get();
  const entries: CourseExpirationEntry[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data() || {};

    if (!isCoursesSubCategory(data.subCategory)) {
      return;
    }

    const checklist: any[] = Array.isArray(data.checklist) ? data.checklist : [];

    checklist.forEach((item) => {
      if (!item || !item.checked || !isValidDateString(item.expirationDate)) {
        return;
      }

      entries.push({
        todoId: doc.id,
        todoTitle: typeof data.title === 'string' ? data.title : 'Untitled',
        itemId: typeof item.id === 'string' ? item.id : '',
        itemText: typeof item.text === 'string' ? item.text : '',
        expirationDate: item.expirationDate,
      });
    });
  });

  entries.sort((a, b) => {
    const aTime = Date.parse(a.expirationDate);
    const bTime = Date.parse(b.expirationDate);
    return aTime - bTime;
  });

  return entries;
};
