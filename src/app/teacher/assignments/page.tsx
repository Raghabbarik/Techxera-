
'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth-provider';
import type { Assignment } from '@/lib/types';
import { format } from 'date-fns';

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});


  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assignmentsData: Assignment[] = [];
      querySnapshot.forEach((doc) => {
        assignmentsData.push({ id: doc.id, ...doc.data() } as Assignment);
      });
      setAssignments(assignmentsData);

      // Fetch submission counts for each assignment
      assignmentsData.forEach(async (assignment) => {
        const submissionsCollection = collection(db, 'assignments', assignment.id, 'submissions');
        const submissionsSnapshot = await getCountFromServer(submissionsCollection);
        const submissionsCount = submissionsSnapshot.data().count;
        setSubmissionCounts((prev) => ({ ...prev, [assignment.id]: submissionsCount }));

        const studentsCollection = collection(db, 'users');
        const studentsQuery = query(studentsCollection, where('role', '==', 'student'));
        const studentsSnapshot = await getCountFromServer(studentsQuery);
        const studentsCount = studentsSnapshot.data().count;
        setStudentCounts((prev) => ({...prev, [assignment.id]: studentsCount}))
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Manage all your created assignments."
      >
        <Link href="/teacher/assignments/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </Link>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Your Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.course}</TableCell>
                  <TableCell>{format(assignment.dueDate.toDate(), 'PPP')}</TableCell>
                  <TableCell>{submissionCounts[assignment.id] || 0} / {studentCounts[assignment.id] || 0}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/teacher/assignments/${assignment.id}`}>
                      <Button variant="outline" size="sm">View Submissions</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
