import { AuthForm } from '@/components/auth-form';
import Logo from '@/components/logo';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
