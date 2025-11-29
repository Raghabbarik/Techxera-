'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Link as LinkIcon, Loader2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  file: z.any().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  course: z.string().min(1, 'Course is required'),
});

export default function EditAssignmentPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [loading, setLoading] = useState(false);
    const [assignment, setAssignment] = useState<any>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isUrlMode, setIsUrlMode] = useState(false);

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      course: '',
      file: undefined,
      fileUrl: '',
    }
  });

  const fileRef = form.register("file");

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) return;
      const docRef = doc(db, 'assignments', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAssignment({ id: docSnap.id, ...data });
        form.reset({
            title: data.title,
            description: data.description,
            course: data.course,
            dueDate: data.dueDate.toDate(),
            fileUrl: data.fileUrl || '',
        });
        if (data.fileUrl) {
            setIsUrlMode(true);
        }
      }
    };
    fetchAssignment();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof assignmentSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to update an assignment.' });
        return;
    }
    setLoading(true);
    try {
        let fileUrl = values.fileUrl;
        
        if (!isUrlMode) {
            const file = values.file?.[0];
            if (file) {
                const fileUploadRef = ref(storage, `assignments/${user.uid}/${file.name}`);
                await uploadBytes(fileUploadRef, file);
                fileUrl = await getDownloadURL(fileUploadRef);
            } else {
                // Keep existing fileUrl if no new file is uploaded and not in URL mode
                fileUrl = assignment?.fileUrl;
            }
        }


        const assignmentRef = doc(db, 'assignments', id);
        await updateDoc(assignmentRef, {
            title: values.title,
            description: values.description,
            dueDate: Timestamp.fromDate(values.dueDate),
            course: values.course,
            fileUrl: fileUrl || null,
        });

        toast({ title: 'Assignment updated successfully!' });
        router.push(`/teacher/assignments/${id}`);

    } catch (error: any) {
        console.error("Error updating assignment: ", error);
        toast({ variant: 'destructive', title: 'Failed to update assignment.', description: error.message });
    } finally {
        setLoading(false);
    }
  }
  
  if (!assignment) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Assignment"
        description="Update the details for this assignment."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Essay on the Renaissance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide clear instructions for the assignment..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="course"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Course</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                                            <SelectItem value="Physics">Physics</SelectItem>
                                            <SelectItem value="History">History</SelectItem>
                                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                                            <SelectItem value="English">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Due Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, 'PPP')
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date < new Date() || date < new Date('1900-01-01')
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Upload className="h-4 w-4" />
                                    <Label>Upload File</Label>
                                    <Switch checked={isUrlMode} onCheckedChange={setIsUrlMode} />
                                    <Label>Use URL</Label>
                                    <LinkIcon className="h-4 w-4" />
                                </div>
                                {isUrlMode ? (
                                    <FormField
                                        control={form.control}
                                        name="fileUrl"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attachment URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/document.pdf" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="file"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attachment</FormLabel>
                                            <FormControl>
                                                <Input type="file" {...fileRef} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                )}
                                {assignment?.fileUrl && !isUrlMode && (
                                    <p className="text-sm text-muted-foreground pt-2">
                                        Current file: <Link href={assignment.fileUrl} target="_blank" className="text-primary underline">View</Link>
                                    </p>
                                )}
                            </div>
                    </CardContent>
                </Card>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Assignment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
