import { Timestamp } from "firebase/firestore";

export type UserRole = 'student' | 'teacher' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  teacherId: string;
  teacherName: string;
  fileUrl?: string;
  course: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  submittedAt: Timestamp;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
}

export interface Student {
  uid: string;
  name: string;
  email: string;
  courses: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  teacherId: string;
}
