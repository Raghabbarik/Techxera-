
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
import { BookCopy, Users, User, GraduationCap } from 'lucide-react';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Get total students
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudentCount(snapshot.size);
    });

    // Get total teachers
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTeacherCount(snapshot.size);
    });
    
    // Get total assignments
    const assignmentsQuery = query(collection(db, 'assignments'));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
        setAssignmentCount(snapshot.size);
    })


    return () => {
      unsubscribeStudents();
      unsubscribeTeachers();
      unsubscribeAssignments();
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Admin Dashboard`}
        description="Oversee the entire platform from here."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount + teacherCount}</div>
            <p className="text-xs text-muted-foreground">Students & Teachers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">Enrolled in courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount}</div>
            <p className="text-xs text-muted-foreground">Managing courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentCount}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

    <div className="grid gap-6 md:grid-cols-2">
       <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>A live feed of recent platform events.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Live activity feed coming soon...</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Manage global settings for the application.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">Global settings coming soon...</p>
            </CardContent>
        </Card>
    </div>
    </div>
  );
}
