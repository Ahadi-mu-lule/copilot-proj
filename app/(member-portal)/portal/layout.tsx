import type { ReactNode } from 'react';
import { requireUserProfile } from '@/lib/auth/guards';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await requireUserProfile(['member']);
  return children;
}
