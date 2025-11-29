'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, getDoc, onSnapshot, query, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Announcement, Assignment, Submission } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<(Assignment & { status: string })[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;

    const assignmentsQuery = query(collection(db, 'assignments'));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, async (querySnapshot) => {
      const assignmentsData: (Assignment & { status: string })[] = [];
      for (const docSnapshot of querySnapshot.docs) {
        const assignment = { id: docSnapshot.id, ...docSnapshot.data() } as Assignment;

        const submissionDocRef = doc(db, 'assignments', assignment.id, 'submissions', user.uid);
        const submissionDoc = await getDoc(submissionDocRef);
        let status = 'Pending';
        if (submissionDoc.exists()) {
            const submission = submissionDoc.data() as Submission;
            status = submission.status.charAt(0).toUpperCase() + submission.status.slice(1);
        }
        
        assignmentsData.push({ ...assignment, status });
      }
      setAssignments(assignmentsData.sort((a, b) => b.dueDate.toMillis() - a.dueDate.toMillis()).slice(0, 3));
    });

    const announcementsQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
        const announcementsData: Announcement[] = [];
        snapshot.forEach(doc => {
            announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
        });
        setAnnouncements(announcementsData);
    });

    return () => {
        unsubscribeAssignments();
        unsubscribeAnnouncements();
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name.split(' ')[0] || 'Student'}!`}
        description="Here's a quick overview of your academic progress."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>
                Your most recent assignments and their status.
                </CardDescription>
            </div>
            <Link href="/student/assignments">
                <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {assignments.map((assignment, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(assignment.dueDate.toDate(), 'PPP')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      assignment.status === 'Graded' ? 'default' : 
                      assignment.status === 'Submitted' ? 'outline' : 'secondary'
                    }
                    className={assignment.status === 'Graded' ? 'bg-accent text-accent-foreground' : ''}
                  >
                    {assignment.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Announcements</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
                {announcements.map((ann) => (
                    <li key={ann.id} className="border-l-4 border-primary pl-4">
                        <p className="font-medium">{ann.title}</p>
                        <p className="text-sm text-muted-foreground">{ann.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(ann.createdAt.toDate(), 'PPP')}</p>
                    </li>
                ))}
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
