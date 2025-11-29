'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';


export default function StudentsPage() {
  const [students, setStudents] = useState<AppUser[]>([]);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ uid: doc.id, ...doc.data() } as AppUser);
      });
      setStudents(studentsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="View and manage all students in your courses."
      />
      <Card>
        <CardHeader>
            <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map(student => (
                         <TableRow key={student.uid}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={student.avatarUrl} />
                                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{student.name}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm">View Progress</Button>
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
