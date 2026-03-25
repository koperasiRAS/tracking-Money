import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (err) {
            // Handle cookies in Server Components where headers may already be sent
            console.warn(`[Supabase] Failed to set cookie "${name}":`, err);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (err) {
            // Handle cookies in Server Components where headers may already been sent
            console.warn(`[Supabase] Failed to remove cookie "${name}":`, err);
          }
        },
      },
    }
  );
}
