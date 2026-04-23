import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditCardHeaderProps = {
  className?: string;
  isClickable: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function ProfileEditCardHeader({
  className,
  isClickable,
  onClick,
  children,
}: ProfileEditCardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 p-4 transition-colors',
        isClickable && 'cursor-pointer hover:bg-stone-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

