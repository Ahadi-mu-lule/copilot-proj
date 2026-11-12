import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/auth/guards';
import { requireUserProfile } from '@/lib/auth/guards';

const landingByRole: Record<UserRole, string> = {
  super_admin: '/admin',
  sacco_admin: '/workspace',
  sacco_staff: '/workspace',
  member: '/portal',
};

function safeInternalPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  try {
    const parsed = new URL(value, 'https://flexsacco.invalid');
    return parsed.origin === 'https://flexsacco.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : null;
  } catch {
    return null;
  }
}

export async function signInAction(formData: FormData): Promise<void> {
  'use server';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const nextPath = safeInternalPath(formData.get('next'));

  if (!email || !password || email.length > 254 || password.length > 1024) {
    redirect('/login?error=credentials');
  }

  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Generic error avoids revealing whether a given account exists.
  if (error) redirect('/login?error=credentials');

  let profile;
  try {
    profile = await requireUserProfile();
  } catch {
    await supabase.auth.signOut();
    redirect('/login?error=access');
  }

  redirect(nextPath ?? landingByRole[profile.role]);
}

export async function signOutAction(): Promise<void> {
  'use server';
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
