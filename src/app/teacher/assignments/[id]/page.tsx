'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, onSnapshot, query, doc, getDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment, Submission, AppUser } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Download, Loader2, Edit } from 'lucide-react';


const gradeSchema = z.object({
    grade: z.string().min(1, 'Grade is required'),
    feedback: z.string().optional(),
});

interface GradeModalProps {
    assignment: Assignment;
    submission: Submission;
    onGraded: () => void;
}

function GradeModal({ assignment, submission, onGraded }: GradeModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof gradeSchema>>({
        resolver: zodResolver(gradeSchema),
        defaultValues: {
            grade: submission.grade || '',
            feedback: submission.feedback || ''
        }
    });

    async function onSubmit(values: z.infer<typeof gradeSchema>) {
        setLoading(true);
        try {
            const submissionRef = doc(db, 'assignments', assignment.id, 'submissions', submission.studentId);
            await updateDoc(submissionRef, {
                grade: values.grade,
                feedback: values.feedback,
                status: 'graded'
            });
            toast({ title: "Grade submitted successfully!" });
            onGraded();
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Failed to submit grade.", description: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={submission.status === 'pending'}>
                    {submission.status === 'graded' ? 'View/Edit Grade' : 'Grade'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Grade Submission for {submission.studentName}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Submitted on: {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </p>
                    {submission.fileUrl ? <Button variant="outline" size="sm" asChild>
                        <Link href={submission.fileUrl} target="_blank">
                            <Download className="mr-2 h-4 w-4"/>
                            Download Submission
                        </Link>
                    </Button> : <p>No file submitted.</p>}
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="grade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. A+" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="feedback"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Feedback (optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Provide feedback to the student..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Submit Grade
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function AssignmentSubmissionsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [students, setStudents] = useState<AppUser[]>([]);

    const fetchSubmissions = () => {
        if (!students.length || !id) return;

        const submissionsCollection = collection(db, 'assignments', id, 'submissions');
        const unsubscribeSubmissions = onSnapshot(submissionsCollection, (snapshot) => {
            const subs: Submission[] = [];
            snapshot.forEach(doc => {
                subs.push(doc.data() as Submission)
            });

            const allStudentsSubmissions = students.map(student => {
                const existingSubmission = subs.find(s => s.studentId === student.uid);
                if (existingSubmission) {
                    return existingSubmission;
                }
                return {
                    id: '',
                    assignmentId: id,
                    studentId: student.uid,
                    studentName: student.name,
                    fileUrl: '',
                    submittedAt: null as any,
                    status: 'pending',
                } as Submission;
            });
            setSubmissions(allStudentsSubmissions);
        });

        return () => unsubscribeSubmissions();
    }

    useEffect(() => {
        if (!id) return;
        const fetchAssignment = async () => {
            const docRef = doc(db, 'assignments', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);
            }
        };
        fetchAssignment();

        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentData: AppUser[] = [];
            snapshot.forEach(doc => studentData.push({ uid: doc.id, ...doc.data() } as AppUser));
            setStudents(studentData);
        });

        return () => unsubscribeStudents();

    }, [id]);


    useEffect(() => {
        const unsubscribe = fetchSubmissions();
        return () => unsubscribe && unsubscribe();
    }, [id, students]);

  if (!assignment) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description="Review student submissions and provide grades."
      >
        <Link href={`/teacher/assignments/${id}/edit`}>
            <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Assignment
            </Button>
        </Link>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
                {submissions.filter(s => s.status !== 'pending').length} of {students.length} students have submitted.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.map(sub => (
                        <TableRow key={sub.studentId}>
                            <TableCell className="font-medium">{sub.studentName}</TableCell>
                            <TableCell>
                                <Badge variant={
                                sub.status === 'graded' ? 'default' : 
                                sub.status === 'submitted' ? 'outline' : 'secondary'
                                }
                                className={sub.status === 'graded' ? 'bg-accent text-accent-foreground' : ''}>
                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>{sub.grade || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                {assignment && <GradeModal assignment={assignment} submission={sub} onGraded={fetchSubmissions}/>}
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
