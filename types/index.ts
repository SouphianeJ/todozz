import { Timestamp } from 'firebase/firestore';

export const ASSIGNEES = ['Emma', 'Souphiane'] as const;
export type Assignee = typeof ASSIGNEES[number];

export interface ChecklistItemType {
  id: string; // For unique key in React rendering
  text: string;
  checked: boolean;
  expirationDate?: string | null;
}

export interface Todo {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  assignee: Assignee;
  checklist: ChecklistItemType[];
  position?: number;
  // Timestamps will be added by Firestore
}

export interface TodoDocument extends Todo {
  id: string;
  position: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// For API responses, we might want to serialize Timestamps
export interface TodoApiResponse extends Omit<TodoDocument, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}