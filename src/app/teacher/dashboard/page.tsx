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
import { BookCopy, CheckCircle, Clock, Users, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { collection, query, where, onSnapshot, getDocs, addDoc, Timestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment, Submission, Announcement } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
})

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentCount, setStudentCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [submissionsToGradeCount, setSubmissionsToGradeCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const announcementForm = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' }
  })

  useEffect(() => {
    if (!user) return;

    // Get total students
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudentCount(snapshot.size);
    });

    // Get teacher's assignments
    const assignmentsQuery = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, async (assignmentsSnapshot) => {
      setAssignmentCount(assignmentsSnapshot.size);
      
      let toGrade = 0;
      let graded = 0;
      const allRecentSubmissions: Submission[] = [];

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data() as Assignment;
        assignment.id = assignmentDoc.id;

        const submissionsCollection = collection(db, 'assignments', assignment.id, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsCollection);

        submissionsSnapshot.forEach(submissionDoc => {
          const submission = submissionDoc.data() as Submission;
          if (submission.status === 'submitted') {
            toGrade++;
            allRecentSubmissions.push(submission);
          }
          if (submission.status === 'graded') {
            graded++;
          }
        });
      }

      setSubmissionsToGradeCount(toGrade);
      setGradedCount(graded);
      
      allRecentSubmissions.sort((a,b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
      setRecentSubmissions(allRecentSubmissions.slice(0,3));
    });
    
    // Fetch announcements
    const announcementsQuery = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
        const announcementsData: Announcement[] = [];
        snapshot.forEach(doc => {
            announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
        });
        setAnnouncements(announcementsData);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAssignments();
      unsubscribeAnnouncements();
    };
  }, [user]);

  async function handleCreateAnnouncement(values: z.infer<typeof announcementSchema>) {
    if (!user) return;
    setLoadingAnnouncements(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: values.title,
        content: values.content,
        teacherId: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({ title: "Announcement created!" });
      announcementForm.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Failed to create announcement.", description: error.message });
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast({ title: "Announcement deleted." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Failed to delete announcement.", description: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name.split(' ')[0] || 'Teacher'}!`}
        description="Here's what's happening in your classes today."
      >
        <Link href="/teacher/assignments/new">
            <Button>Create New Assignment</Button>
        </Link>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentCount}</div>
            <p className="text-xs text-muted-foreground">Created by you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions to Grade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissionsToGradeCount}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">Assignments graded</p>
          </CardContent>
        </Card>
      </div>

    <div className="grid gap-6 md:grid-cols-2">
       <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>The latest files submitted by your students.</CardDescription>
          </CardHeader>
          <CardContent>
             {recentSubmissions.length > 0 ? (
                <ul className="space-y-3">
                    {recentSubmissions.map((sub, index) => (
                        <li key={`${sub.id}-${index}`} className="flex items-center justify-between">
                            <div>
                                <p><span className="font-semibold">{sub.studentName}</span> submitted an assignment.</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(sub.submittedAt.toDate(), { addSuffix: true })}
                                </p>
                            </div>
                            <Link href={`/teacher/assignments/${sub.assignmentId}`}>
                                <Button variant="outline" size="sm">View</Button>
                            </Link>
                        </li>
                    ))}
                </ul>
             ) : (
                <p className="text-sm text-muted-foreground">No recent submissions.</p>
             )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Manage Announcements</CardTitle>
                <CardDescription>Create and delete announcements for students.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...announcementForm}>
                    <form onSubmit={announcementForm.handleSubmit(handleCreateAnnouncement)} className="space-y-4 mb-6">
                         <FormField
                            control={announcementForm.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Exam Schedule" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={announcementForm.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about the announcement..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={loadingAnnouncements}>
                          {loadingAnnouncements && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Post Announcement
                        </Button>
                    </form>
                </Form>
                <h4 className="font-medium text-sm mb-2">Current Announcements</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {announcements.length > 0 ? announcements.map(ann => (
                        <div key={ann.id} className="flex justify-between items-start text-sm border-l-4 border-primary pl-3">
                           <div>
                             <p className="font-medium">{ann.title}</p>
                             <p className="text-muted-foreground text-xs">{format(ann.createdAt.toDate(), 'PPP')}</p>
                           </div>
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAnnouncement(ann.id)}>
                             <Trash2 className="h-4 w-4 text-destructive"/>
                           </Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No announcements posted.</p>}
                </div>
            </CardContent>
        </Card>
    </div>
    </div>
  );
}
