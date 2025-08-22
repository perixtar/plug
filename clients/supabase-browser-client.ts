import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function getUserFromBrowser() {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function logoutFromBrowser() {
  const supabase = createSupabaseBrowserClient()
  // if the user is not logged in, return
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return
  }
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('Error logging out')
  }
}
