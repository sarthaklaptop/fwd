import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Ensure user record exists in our database
      if (user) {
        try {
          await db
            .insert(users)
            .values({
              id: user.id,
              email: user.email!,
              name:
                user.user_metadata?.name ||
                user.user_metadata?.full_name ||
                null,
            })
            .onConflictDoNothing();
        } catch (err) {
          console.error(
            'Error creating user record in callback:',
            err,
          );
        }
      }

      // Handle password recovery - redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(
          `${origin}/auth/reset-password`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(
    `${origin}/auth/login?error=Could not authenticate`,
  );
}
