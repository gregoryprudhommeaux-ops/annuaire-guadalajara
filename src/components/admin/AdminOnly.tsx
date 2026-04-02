import { ReactNode } from 'react';

export type AdminOnlyProps = {
  isAdmin: boolean;
  children: ReactNode;
};

/** N’affiche les enfants que si `isAdmin` est vrai. */
export function AdminOnly({ isAdmin, children }: AdminOnlyProps) {
  if (!isAdmin) return null;
  return <>{children}</>;
}
