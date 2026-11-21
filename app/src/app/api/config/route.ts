import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/runtimeConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getRuntimeConfig();
  return NextResponse.json(config, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
