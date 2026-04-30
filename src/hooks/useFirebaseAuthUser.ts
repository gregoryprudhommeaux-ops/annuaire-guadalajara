import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '@/firebase';

/** État Auth Firebase hors `MainApp` (ex. `/stats/share`). */
export function useFirebaseAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  return user;
}
