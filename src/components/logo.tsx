import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-2xl font-bold text-primary',
        className
      )}
    >
      <BookOpenCheck className="h-8 w-8" />
      <span className="font-headline">Techxera</span>
    </div>
  );
};

export default Logo;
