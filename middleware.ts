import { updateSession } from '@/middleware/supabase-middleware'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const id = req.nextUrl.pathname.split('/').pop()
    const url = await kv.get(`fragment:${id}`)

    if (url) {
      return NextResponse.redirect(url as string)
    } else {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return await updateSession(req, event)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
