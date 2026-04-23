import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditCardHeaderContentProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ProfileEditCardHeaderContent({
  className,
  children,
}: ProfileEditCardHeaderContentProps) {
  return <div className={cn('flex min-w-0 flex-1 gap-3', className)}>{children}</div>;
}

