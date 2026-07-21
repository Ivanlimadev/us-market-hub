import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { rateLimit, getIp } from '@/lib/rate-limit'

// Every table that holds user-owned rows (keyed by user_id). Deleting an
// auth user does NOT cascade to these (no FK cascade exists), so we must
// clear them explicitly — otherwise account deletion orphans the user's data
// (privacy / right-to-erasure violation). Keep this list in sync when adding
// any new user-scoped table.
const USER_TABLES = [
  'comment_likes',
  'comments',
  'dividend_notifications',
  'finance_transactions',
  'finance_recurring',
  'finance_budgets',
  'finance_goals',
  'finance_accounts',
  'finance_categories',
  'notification_preferences',
  'portfolio_transactions',
  'portfolio_holdings',
  'portfolio_snapshots',
  'price_alerts',
  'user_fcm_tokens',
  'watchlist',
  'banned_users',
] as const

export async function DELETE(req: NextRequest) {
  // 3 attempts per hour per IP — this action is irreversible
  if (!rateLimit(getIp(req), 3, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Service role — deletes across tables and the auth user. Scoped strictly to
  // this authenticated user's id on every statement (no cross-user reach).
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Wipe all user-owned data first. If any table fails, stop before deleting
  //    the auth user so the operation stays retryable (no half-deleted account).
  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error) {
      console.error(`[delete-account] failed clearing ${table}:`, error.code, error.message)
      return NextResponse.json(
        { error: 'Could not fully delete your data. Please try again.' },
        { status: 500 },
      )
    }
  }

  // 2. Finally remove the auth user (proper Supabase auth cleanup).
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
