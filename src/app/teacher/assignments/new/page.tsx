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
import { AiAssistant } from './ai-assistant';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function NewAssignmentPage() {
    const [loading, setLoading] = useState(false);
    const [isUrlMode, setIsUrlMode] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

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

  async function onSubmit(values: z.infer<typeof assignmentSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to create an assignment.' });
        return;
    }
    setLoading(true);
    try {
        let fileUrl = values.fileUrl;
        
        if (!isUrlMode) {
            const file = values.file?.[0];
            if (file) {
                const fileRef = ref(storage, `assignments/${user.uid}/${file.name}`);
                await uploadBytes(fileRef, file);
                fileUrl = await getDownloadURL(fileRef);
            }
        }

        await addDoc(collection(db, 'assignments'), {
            title: values.title,
            description: values.description,
            dueDate: Timestamp.fromDate(values.dueDate),
            teacherId: user.uid,
            teacherName: user.name,
            fileUrl: fileUrl || null,
            course: values.course,
        });

        toast({ title: 'Assignment created successfully!' });
        router.push('/teacher/assignments');

    } catch (error: any) {
        console.error("Error creating assignment: ", error);
        toast({ variant: 'destructive', title: 'Failed to create assignment.', description: error.message });
    } finally {
        setLoading(false);
    }
  }
  
  const handleSuggestion = (title: string, description: string) => {
    form.setValue('title', title);
    form.setValue('description', description);
  }

  const fileRef = form.register("file");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Assignment"
        description="Fill out the details below to create a new assignment for your students."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Assignment Details</CardTitle>
                  <AiAssistant onSuggestionSelect={handleSuggestion} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <FormLabel>Attachment (optional)</FormLabel>
                                            <FormControl>
                                                <Input type="file" {...fileRef} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                    </CardContent>
                </Card>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Assignment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
