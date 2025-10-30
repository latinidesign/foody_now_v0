import { NextResponse } from 'next/server'

export async function GET() {
  const credentials = {
    waPhoneNumberId: process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID,
    waAccessToken: process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN,
    waBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
  }

  // Solo mostrar si las credenciales existen, no los valores
  const diagnosis: any = {
    hasPhoneNumberId: !!credentials.waPhoneNumberId,
    hasAccessToken: !!credentials.waAccessToken,
    hasBusinessAccountId: !!credentials.waBusinessAccountId,
    apiVersion: credentials.apiVersion,
    phoneNumberIdLength: credentials.waPhoneNumberId?.length || 0,
    accessTokenLength: credentials.waAccessToken?.length || 0,
    isConfigured: !!(credentials.waPhoneNumberId && credentials.waAccessToken)
  }

  // Test básico de conectividad a Facebook Graph API
  if (diagnosis.isConfigured) {
    try {
      const testUrl = `https://graph.facebook.com/${credentials.apiVersion}/${credentials.waPhoneNumberId}`
      const testResponse = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${credentials.waAccessToken}`
        }
      })
      
      diagnosis.apiConnectivity = testResponse.status
      diagnosis.apiError = testResponse.status !== 200 ? await testResponse.text() : null
      
    } catch (error) {
      diagnosis.apiConnectivity = 'error'
      diagnosis.apiError = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return NextResponse.json(diagnosis)
}
