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

export async function GET() {
  try {
    console.log('[v0] Fetching orders from database...')
    
    const orders = await sql`
      SELECT 
        o.id,
        o.customer_id,
        o.total,
        o.subtotal,
        o.tax,
        o.discount,
        o.payment_method,
        o.status,
        o.created_at,
        o.updated_at,
        c.name as customer_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `

    console.log(`[v0] Successfully fetched ${orders.length} orders`)
    
    return Response.json(orders)
  } catch (error) {
    console.error('[v0] Error fetching orders:', error)
    return Response.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
