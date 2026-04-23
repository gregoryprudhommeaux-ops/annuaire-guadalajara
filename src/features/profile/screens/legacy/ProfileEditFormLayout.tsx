import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditFormLayoutProps = {
  className?: string;
  children: React.ReactNode;
};

const ProfileEditFormLayout = React.forwardRef<HTMLDivElement, ProfileEditFormLayoutProps>(
  function ProfileEditFormLayout({ className, children }, ref) {
    return (
      <div
        ref={ref}
        className={cn('grid gap-6 lg:grid-cols-1 lg:items-start', className)}
      >
        {children}
      </div>
    );
  }
);

export default ProfileEditFormLayout;

