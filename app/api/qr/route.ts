import { NextResponse } from "next/server"
import QRCode from "qrcode"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const data = searchParams.get("data") || ""

  if (!data) {
    return new NextResponse("Missing data", { status: 400 })
  }

  if (data.length > 512) {
    return new NextResponse("Data too long", { status: 400 })
  }

  try {
    const svg = await QRCode.toString(data, {
      type: "svg",
      margin: 1,
      width: 256,
      color: { dark: "#000000", light: "#ffffff" },
    })

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[qr] Failed to generate QR", error)
    return new NextResponse("Failed to generate QR", { status: 500 })
  }
}

