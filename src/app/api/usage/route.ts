import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  getUserPlan,
  getMonthlyEmailCount,
  PLAN_LIMITS,
} from '@/lib/plan-limits';

// Lightweight usage lookup for the dashboard sidebar counter
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new ApiError(401, 'Unauthorized').send();
  }

  const [plan, emailsThisMonth] = await Promise.all([
    getUserPlan(user.id),
    getMonthlyEmailCount(user.id),
  ]);

  const response = new ApiResponse(
    200,
    {
      plan,
      emailsThisMonth,
      monthlyLimit: PLAN_LIMITS[plan].emailsPerMonth,
    },
    'Usage loaded',
  ).send();
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
