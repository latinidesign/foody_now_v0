import { NextResponse } from 'next/server'

export async function GET() {
  const debug = {
    vapid_public_available: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapid_private_available: !!process.env.VAPID_PRIVATE_KEY,
    vapid_public_length: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0,
    vapid_private_length: process.env.VAPID_PRIVATE_KEY?.length || 0,
    node_env: process.env.NODE_ENV,
    runtime: typeof window === 'undefined' ? 'server' : 'client',
  }

  return NextResponse.json(debug)
}
