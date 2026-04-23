import React from 'react';
import { cn } from '@/lib/cn';

export type ProfileEditFormProps = {
  className?: string;
  formKey?: React.Key;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
};

const ProfileEditForm = React.forwardRef<HTMLFormElement, ProfileEditFormProps>(function ProfileEditForm(
  { className, formKey, onSubmit, children },
  ref
) {
  return (
    <form ref={ref} key={formKey} onSubmit={onSubmit} className={cn(className)}>
      {children}
    </form>
  );
});

export default ProfileEditForm;

