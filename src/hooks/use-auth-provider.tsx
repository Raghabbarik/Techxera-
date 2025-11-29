'use client';

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProviderComponent = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const appUser = { uid: firebaseUser.uid, ...userDoc.data() } as AppUser;
          setUser(appUser);
          
          const roleDashboardMap = {
            student: '/student/dashboard',
            teacher: '/teacher/dashboard',
            admin: '/admin/dashboard',
          };
          const targetDashboard = roleDashboardMap[appUser.role];

          if (pathname === '/') {
            router.replace(targetDashboard);
          }
        } else {
          await auth.signOut();
          setUser(null);
          router.replace('/');
        }
      } else {
        setUser(null);
        if (pathname !== '/') {
            router.replace('/');
        }
      }
      setInitialLoad(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (initialLoad) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role: user?.role || null }}>
      {children}
    </AuthContext.Provider>
  );
};
