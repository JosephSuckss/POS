import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if ("response" in auth) {
    return auth.response
  }

  try {
    const tables = await sql`
      SELECT id, table_number, capacity, status, current_order_id, created_at, updated_at, reserved_from, reserved_to
      FROM "tables" 
      ORDER BY table_number ASC
    `

    return Response.json(tables || [])
  } catch (error) {
    console.error("[GET /api/tables]", error)
    return Response.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    )
  }
}
