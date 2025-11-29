'use client';

import { AuthProviderComponent } from '@/hooks/use-auth-provider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
}
