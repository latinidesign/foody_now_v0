// app/api/mp/callback/route.ts
import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code/state' }, { status: 400 });
  }

  const cookies = req.headers.get('cookie') || '';
  const stateCookie = cookies.match(/mp_oauth_state=([^;]+)/)?.[1];
  const codeVerifier = cookies.match(/mp_code_verifier=([^;]+)/)?.[1];
  const [storeId] = state.split("|")


  if (!storeId) {
    return NextResponse.json({ error: 'Missing store context' }, { status: 400 });
  }

  const decodedStateCookie = stateCookie
  ? decodeURIComponent(stateCookie)
  : undefined;

if (!decodedStateCookie || !codeVerifier || decodedStateCookie !== state) {
  console.error('MP OAuth state mismatch', {
    state,
    decodedStateCookie
  });
  return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
}

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.MP_CLIENT_ID!,
    client_secret: process.env.MP_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.MP_REDIRECT_URI!,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: 400 });
  }

  // Guardamos los tokens en la base de datos
  const {
    access_token,
    refresh_token,
    expires_in,
    user_id,
    public_key,
    scope,
    live_mode
  } = data;

  const supabase = await createClient()

  const expiresAt = new Date(
    Date.now() + data.expires_in * 1000
  );

  const { error } = await supabase
    .from('mp_accounts')
    .upsert({
      store_id: storeId,
      mp_user_id: String(data.user_id),

      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: expiresAt,

      scope: data.scope,
      public_key: data.public_key,

      status: 'connected',
      connected_at: new Date(),

      raw: data,
    }, {
      onConflict: 'store_id'
  });

  if (error) {
    console.error('MP OAuth save error', error);
    return NextResponse.json(
      { error: 'Failed to save MercadoPago account' },
      { status: 500 }
    );
  }

  // Limpia las cookies de estado
  const response = NextResponse.redirect(process.env.APP_URL! + '/admin/settings?mp=connected');
  response.headers.set('Set-Cookie', [
    'mp_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'mp_code_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  ].join(', '));



  return response;
}
