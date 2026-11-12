import type { ReactNode } from 'react';
import { requireUserProfile } from '@/lib/auth/guards';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireUserProfile(['super_admin']);
  return children;
}
