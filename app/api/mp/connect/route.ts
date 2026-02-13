// app/api/mp/connect/route.ts
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from 'crypto';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/pkce';

export async function GET() {
  // Guardamos un ID de tienda temporal para identificar al usuario
  // Obtengo el storeId del usuario logueado
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Get user's store
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single()
  if (!store) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
  }

  const state = store.id + "|" + randomUUID()
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.MP_CLIENT_ID!,
    redirect_uri: process.env.MP_REDIRECT_URI!,
    platform_id: 'mp',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const res = NextResponse.redirect(
    `https://auth.mercadopago.com.ar/authorization?${params.toString()}`
  );

  // Guardamos state + verifier
  res.cookies.set('mp_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  res.cookies.set('mp_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return res;
}
