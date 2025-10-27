import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json()

    if (!storeId) {
      return NextResponse.json(
        { error: 'Missing storeId' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Remove push subscription for store
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('store_id', storeId)

    if (error) {
      console.error('[API] Failed to remove push subscription:', error)
      return NextResponse.json(
        { error: 'Failed to remove subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Push unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
