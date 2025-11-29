'use client';

import {
  Home,
  BookCopy,
  Users,
  Menu,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth-provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React, { useEffect, useState } from 'react';

const teacherNavItems = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: Home },
  { href: '/teacher/assignments', label: 'Assignments', icon: BookCopy },
  { href: '/teacher/students', label: 'Students', icon: Users },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'teacher')) {
      router.push('/');
    }
  }, [user, loading, role, router]);

  if (loading || !user || role !== 'teacher') {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }
  
  return (
    <div className="grid h-screen w-full pl-[56px]">
      <aside className="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
        <div className="border-b p-2">
            <Link href="/teacher/dashboard">
                <Button variant="outline" size="icon" aria-label="Home">
                    <Logo className="h-5 w-5 text-lg" />
                </Button>
            </Link>
        </div>
        <nav className="grid gap-1 p-2">
            {teacherNavItems.map(item => (
                <Link href={item.href} key={item.href}>
                    <Button
                        variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                        size="icon"
                        className="rounded-lg"
                        aria-label={item.label}
                    >
                        <item.icon className="size-5" />
                    </Button>
                </Link>
            ))}
        </nav>
        <nav className="mt-auto grid gap-1 p-2">
            <Link href="/teacher/assignments/new">
                <Button variant="default" size="icon" className="rounded-lg" aria-label="New Assignment">
                    <PlusCircle className="size-5" />
                </Button>
            </Link>
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                  <nav className="grid gap-6 text-lg font-medium">
                      <Link
                      href="/teacher/dashboard"
                      className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                      >
                      <Logo className="h-5 w-5 transition-all group-hover:scale-110 text-lg" />
                      <span className="sr-only">Techxera</span>
                      </Link>
                      {teacherNavItems.map(item => (
                          <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-4 px-2.5 ${pathname.startsWith(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                          </Link>
                      ))}
                  </nav>
              </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between gap-4">
            <h1 className="text-xl font-semibold flex-1 sm:text-left text-center">
              {teacherNavItems.find(item => pathname.startsWith(item.href))?.label || 'Dashboard'}
            </h1>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
