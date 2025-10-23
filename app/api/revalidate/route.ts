import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tag, path, secret } = body

    if (secret && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }

    if (tag) {
      revalidateTag(tag)
      return NextResponse.json({
        message: `Revalidated tag: ${tag}`,
        revalidated: true,
        now: Date.now(),
      })
    }

    if (path) {
      revalidatePath(path)
      return NextResponse.json({
        message: `Revalidated path: ${path}`,
        revalidated: true,
        now: Date.now(),
      })
    }

    return NextResponse.json(
      {
        message: "No tag or path provided",
        revalidated: false,
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      {
        message: "Error during revalidation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Revalidation endpoint is working",
    usage: {
      post_tag: 'POST /api/revalidate with { "tag": "store-data" }',
      post_path: 'POST /api/revalidate with { "path": "/store/pizzeria-don-mario" }',
      with_secret: 'Add { "secret": "your-secret" } for additional security',
    },
    timestamp: new Date().toISOString(),
  })
}
