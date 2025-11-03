import { ChecklistItemType } from '@/types';
import { courseExpirationsCollection, db, FieldValue } from './firestoreService';

const COURSES_SUBCATEGORY = 'courses';

const normalizeSubCategory = (value: string | undefined | null): string => {
  if (!value) {
    return '';
  }
  return value.trim().toLowerCase();
};

interface SyncOptions {
  todoId: string;
  todoTitle: string;
  subCategory?: string;
  checklist: ChecklistItemType[];
}

export async function deleteCourseExpirationsForTodo(todoId: string) {
  const snapshot = await courseExpirationsCollection.where('todoId', '==', todoId).get();
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function syncCourseExpirationEntries({
  todoId,
  todoTitle,
  subCategory,
  checklist,
}: SyncOptions) {
  const normalizedSubCategory = normalizeSubCategory(subCategory);

  const existingSnapshot = await courseExpirationsCollection
    .where('todoId', '==', todoId)
    .get();

  const existingDocIds = new Set<string>();
  existingSnapshot.forEach((doc) => existingDocIds.add(doc.id));

  const batch = db.batch();
  const shouldTrackExpiration = normalizedSubCategory === COURSES_SUBCATEGORY;
  const itemIdsToKeep = new Set<string>();
  let hasOperations = false;

  if (shouldTrackExpiration) {
    checklist.forEach((item) => {
      if (!item.checked || !item.expirationDate) {
        return;
      }
      const docId = `${todoId}_${item.id}`;
      const docRef = courseExpirationsCollection.doc(docId);
      itemIdsToKeep.add(docId);

      const payload: Record<string, any> = {
        todoId,
        todoTitle,
        itemId: item.id,
        itemText: item.text,
        expirationDate: item.expirationDate,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!existingDocIds.has(docId)) {
        payload.createdAt = FieldValue.serverTimestamp();
      }

      batch.set(docRef, payload, { merge: true });
      hasOperations = true;
    });
  }

  existingDocIds.forEach((docId) => {
    if (!itemIdsToKeep.has(docId)) {
      const docRef = courseExpirationsCollection.doc(docId);
      batch.delete(docRef);
      hasOperations = true;
    }
  });

  if (hasOperations) {
    await batch.commit();
  }
}
