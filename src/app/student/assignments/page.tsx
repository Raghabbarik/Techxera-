'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth-provider';
import type { Assignment, Submission } from '@/lib/types';
import { format } from 'date-fns';

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<(Assignment & { status: string, grade?: string })[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'assignments'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const assignmentsData: (Assignment & { status: string, grade?: string })[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const assignment = { id: docSnapshot.id, ...docSnapshot.data() } as Assignment;

        const submissionDocRef = doc(db, 'assignments', assignment.id, 'submissions', user.uid);
        const submissionDoc = await getDoc(submissionDocRef);
        let status = 'Pending';
        let grade: string | undefined = undefined;
        if (submissionDoc.exists()) {
            const submission = submissionDoc.data() as Submission;
            status = submission.status.charAt(0).toUpperCase() + submission.status.slice(1);
            grade = submission.grade;
        }
        
        assignmentsData.push({ ...assignment, status, grade });
      }
      setAssignments(assignmentsData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assignments"
        description="View and manage all your assignments."
      />
      <Card>
        <CardHeader>
            <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.course}</TableCell>
                  <TableCell>{format(assignment.dueDate.toDate(), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      assignment.status === 'Graded' ? 'default' : 
                      assignment.status === 'Submitted' ? 'outline' : 'secondary'
                    }
                    className={assignment.status === 'Graded' ? 'bg-accent text-accent-foreground' : ''}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{assignment.grade || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/student/assignments/${assignment.id}`}>
                      <Button variant="outline" size="sm">View</Button>
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
