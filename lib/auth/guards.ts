import 'server-only';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type UserRole = 'super_admin' | 'sacco_admin' | 'sacco_staff' | 'member';

export interface AuthenticatedProfile {
  id: string;
  role: UserRole;
  sacco_id: string | null;
  full_name: string;
  is_activated: boolean;
}

export async function requireUserProfile(
  allowedRoles?: readonly UserRole[]
): Promise<AuthenticatedProfile> {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, sacco_id, full_name, is_activated')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_activated) redirect('/login?error=access');

  const role = profile.role as UserRole;
  const validRoles: readonly UserRole[] = ['super_admin', 'sacco_admin', 'sacco_staff', 'member'];
  if (!validRoles.includes(role)) redirect('/login?error=access');
  if (allowedRoles && !allowedRoles.includes(role)) redirect('/unauthorized');
  if (role !== 'super_admin' && !profile.sacco_id) redirect('/login?error=access');

  return { ...profile, role };
}
