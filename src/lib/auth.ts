import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const getUserRole = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: dbUser, error } = await supabase
    .from('users')
    .select('role, parent_leader_id')
    .eq('clerk_id', userId)
    .single();

  if (error || !dbUser) {
    console.error('Error fetching user role:', error);
    return null;
  }
  return dbUser.role;
};

export const getCurrentUser = async () => {
  const { userId } = await auth();
  return userId;
};
