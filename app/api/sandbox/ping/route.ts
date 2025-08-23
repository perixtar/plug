import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sandbox_url = searchParams.get('sandbox_url')
  if (!sandbox_url) {
    return NextResponse.json(
      { error: 'Missing `url` query param' },
      { status: 400 },
    )
  }
  try {
    const upstream = await fetch(sandbox_url, { method: 'GET' })
    if (upstream.status >= 500) {
      return NextResponse.json(
        { error: 'Sandbox URL is not reachable' },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { message: 'Sandbox URL is reachable' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error in ping route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
