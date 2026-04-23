import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditLegacyBodyProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ProfileEditLegacyBody({ className, children }: ProfileEditLegacyBodyProps) {
  return <div className={cn(className)}>{children}</div>;
}

