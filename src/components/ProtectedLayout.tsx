'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';
import LockScreen from './LockScreen';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isUnlocked } = useAuth();

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return <>{children}</>;
} 