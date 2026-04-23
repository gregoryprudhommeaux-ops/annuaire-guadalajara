import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditCardSectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div';
  className?: string;
  children: React.ReactNode;
};

export default function ProfileEditCardSection({
  as = 'section',
  className,
  children,
  ...rest
}: ProfileEditCardSectionProps) {
  const Tag = as;
  return (
    <Tag {...rest} className={cn('profile-card-compact space-y-4', className)}>
      {children}
    </Tag>
  );
}

