import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditCardProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ProfileEditCard({ className, children }: ProfileEditCardProps) {
  return (
    <section
      className={cn(
        'bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative',
        className
      )}
    >
      {children}
    </section>
  );
}

