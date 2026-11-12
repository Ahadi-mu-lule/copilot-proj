import type { ReactNode } from 'react';
import { requireUserProfile } from '@/lib/auth/guards';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  await requireUserProfile(['sacco_admin', 'sacco_staff']);
  return children;
}
