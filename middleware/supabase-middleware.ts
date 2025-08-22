import { SiteURL } from '@/constants/site-url'
import { createServerClient } from '@supabase/ssr'
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from 'next/server'

const ENABLE_PH = process.env.NEXT_PUBLIC_ENABLE_POSTHOG === 'true'
const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
const PH_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
// Name to remember who we last identified (prevents duplicates)
const PH_LAST_ID_COOKIE = 'ph_last_identified'

export async function updateSession(
  request: NextRequest,
  event?: NextFetchEvent,
) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isNoAuthPath(request.nextUrl.pathname)) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = SiteURL.AUTH
    return NextResponse.redirect(url)
  }

  // If we have a user, optionally identify with PostHog server-side
  if (user && ENABLE_PH && PH_KEY) {
    const already = request.cookies.get(PH_LAST_ID_COOKIE)?.value
    if (already !== user.id) {
      const anonId = getAnonDistinctId(request)
      const email = user.email ?? null
      const name =
        (user.user_metadata as any)?.full_name ??
        (user.user_metadata as any)?.name ??
        null

      const p = sendPostHogIdentify({
        userId: user.id,
        anonId,
        email,
        name,
      })

      // Don't block the request on analytics
      if (event) event.waitUntil(p)
      else await p

      // Mark as identified to avoid duplicate $identify on every request
      supabaseResponse.cookies.set(PH_LAST_ID_COOKIE, user.id, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

/**
 * This function checks if the path does not require authentication.
 * It is used to determine if the user should be redirected to the login page.
 * First step of filtering is already done in the middleware.ts file in matcher.
 * @param path
 * @returns
 */
function isNoAuthPath(path: string) {
  return (
    path.startsWith('/auth/') ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/signup') ||
    path.startsWith('/login') ||
    path.startsWith('/invite')
  )
}

// Try to extract the anonymous PostHog distinct_id from the cookie value.
// The cookie is JSON-encoded (often URI-encoded) and looks like ph_<key>_posthog.
function getAnonDistinctId(request: NextRequest): string | null {
  // Best-guess default cookie name; also search any ph_*_posthog just in case.
  const defaultName = `ph_${PH_KEY}_posthog`
  const candidates = request.cookies
    .getAll()
    .filter(
      (c) =>
        c.name === defaultName ||
        (c.name.startsWith('ph_') && c.name.endsWith('_posthog')),
    )

  for (const c of candidates) {
    try {
      const decoded = decodeURIComponent(c.value)
      const parsed = JSON.parse(decoded)
      const id = parsed?.distinct_id
      if (typeof id === 'string' && id.length > 0) return id
    } catch {
      // ignore parse failures and try next cookie
    }
  }
  return null
}

// Send a $identify event to PostHog ingestion API.
// If anonId is present, PostHog merges anonymous history into the identified user.
async function sendPostHogIdentify(args: {
  userId: string
  anonId?: string | null
  email?: string | null
  name?: string | null
}) {
  if (!ENABLE_PH || !PH_KEY) return

  const body = {
    api_key: PH_KEY,
    event: '$identify',
    properties: {
      distinct_id: args.userId,
      ...(args.anonId ? { $anon_distinct_id: args.anonId } : {}),
    },
    // Optional: set person properties at the same time
    $set: {
      ...(args.email ? { email: args.email } : {}),
      ...(args.name ? { name: args.name } : {}),
    },
  }

  // PostHog accepts /e/ and /capture/; /e/ is a minimal ingestion endpoint.
  await fetch(`${PH_HOST.replace(/\/$/, '')}/e/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Edge runtime supports fetch; no Node-only APIs used.
    body: JSON.stringify(body),
  })
}
