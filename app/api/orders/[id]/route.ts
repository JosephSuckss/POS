import { neon } from '@neondatabase/serverless'

const getDatabaseUrl = () => {
  const url = 
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED

  if (!url) {
    throw new Error('No database connection string found')
  }
  return url
}

const sql = neon(getDatabaseUrl())

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    const orderId = params.id

    if (!status) {
      return Response.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    console.log(`[v0] Updating order ${orderId} status to ${status}`)

    const result = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${parseInt(orderId)}
      RETURNING id, status, updated_at
    `

    if (result.length === 0) {
      return Response.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('[v0] Order status updated successfully:', result[0])

    return Response.json(result[0], { status: 200 })
  } catch (error) {
    console.error('[v0] Error updating order status:', error)
    return Response.json(
      { 
        error: 'Failed to update order status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
