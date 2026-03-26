import { requireAuth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if ("response" in auth) {
    return auth.response
  }

  try {
    const params = await props.params
    const tableId = Number.parseInt(params.id, 10)
    
    const table = await sql`
      SELECT id, table_number, capacity, status, current_order_id, created_at, updated_at, reserved_from, reserved_to
      FROM "tables" 
      WHERE id = ${tableId}
    `

    if (table.length === 0) {
      return Response.json(
        { error: "Table not found" },
        { status: 404 }
      )
    }

    return Response.json(table[0])
  } catch (error) {
    console.error("[GET /api/tables/[id]]", error)
    return Response.json(
      { error: "Failed to fetch table" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if ("response" in auth) {
    return auth.response
  }

  try {
    const params = await props.params
    const tableId = Number.parseInt(params.id, 10)
    const body = await request.json()
    const { status, current_order_id } = body

    // Validate status
    if (!["available", "occupied", "reserved"].includes(status)) {
      return Response.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE "tables" 
      SET status = ${status}, current_order_id = ${current_order_id || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${tableId}
      RETURNING id, table_number, capacity, status, current_order_id, created_at, updated_at, reserved_from, reserved_to
    `

    if (result.length === 0) {
      return Response.json(
        { error: "Table not found" },
        { status: 404 }
      )
    }

    return Response.json(result[0])
  } catch (error) {
    console.error("[PUT /api/tables/[id]]", error)
    return Response.json(
      { error: "Failed to update table" },
      { status: 500 }
    )
  }
}
