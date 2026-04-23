import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditExpandedContainerProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ProfileEditExpandedContainer({
  className,
  children,
}: ProfileEditExpandedContainerProps) {
  return (
    <div className={cn('border-t border-stone-100 p-4 pt-0 sm:p-6 sm:pt-0', className)}>{children}</div>
  );
}

