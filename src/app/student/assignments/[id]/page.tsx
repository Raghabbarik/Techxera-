'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth-provider';
import type { Assignment, Submission } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

interface PageProps {
    params: { id: string };
}

export default function StudentAssignmentDetailsPage({ params }: PageProps) {
    const { id } = params;
    const { user } = useAuth();
    const { toast } = useToast();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [fileUrlInput, setFileUrlInput] = useState('');
    const [isUrlMode, setIsUrlMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);


    useEffect(() => {
        const fetchAssignment = async () => {
            if (!id || !user) return;
            setLoading(true);
            const docRef = doc(db, 'assignments', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const asg = { id: docSnap.id, ...docSnap.data() } as Assignment;
                setAssignment(asg);

                if (user) {
                    const submissionRef = doc(db, 'assignments', asg.id, 'submissions', user.uid);
                    const submissionSnap = await getDoc(submissionRef);
                    if (submissionSnap.exists()) {
                        setSubmission(submissionSnap.data() as Submission);
                    }
                }
            }
            setLoading(false);
        };
        fetchAssignment();
    }, [id, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!user || !assignment) return;

        if (!isUrlMode && !file) {
            toast({ variant: 'destructive', title: 'Please select a file to submit.'});
            return;
        }
        if (isUrlMode && !fileUrlInput) {
            toast({ variant: 'destructive', title: 'Please enter a URL to submit.' });
            return;
        }

        setSubmitting(true);
        try {
            let submissionFileUrl = '';
            
            if (isUrlMode) {
                submissionFileUrl = fileUrlInput;
            } else if (file) {
                const fileRef = ref(storage, `submissions/${assignment.id}/${user.uid}/${file.name}`);
                await uploadBytes(fileRef, file);
                submissionFileUrl = await getDownloadURL(fileRef);
            }

            const submissionData: Submission = {
                id: user.uid, // The document ID will be the user's UID
                assignmentId: assignment.id,
                studentId: user.uid,
                studentName: user.name,
                fileUrl: submissionFileUrl,
                submittedAt: Timestamp.now(),
                status: 'submitted',
                grade: submission?.grade || '',
                feedback: submission?.feedback || '',
            };

            await setDoc(doc(db, 'assignments', assignment.id, 'submissions', user.uid), submissionData);
            setSubmission(submissionData);
            toast({ title: 'Assignment submitted successfully!'});
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission failed', description: error.message });
        } finally {
            setSubmitting(false);
        }
    };
    
  if (loading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!assignment) {
      return <div>Assignment not found.</div>
  }

  const isSubmitted = submission && submission.status !== 'pending';
  const isSubmitDisabled = submitting || (!isUrlMode && !file) || (isUrlMode && !fileUrlInput);
  const currentStatus = submission?.status ? (submission.status.charAt(0).toUpperCase() + submission.status.slice(1)) : 'Pending';


  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`Due: ${format(assignment.dueDate.toDate(), 'PPP')} | Status: ${currentStatus}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{assignment.description}</p>
                </CardContent>
                {assignment.fileUrl && (
                    <CardFooter>
                        <Button variant="outline" asChild>
                            <Link href={assignment.fileUrl} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                Download Materials
                            </Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
            {isSubmitted && submission && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Submission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>Submitted on: {submission.submittedAt && format(submission.submittedAt.toDate(), 'PPP p')}</p>
                        {submission.status === 'graded' && (
                            <>
                                <p className="font-semibold text-lg">Grade: {submission.grade}</p>
                                {submission.feedback && <p className="pt-2"><strong className="font-medium">Feedback:</strong><br/>{submission.feedback}</p>}
                            </>
                        )}
                    </CardContent>
                   {submission.fileUrl && (
                     <CardFooter>
                         <Button variant="outline" asChild>
                            <Link href={submission.fileUrl} target="_blank">
                                <Download className="mr-2 h-4 w-4" />
                                View Your Submission
                            </Link>
                        </Button>
                    </CardFooter>
                   )}
                </Card>
            )}
        </div>

        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{isSubmitted ? 'Update Submission' : 'Submit Assignment'}</CardTitle>
                    <CardDescription>{isSubmitted ? "You can upload a new file or URL to replace your previous submission." : "Upload your completed assignment file or provide a URL."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <Label htmlFor="submission-mode">Upload File</Label>
                            <Switch id="submission-mode" checked={isUrlMode} onCheckedChange={setIsUrlMode} disabled={submitting} />
                            <Label htmlFor="submission-mode">Use URL</Label>
                            <LinkIcon className="h-4 w-4" />
                        </div>
                        {isUrlMode ? (
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="assignment-url">Submission URL</Label>
                                <Input id="assignment-url" type="url" placeholder="https://example.com/submission" onChange={(e) => setFileUrlInput(e.target.value)} disabled={submitting} />
                            </div>
                        ) : (
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="assignment-file">File</Label>
                                <Input id="assignment-file" type="file" onChange={handleFileChange} disabled={submitting} />
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitted ? 'Resubmit' : 'Submit'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
